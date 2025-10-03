import { storage } from '../storage';
import type { Client, Property, ShowingSlot, PropertyPreference, Appointment } from '@shared/schema';

interface ScheduleCandidate {
  client: Client;
  property: Property;
  slot: ShowingSlot;
  preference: PropertyPreference;
}

interface OptimizedScheduleResult {
  appointments: Appointment[];
  totalDistance: number;
  totalTravelTime: number;
  clientsScheduled: number;
  propertiesVisited: number;
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function generateSmartSchedule(
  agentId: string,
  date: Date,
  startingLocation: { lat: number; lng: number },
  startTime: string = "08:00" // Agent's starting time (default 8:00 AM)
): Promise<OptimizedScheduleResult> {
  // Get the day of the week for the date
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Step 1: Find clients available on this day
  const allClients = await storage.getClientsByAgent(agentId);
  const availableClients = allClients.filter(client => 
    client.preferredDays && client.preferredDays.includes(dayOfWeek)
  );

  if (availableClients.length === 0) {
    return {
      appointments: [],
      totalDistance: 0,
      totalTravelTime: 0,
      clientsScheduled: 0,
      propertiesVisited: 0
    };
  }

  // Step 2: Get property preferences and available slots for each client
  const candidates: ScheduleCandidate[] = [];
  
  for (const client of availableClients) {
    const preferences = await storage.getPreferencesByClient(client.id);
    
    for (const preference of preferences) {
      const property = await storage.getProperty(preference.propertyId);
      if (!property) continue;
      
      const slots = await storage.getAvailableSlots(preference.propertyId, date);
      
      for (const slot of slots) {
        // Check if slot matches client's preferred time
        const slotHour = parseInt(slot.startTime.split(':')[0]);
        const timeSlot = slotHour < 12 ? 'morning' : slotHour < 17 ? 'afternoon' : 'evening';
        
        if (client.preferredTimeSlots && client.preferredTimeSlots.includes(timeSlot)) {
          candidates.push({ client, property, slot, preference });
        }
      }
    }
  }

  if (candidates.length === 0) {
    return {
      appointments: [],
      totalDistance: 0,
      totalTravelTime: 0,
      clientsScheduled: 0,
      propertiesVisited: 0
    };
  }

  // Step 3: Sort candidates by priority and time
  candidates.sort((a, b) => {
    // First by priority (lower number = higher priority)
    if (a.preference.priority !== b.preference.priority) {
      return (a.preference.priority || 99) - (b.preference.priority || 99);
    }
    // Then by time slot
    return a.slot.startTime.localeCompare(b.slot.startTime);
  });

  // Step 4: Build chronological schedule with travel-time awareness
  const scheduledAppointments: Appointment[] = [];
  const visitedSlots = new Set<string>();
  const visitedClientProperties = new Set<string>();
  let currentLocation = startingLocation;
  
  // Initialize current time with agent's start time
  const [startHour, startMinute] = startTime.split(':').map(Number);
  let currentTime = new Date(date);
  currentTime.setHours(startHour, startMinute, 0, 0);
  
  let totalDistance = 0;
  let totalTravelTime = 0;

  // First, select one candidate per client-property pair, prioritizing high priority
  const selectedCandidates: ScheduleCandidate[] = [];
  
  for (const candidate of candidates) {
    const key = `${candidate.client.id}-${candidate.property.id}`;
    if (!visitedClientProperties.has(key)) {
      selectedCandidates.push(candidate);
      visitedClientProperties.add(key);
    }
  }

  // Helper function to parse time slot to minutes since midnight
  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper function to calculate travel time in minutes
  const calculateTravelTime = (distance: number): number => {
    return Math.ceil((distance / 35) * 60); // 35 mph average speed, rounded up
  };

  // Build schedule chronologically
  while (selectedCandidates.length > 0) {
    let bestCandidate: ScheduleCandidate | null = null;
    let bestCandidateIndex = -1;
    let shortestDistance = Infinity;

    // Find the best candidate that fits chronologically
    for (let i = 0; i < selectedCandidates.length; i++) {
      const candidate = selectedCandidates[i];
      
      if (!candidate.property.latitude || !candidate.property.longitude) continue;
      if (visitedSlots.has(candidate.slot.id)) continue;

      // Calculate distance and travel time to this property
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        parseFloat(candidate.property.latitude),
        parseFloat(candidate.property.longitude)
      );
      const travelTimeMinutes = calculateTravelTime(distance);

      // Check if this slot is feasible given current time
      if (currentTime) {
        const currentEndMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const earliestNextStart = currentEndMinutes + travelTimeMinutes;
        const slotStartMinutes = timeToMinutes(candidate.slot.startTime);

        // Skip if slot starts before we can arrive
        if (slotStartMinutes < earliestNextStart) {
          continue;
        }
      }

      // Among feasible candidates, choose the one with shortest distance
      if (distance < shortestDistance) {
        shortestDistance = distance;
        bestCandidate = candidate;
        bestCandidateIndex = i;
      }
    }

    // If no feasible candidate found, we're done
    if (!bestCandidate || bestCandidateIndex === -1) {
      break;
    }

    // Schedule this appointment
    const [startHour, startMinute] = bestCandidate.slot.startTime.split(':').map(Number);
    const [endHour, endMinute] = bestCandidate.slot.endTime.split(':').map(Number);
    
    const appointmentStartDate = new Date(date);
    appointmentStartDate.setHours(startHour, startMinute, 0, 0);
    
    const appointmentEndDate = new Date(date);
    appointmentEndDate.setHours(endHour, endMinute, 0, 0);

    const appointment = await storage.createAppointment({
      agentId,
      propertyId: bestCandidate.property.id,
      clientId: bestCandidate.client.id,
      clientName: bestCandidate.client.name,
      clientEmail: bestCandidate.client.email || undefined,
      clientPhone: bestCandidate.client.phone || undefined,
      scheduledDate: appointmentStartDate,
      duration: (endHour * 60 + endMinute) - (startHour * 60 + startMinute),
      status: 'scheduled',
      notes: `Smart scheduled - ${bestCandidate.client.notes || 'No notes'}`
    });

    // Mark slot as booked
    await storage.updateShowingSlot(bestCandidate.slot.id, {
      isBooked: 'true',
      bookedBy: bestCandidate.client.id
    });

    scheduledAppointments.push(appointment);
    visitedSlots.add(bestCandidate.slot.id);

    // Update current location, time, and totals
    if (bestCandidate.property.latitude && bestCandidate.property.longitude) {
      totalDistance += shortestDistance;
      totalTravelTime += calculateTravelTime(shortestDistance);
      currentLocation = {
        lat: parseFloat(bestCandidate.property.latitude),
        lng: parseFloat(bestCandidate.property.longitude)
      };
      currentTime = appointmentEndDate;
    }

    // Remove scheduled candidate
    selectedCandidates.splice(bestCandidateIndex, 1);
  }

  const uniqueClients = new Set(scheduledAppointments.map(a => a.clientId)).size;
  const uniqueProperties = new Set(scheduledAppointments.map(a => a.propertyId)).size;

  return {
    appointments: scheduledAppointments,
    totalDistance,
    totalTravelTime,
    clientsScheduled: uniqueClients,
    propertiesVisited: uniqueProperties
  };
}
