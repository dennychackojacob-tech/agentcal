import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Map, 
  Home, 
  Clock, 
  Route, 
  Plus, 
  Settings,
  Bell,
  User,
  Users,
  ClipboardList
} from "lucide-react";
import PropertyCard from "./PropertyCard";
import ScheduleTimeline from "./ScheduleTimeline";
import RouteMap from "./RouteMap";
import SmartScheduler from "./SmartScheduler";
import PropertiesManager from "./PropertiesManager";
import { BookingQueue } from "./BookingQueue";
import type { DailySchedule, Property, Agent } from "@shared/schema";

interface DashboardProps {
  agent: Agent;
  schedule: DailySchedule;
  selectedDate: string;
  availableProperties: Property[];
  onScheduleProperty?: (propertyId: string) => void;
  onOptimizeRoute?: () => void;
  onDateChange?: (date: string) => void;
}

export default function Dashboard({ 
  agent, 
  schedule, 
  selectedDate,
  availableProperties,
  onScheduleProperty,
  onOptimizeRoute,
  onDateChange 
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState("schedule");

  const upcomingCount = schedule.stops.length;
  const nextAppointment = schedule.stops[0];
  
  const scheduleDate = new Date(selectedDate);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-main">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Route className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold">RouteWise</h1>
              </div>
              
              <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {scheduleDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button size="sm" variant="ghost" data-testid="button-notifications">
                <Bell className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" data-testid="button-settings">
                <Settings className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                <span className="font-medium" data-testid="text-agent-name">{agent.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card data-testid="card-today-appointments">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Appointments</p>
                  <p className="text-2xl font-bold">{upcomingCount}</p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-distance">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Distance</p>
                  <p className="text-2xl font-bold">{(schedule.totalDistance * 1.60934).toFixed(1)} km</p>
                </div>
                <Route className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-travel-time">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Travel Time</p>
                  <p className="text-2xl font-bold">{Math.round(schedule.totalTravelTime)}m</p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-route-status">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Route Status</p>
                  <Badge className={schedule.optimized ? "bg-accent text-accent-foreground" : ""}>
                    {schedule.optimized ? "Optimized" : "Not Optimized"}
                  </Badge>
                </div>
                <Map className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Appointment Card */}
        {nextAppointment && (
          <Card className="mb-6 border-accent/50" data-testid="card-next-appointment">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                Next Appointment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold" data-testid="text-next-property">
                    {nextAppointment.property.address}
                  </h3>
                  <p className="text-muted-foreground">
                    {nextAppointment.appointment.clientName} • {formatTime(new Date(nextAppointment.appointment.scheduledDate))}
                  </p>
                </div>
                <Button data-testid="button-view-directions">
                  View Directions
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop Tabs - Hidden on mobile */}
          <TabsList className="hidden md:grid w-full grid-cols-5" data-testid="dashboard-tabs-desktop">
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Bookings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{scheduleDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} Schedule</h2>
              <Button data-testid="button-add-appointment">
                <Plus className="w-4 h-4 mr-2" />
                Add Appointment
              </Button>
            </div>
            <ScheduleTimeline 
              schedule={schedule}
              onOptimize={onOptimizeRoute}
            />
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Route Map</h2>
              <div className="text-sm text-muted-foreground">
                {schedule.optimized ? "Route optimized" : "Route can be optimized"}
              </div>
            </div>
            <RouteMap 
              schedule={schedule}
              onOptimize={onOptimizeRoute}
            />
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <SmartScheduler agentId={agent.id} onDateChange={onDateChange} />
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <PropertiesManager agentId={agent.id} properties={availableProperties} />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <BookingQueue agentId={agent.id} />
          </TabsContent>
        </Tabs>

        {/* Mobile Bottom Navigation - Hidden on desktop */}
        <nav 
          className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-bottom"
          data-testid="mobile-bottom-nav"
        >
          <div className="grid grid-cols-5 h-16">
            <button
              onClick={() => setActiveTab("schedule")}
              className={`flex flex-col items-center justify-center gap-1 min-h-[4rem] hover-elevate active-elevate-2 ${
                activeTab === "schedule" ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label="Schedule"
              aria-current={activeTab === "schedule" ? "page" : undefined}
              data-testid="mobile-nav-schedule"
            >
              <Calendar className="w-5 h-5" />
              <span className="text-xs font-medium">Schedule</span>
            </button>
            
            <button
              onClick={() => setActiveTab("map")}
              className={`flex flex-col items-center justify-center gap-1 min-h-[4rem] hover-elevate active-elevate-2 ${
                activeTab === "map" ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label="Map View"
              aria-current={activeTab === "map" ? "page" : undefined}
              data-testid="mobile-nav-map"
            >
              <Map className="w-5 h-5" />
              <span className="text-xs font-medium">Map</span>
            </button>
            
            <button
              onClick={() => setActiveTab("clients")}
              className={`flex flex-col items-center justify-center gap-1 min-h-[4rem] hover-elevate active-elevate-2 ${
                activeTab === "clients" ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label="Clients"
              aria-current={activeTab === "clients" ? "page" : undefined}
              data-testid="mobile-nav-clients"
            >
              <Users className="w-5 h-5" />
              <span className="text-xs font-medium">Clients</span>
            </button>
            
            <button
              onClick={() => setActiveTab("properties")}
              className={`flex flex-col items-center justify-center gap-1 min-h-[4rem] hover-elevate active-elevate-2 ${
                activeTab === "properties" ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label="Properties"
              aria-current={activeTab === "properties" ? "page" : undefined}
              data-testid="mobile-nav-properties"
            >
              <Home className="w-5 h-5" />
              <span className="text-xs font-medium">Properties</span>
            </button>
            
            <button
              onClick={() => setActiveTab("bookings")}
              className={`flex flex-col items-center justify-center gap-1 min-h-[4rem] hover-elevate active-elevate-2 ${
                activeTab === "bookings" ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label="Bookings"
              aria-current={activeTab === "bookings" ? "page" : undefined}
              data-testid="mobile-nav-bookings"
            >
              <ClipboardList className="w-5 h-5" />
              <span className="text-xs font-medium">Bookings</span>
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
}