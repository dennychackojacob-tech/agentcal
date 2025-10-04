import type { ShowingSlot, Property, Client, BookingRequest, InsertBookingRequest } from "@shared/schema";
import type { IStorage } from "../storage";

// Helper to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Calculate travel time in minutes based on distance (km) and average speed
function calculateTravelTime(distanceKm: number, avgSpeedKmh: number = 55): number {
  return Math.ceil((distanceKm / avgSpeedKmh) * 60); // Convert to minutes and round up
}

// Parse time string to minutes since midnight
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// Slot candidate with feasibility data
interface SlotCandidate {
  slot: ShowingSlot;
  property: Property;
  startMinutes: number;
  endMinutes: number;
  clientIds: string[]; // Clients interested in this property
}

// Booking request candidate with routing data
interface BookingCandidate {
  slot: ShowingSlot;
  property: Property;
  clientIds: string[];
  travelTimeFromPrevious?: number;
  distanceFromPrevious?: number;
}

/**
 * Automated booking orchestrator that searches for available showing slots
 * and creates optimal booking requests based on time availability and travel distances
 */
export async function generateBookingRequests(
  storage: IStorage,
  agentId: string,
  date: Date,
  clientIds: string[], // Clients to schedule
  startLocation: { lat: number; lng: number },
  startTime: string = "09:00",
  endTime: string = "17:00"
): Promise<BookingRequest[]> {
  
  // Step 1: Get all clients and their property preferences
  const clients = await Promise.all(
    clientIds.map(id => storage.getClient(id))
  );
  const validClients = clients.filter((c): c is Client => c !== undefined);

  if (validClients.length === 0) {
    throw new Error("No valid clients found");
  }

  // Get all property preferences for these clients
  const allPreferences = await Promise.all(
    validClients.map(c => storage.getPreferencesByClient(c.id))
  );

  // Build map of propertyId -> clientIds interested in it
  const propertyClientMap = new Map<string, string[]>();
  for (let i = 0; i < validClients.length; i++) {
    const clientId = validClients[i].id;
    const prefs = allPreferences[i];
    for (const pref of prefs) {
      const existing = propertyClientMap.get(pref.propertyId) || [];
      existing.push(clientId);
      propertyClientMap.set(pref.propertyId, existing);
    }
  }

  // Step 2: Get all showing slots for the target date
  const allSlots = await storage.getAllShowingSlots();
  const dateStr = date.toDateString();
  const relevantSlots = allSlots.filter(slot => {
    const slotDate = new Date(slot.date);
    return slotDate.toDateString() === dateStr;
  });

  // Get existing booking requests for this date to avoid double-booking
  const existingRequests = await storage.getBookingRequestsByDate(agentId, date);
  const bookedSlotIds = new Set(
    existingRequests
      .filter(req => req.status === "pending" || req.status === "confirmed")
      .map(req => req.slotId)
  );

  // Step 3: Get properties and build slot candidates
  const propertyIds = Array.from(propertyClientMap.keys());
  const properties = await Promise.all(
    propertyIds.map(id => storage.getProperty(id))
  );
  const validProperties = properties.filter((p): p is Property => p !== undefined);

  const slotCandidates: SlotCandidate[] = [];
  for (const slot of relevantSlots) {
    // Skip already booked slots or slots with pending/confirmed requests
    if (slot.isBooked === "true" || bookedSlotIds.has(slot.id)) {
      continue;
    }

    const property = validProperties.find(p => p.id === slot.propertyId);
    const clientsInterested = propertyClientMap.get(slot.propertyId);
    
    if (property && clientsInterested && clientsInterested.length > 0) {
      // Check capacity
      if (clientsInterested.length <= slot.maxCapacity) {
        slotCandidates.push({
          slot,
          property,
          startMinutes: timeToMinutes(slot.startTime),
          endMinutes: timeToMinutes(slot.endTime),
          clientIds: clientsInterested
        });
      }
    }
  }

  // Sort by start time
  slotCandidates.sort((a, b) => a.startMinutes - b.startMinutes);

  // Step 4: Build feasibility graph and select optimal bookings
  const selectedBookings: BookingCandidate[] = [];
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  let currentTime = startMinutes;
  let currentLocation = startLocation;

  // Track which properties we've already booked (no double bookings)
  const bookedProperties = new Set<string>();

  for (const candidate of slotCandidates) {
    // Skip if outside agent's working hours
    if (candidate.startMinutes < startMinutes || candidate.endMinutes > endMinutes) {
      continue;
    }

    // Skip if property already booked
    if (bookedProperties.has(candidate.property.id)) {
      continue;
    }

    // Skip if property has no coordinates
    if (!candidate.property.latitude || !candidate.property.longitude) {
      continue;
    }

    // Calculate travel time to this property
    const distance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      parseFloat(candidate.property.latitude),
      parseFloat(candidate.property.longitude)
    );
    const travelTime = calculateTravelTime(distance);

    // Check if we can arrive before the slot starts
    const arrivalTime = currentTime + travelTime;
    
    if (arrivalTime > candidate.startMinutes) {
      // Can't make it in time - skip this property
      continue;
    }

    // This booking is feasible!
    selectedBookings.push({
      slot: candidate.slot,
      property: candidate.property,
      clientIds: candidate.clientIds,
      travelTimeFromPrevious: selectedBookings.length > 0 ? travelTime : undefined,
      distanceFromPrevious: selectedBookings.length > 0 ? distance : undefined
    });

    // Update current state
    bookedProperties.add(candidate.property.id);
    currentTime = candidate.endMinutes; // Update to end of this showing
    currentLocation = {
      lat: parseFloat(candidate.property.latitude),
      lng: parseFloat(candidate.property.longitude)
    };
  }

  // Step 5: Create booking requests
  const bookingRequests: BookingRequest[] = [];
  
  for (const booking of selectedBookings) {
    const request = await storage.createBookingRequest({
      agentId,
      propertyId: booking.property.id,
      slotId: booking.slot.id,
      clientIds: booking.clientIds,
      status: "pending",
      notes: `Automated booking request for ${booking.clientIds.length} client(s)`,
      travelTimeFromPrevious: booking.travelTimeFromPrevious,
      distanceFromPrevious: booking.distanceFromPrevious ? booking.distanceFromPrevious.toString() : undefined
    });
    bookingRequests.push(request);
  }

  return bookingRequests;
}

/**
 * Confirm a booking request and create appointments
 */
export async function confirmBookingRequest(
  storage: IStorage,
  requestId: string
): Promise<void> {
  const request = await storage.getBookingRequest(requestId);
  if (!request) {
    throw new Error("Booking request not found");
  }

  if (request.status !== "pending") {
    throw new Error("Only pending requests can be confirmed");
  }

  const slot = await storage.getShowingSlot(request.slotId);
  if (!slot) {
    throw new Error("Showing slot not found");
  }

  // Create appointment for each client
  const clients = await Promise.all(
    request.clientIds.map(id => storage.getClient(id))
  );

  const slotDate = new Date(slot.date);
  const [startHour, startMinute] = slot.startTime.split(':').map(Number);
  const [endHour, endMinute] = slot.endTime.split(':').map(Number);
  
  const appointmentStart = new Date(slotDate);
  appointmentStart.setHours(startHour, startMinute, 0, 0);
  
  const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);

  for (const client of clients) {
    if (!client) continue;
    
    await storage.createAppointment({
      agentId: request.agentId,
      propertyId: request.propertyId,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email || undefined,
      clientPhone: client.phone || undefined,
      scheduledDate: appointmentStart,
      duration,
      status: "scheduled",
      notes: `Confirmed from booking request`,
      bookingRequestId: requestId
    });
  }

  // Update request status
  await storage.updateBookingRequest(requestId, {
    status: "confirmed",
    respondedAt: new Date()
  });
}

/**
 * Reject a booking request
 */
export async function rejectBookingRequest(
  storage: IStorage,
  requestId: string,
  reason?: string
): Promise<void> {
  const request = await storage.getBookingRequest(requestId);
  if (!request) {
    throw new Error("Booking request not found");
  }

  if (request.status !== "pending") {
    throw new Error("Only pending requests can be rejected");
  }

  await storage.updateBookingRequest(requestId, {
    status: "rejected",
    respondedAt: new Date(),
    notes: reason ? `Rejected: ${reason}` : request.notes
  });
}
