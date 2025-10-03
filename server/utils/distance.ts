/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Estimate travel time based on distance
 * Assumes average speed of 25 mph in city
 * Returns time in minutes
 */
export function estimateTravelTime(distanceInMiles: number): number {
  const avgSpeedMph = 25;
  const timeInHours = distanceInMiles / avgSpeedMph;
  const timeInMinutes = Math.ceil(timeInHours * 60);
  
  // Add buffer time for stopping, parking, etc (2 minutes minimum)
  return Math.max(timeInMinutes + 2, 5);
}

/**
 * Calculate distance matrix between multiple locations
 * Returns a 2D array where matrix[i][j] is distance from location i to j
 */
export function calculateDistanceMatrix(
  locations: Array<{ lat: number; lon: number }>
): number[][] {
  const n = locations.length;
  const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        matrix[i][j] = calculateDistance(
          locations[i].lat,
          locations[i].lon,
          locations[j].lat,
          locations[j].lon
        );
      }
    }
  }
  
  return matrix;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}