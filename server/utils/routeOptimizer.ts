import { calculateDistance, estimateTravelTime, calculateDistanceMatrix } from './distance';
import type { Appointment, Property, RouteStop, DailySchedule, Agent } from '@shared/schema';

interface AppointmentWithProperty {
  appointment: Appointment;
  property: Property;
}

/**
 * Optimize route using Nearest Neighbor algorithm
 * This is a greedy approach that always picks the closest unvisited property
 */
export function optimizeRoute(
  appointments: Appointment[],
  properties: Map<string, Property>,
  agent: Agent,
  date: string
): DailySchedule {
  // Convert to array with properties
  const appointmentsWithProps: AppointmentWithProperty[] = appointments
    .map(apt => {
      const property = properties.get(apt.propertyId);
      return property ? { appointment: apt, property } : null;
    })
    .filter((item): item is AppointmentWithProperty => item !== null);

  if (appointmentsWithProps.length === 0) {
    return {
      date,
      agent,
      stops: [],
      totalDistance: 0,
      totalTravelTime: 0,
      optimized: true
    };
  }

  if (appointmentsWithProps.length === 1) {
    return {
      date,
      agent,
      stops: [{
        appointment: appointmentsWithProps[0].appointment,
        property: appointmentsWithProps[0].property,
        estimatedTravelTime: undefined,
        distanceFromPrevious: undefined
      }],
      totalDistance: 0,
      totalTravelTime: 0,
      optimized: true
    };
  }

  // Extract locations with valid coordinates
  const validItems = appointmentsWithProps.filter(
    item => item.property.latitude && item.property.longitude
  );

  if (validItems.length === 0) {
    // If no valid coordinates, return appointments in original order
    return {
      date,
      agent,
      stops: appointmentsWithProps.map(item => ({
        appointment: item.appointment,
        property: item.property,
        estimatedTravelTime: undefined,
        distanceFromPrevious: undefined
      })),
      totalDistance: 0,
      totalTravelTime: 0,
      optimized: false
    };
  }

  // Apply Nearest Neighbor algorithm
  const optimizedOrder = nearestNeighbor(validItems);
  
  // Calculate distances and travel times
  const stops: RouteStop[] = [];
  let totalDistance = 0;
  let totalTravelTime = 0;

  for (let i = 0; i < optimizedOrder.length; i++) {
    const current = optimizedOrder[i];
    let distanceFromPrevious: number | undefined;
    let estimatedTravelTime: number | undefined;

    if (i > 0) {
      const previous = optimizedOrder[i - 1];
      distanceFromPrevious = calculateDistance(
        parseFloat(previous.property.latitude!),
        parseFloat(previous.property.longitude!),
        parseFloat(current.property.latitude!),
        parseFloat(current.property.longitude!)
      );
      estimatedTravelTime = estimateTravelTime(distanceFromPrevious);
      totalDistance += distanceFromPrevious;
      totalTravelTime += estimatedTravelTime;
    }

    stops.push({
      appointment: current.appointment,
      property: current.property,
      distanceFromPrevious,
      estimatedTravelTime
    });
  }

  return {
    date,
    agent,
    stops,
    totalDistance,
    totalTravelTime,
    optimized: true
  };
}

/**
 * Nearest Neighbor algorithm for TSP
 * Always picks the closest unvisited property
 */
function nearestNeighbor(items: AppointmentWithProperty[]): AppointmentWithProperty[] {
  if (items.length <= 1) return items;

  const unvisited = [...items];
  const route: AppointmentWithProperty[] = [];
  
  // Start with the first appointment (could be optimized to start with earliest time)
  let current = unvisited.shift()!;
  route.push(current);

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const distance = calculateDistance(
        parseFloat(current.property.latitude!),
        parseFloat(current.property.longitude!),
        parseFloat(unvisited[i].property.latitude!),
        parseFloat(unvisited[i].property.longitude!)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    current = unvisited.splice(nearestIndex, 1)[0];
    route.push(current);
  }

  return route;
}

/**
 * Calculate total distance for a given route
 */
export function calculateRouteDistance(
  route: AppointmentWithProperty[]
): number {
  let totalDistance = 0;

  for (let i = 1; i < route.length; i++) {
    const prev = route[i - 1];
    const curr = route[i];
    
    if (prev.property.latitude && prev.property.longitude &&
        curr.property.latitude && curr.property.longitude) {
      totalDistance += calculateDistance(
        parseFloat(prev.property.latitude),
        parseFloat(prev.property.longitude),
        parseFloat(curr.property.latitude),
        parseFloat(curr.property.longitude)
      );
    }
  }

  return totalDistance;
}