import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Dashboard from "@/components/Dashboard";
import NotFound from "@/pages/not-found";
import type { DailySchedule, RouteStop, Agent, Property, Appointment } from "@shared/schema";

function Router() {
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
    },
    {
      id: "prop3",
      address: "789 Market Boulevard",
      city: "San Francisco",
      state: "CA",
      zipCode: "94104", 
      latitude: "37.7949295",
      longitude: "-122.3994155",
      price: 2100000,
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2400,
      propertyType: "townhouse",
      status: "available"
    },
    {
      id: "prop4",
      address: "321 Elm Drive",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      latitude: "37.7649295", 
      longitude: "-122.4294155",
      price: 1650000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1950,
      propertyType: "house",
      status: "available"
    },
    {
      id: "prop5",
      address: "654 Cedar Lane",
      city: "San Francisco",
      state: "CA",
      zipCode: "94106",
      latitude: "37.7549295", 
      longitude: "-122.4394155",
      price: 995000,
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1350,
      propertyType: "condo",
      status: "available"
    },
    {
      id: "prop6",
      address: "987 Birch Court",
      city: "San Francisco",
      state: "CA",
      zipCode: "94107",
      latitude: "37.7449295", 
      longitude: "-122.4494155",
      price: 2750000,
      bedrooms: 5,
      bathrooms: 4,
      squareFeet: 3200,
      propertyType: "house",
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
      scheduledDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
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
      scheduledDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      duration: 45,
      status: "scheduled",
      notes: "Looking for investment property"
    },
    {
      id: "appt3",
      agentId: "agent1",
      propertyId: "prop3",
      clientName: "David Wilson", 
      clientEmail: "david.wilson@email.com",
      clientPhone: "(555) 321-0987",
      scheduledDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      duration: 75,
      status: "scheduled",
      notes: "Looking for family home with good schools"
    }
  ];

  const mockStops: RouteStop[] = mockAppointments.map((appointment, index) => ({
    appointment,
    property: mockProperties[index],
    estimatedTravelTime: index === 0 ? undefined : [15, 12][index - 1],
    distanceFromPrevious: index === 0 ? undefined : [2.8, 1.9][index - 1] 
  }));

  const mockTodaySchedule: DailySchedule = {
    date: new Date().toISOString().split('T')[0],
    agent: mockAgent,
    stops: mockStops,
    totalDistance: 8.2,
    totalTravelTime: 42,
    optimized: true
  };

  const handleScheduleProperty = (propertyId: string) => {
    console.log('Schedule property triggered:', propertyId);
  };

  const handleOptimizeRoute = () => {
    console.log('Optimize route triggered');
  };

  return (
    <Switch>
      <Route path="/" component={() => (
        <Dashboard 
          agent={mockAgent}
          todaySchedule={mockTodaySchedule}
          availableProperties={mockProperties}
          onScheduleProperty={handleScheduleProperty}
          onOptimizeRoute={handleOptimizeRoute}
        />
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="routewise-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
