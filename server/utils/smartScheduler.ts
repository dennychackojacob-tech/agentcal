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
  startingLocation: { lat: number; lng: number }
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

  // Step 4: Optimize route using nearest neighbor algorithm
  const scheduledAppointments: Appointment[] = [];
  const visitedSlots = new Set<string>();
  const visitedClientProperties = new Set<string>(); // Track client-property pairs
  let currentLocation = startingLocation;
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

  // Now optimize the route through selected candidates
  while (selectedCandidates.length > 0) {
    // Find nearest unscheduled property
    let nearestIndex = 0;
    let shortestDistance = Infinity;

    for (let i = 0; i < selectedCandidates.length; i++) {
      const candidate = selectedCandidates[i];
      if (!candidate.property.latitude || !candidate.property.longitude) continue;
      
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        parseFloat(candidate.property.latitude),
        parseFloat(candidate.property.longitude)
      );

      if (distance < shortestDistance && !visitedSlots.has(candidate.slot.id)) {
        shortestDistance = distance;
        nearestIndex = i;
      }
    }

    const selected = selectedCandidates[nearestIndex];
    
    // Check if slot is still available
    if (!visitedSlots.has(selected.slot.id)) {
      // Create appointment
      const [startHour, startMinute] = selected.slot.startTime.split(':').map(Number);
      const appointmentDate = new Date(date);
      appointmentDate.setHours(startHour, startMinute, 0, 0);

      const appointment = await storage.createAppointment({
        agentId,
        propertyId: selected.property.id,
        clientId: selected.client.id,
        clientName: selected.client.name,
        clientEmail: selected.client.email || undefined,
        clientPhone: selected.client.phone || undefined,
        scheduledDate: appointmentDate,
        duration: 60,
        status: 'scheduled',
        notes: `Smart scheduled - ${selected.client.notes || 'No notes'}`
      });

      // Mark slot as booked
      await storage.updateShowingSlot(selected.slot.id, {
        isBooked: 'true',
        bookedBy: selected.client.id
      });

      scheduledAppointments.push(appointment);
      visitedSlots.add(selected.slot.id);

      // Update current location and totals
      if (selected.property.latitude && selected.property.longitude) {
        totalDistance += shortestDistance;
        totalTravelTime += (shortestDistance / 35) * 60; // Assuming 35 mph average speed
        currentLocation = {
          lat: parseFloat(selected.property.latitude),
          lng: parseFloat(selected.property.longitude)
        };
      }
    }

    // Remove from candidates
    selectedCandidates.splice(nearestIndex, 1);
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
