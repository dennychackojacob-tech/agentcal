import PropertyCard from '../PropertyCard';
import type { Property } from '@shared/schema';

export default function PropertyCardExample() {
  //todo: remove mock functionality
  const mockProperty: Property = {
    id: "1",
    address: "123 Oak Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102",
    latitude: "37.7749295",
    longitude: "-122.4194155",
    price: 1250000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    propertyType: "house",
    status: "available"
  };

  const handleSchedule = () => {
    console.log('Schedule showing triggered for property:', mockProperty.id);
  };

  const handleViewDetails = () => {
    console.log('View details triggered for property:', mockProperty.id);
  };

  return (
    <div className="max-w-md">
      <PropertyCard 
        property={mockProperty}
        scheduledTime="2:00 PM"
        travelTime={12}
        distance={2.3}
        onSchedule={handleSchedule}
        onViewDetails={handleViewDetails}
        isOptimized={true}
      />
    </div>
  );
}