import ScheduleTimeline from '../ScheduleTimeline';
import type { DailySchedule, RouteStop, Agent, Property, Appointment } from '@shared/schema';

export default function ScheduleTimelineExample() {
  //todo: remove mock functionality
  const mockAgent: Agent = {
    id: "agent1",
    name: "Sarah Johnson",
    email: "sarah@realestate.com",
    phone: "(555) 123-4567"
  };

  const mockProperties: Property[] = [
    {
      id: "prop1",
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
    },
    {
      id: "prop2", 
      address: "456 Pine Avenue",
      city: "San Francisco",
      state: "CA",
      zipCode: "94103",
      latitude: "37.7849295",
      longitude: "-122.4094155",
      price: 875000,
      bedrooms: 2,
      bathrooms: 1,
      squareFeet: 1200,
      propertyType: "condo",
      status: "available"
    }
  ];

  const mockAppointments: Appointment[] = [
    {
      id: "appt1",
      agentId: "agent1",
      propertyId: "prop1",
      clientName: "John & Mary Smith",
      clientEmail: "john.smith@email.com",
      clientPhone: "(555) 987-6543",
      scheduledDate: new Date('2024-01-15T14:00:00'),
      duration: 60,
      status: "scheduled",
      notes: "First time buyers, interested in schools nearby"
    },
    {
      id: "appt2",
      agentId: "agent1", 
      propertyId: "prop2",
      clientName: "Lisa Chen",
      clientEmail: "lisa.chen@email.com",
      clientPhone: "(555) 456-7890",
      scheduledDate: new Date('2024-01-15T16:00:00'),
      duration: 45,
      status: "scheduled",
      notes: "Looking for investment property"
    }
  ];

  const mockStops: RouteStop[] = mockAppointments.map((appointment, index) => ({
    appointment,
    property: mockProperties[index],
    estimatedTravelTime: index === 0 ? undefined : 12,
    distanceFromPrevious: index === 0 ? undefined : 2.3
  }));

  const mockSchedule: DailySchedule = {
    date: '2024-01-15',
    agent: mockAgent,
    stops: mockStops,
    totalDistance: 4.6,
    totalTravelTime: 24,
    optimized: true
  };

  const handleOptimize = () => {
    console.log('Optimize route triggered');
  };

  const handleReorderStops = (stops: RouteStop[]) => {
    console.log('Reorder stops triggered:', stops);
  };

  return (
    <div className="max-w-3xl">
      <ScheduleTimeline 
        schedule={mockSchedule}
        onOptimize={handleOptimize}
        onReorderStops={handleReorderStops}
      />
    </div>
  );
}