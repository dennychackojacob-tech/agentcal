import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, MapPin, Users, CheckCircle2, Clock, Route, Calendar as CalendarIcon, Home, User } from "lucide-react";
import type { Client, Property, PropertyPreference } from "@shared/schema";

interface SmartSchedulerProps {
  agentId: string;
  onDateChange?: (date: string) => void;
}

interface SmartScheduleResult {
  appointments: any[];
  totalDistance: number;
  totalTravelTime: number;
  clientsScheduled: number;
  propertiesVisited: number;
}

export default function SmartScheduler({ agentId, onDateChange }: SmartSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<string>>(new Set());
  const [scheduleResult, setScheduleResult] = useState<SmartScheduleResult | null>(null);

  // Fetch clients
  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients', agentId],
    queryFn: async () => {
      const res = await fetch(`/api/clients?agentId=${agentId}`);
      return res.json();
    }
  });

  // Fetch all properties
  const { data: properties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const res = await fetch('/api/properties');
      return res.json();
    }
  });

  // Fetch client's property preferences
  const { data: preferences } = useQuery<PropertyPreference[]>({
    queryKey: ['/api/property-preferences', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const res = await fetch(`/api/property-preferences?clientId=${selectedClientId}`);
      return res.json();
    },
    enabled: !!selectedClientId
  });

  // Get clients available for selected date
  const getAvailableClients = () => {
    if (!selectedDate || !clients) return [];
    
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    return clients.filter(client => 
      client.preferredDays && client.preferredDays.includes(dayOfWeek)
    );
  };

  const availableClients = getAvailableClients();

  // Smart schedule mutation
  const smartScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate) throw new Error("No date selected");
      
      const res = await apiRequest("POST", "/api/smart-schedule", {
        agentId,
        date: selectedDate.toISOString().split('T')[0],
        startingLocation: { lat: 43.5890, lng: -79.6441 }, // Mississauga
        selectedProperties: Array.from(selectedPropertyIds) // Send selected property IDs
      });
      return res.json();
    },
    onSuccess: (data) => {
      setScheduleResult(data);
      setSelectedPropertyIds(new Set()); // Clear selections after generation
      if (onDateChange && selectedDate) {
        onDateChange(selectedDate.toISOString().split('T')[0]);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/showing-slots'] });
    }
  });

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setScheduleResult(null);
  };

  const handleGenerateSchedule = () => {
    smartScheduleMutation.mutate();
  };

  const togglePropertySelection = (propertyId: string) => {
    const newSet = new Set(selectedPropertyIds);
    if (newSet.has(propertyId)) {
      newSet.delete(propertyId);
    } else {
      newSet.add(propertyId);
    }
    setSelectedPropertyIds(newSet);
  };

  const getClientProperties = () => {
    if (!preferences || !properties) return [];
    return preferences
      .map(pref => properties.find(p => p.id === pref.propertyId))
      .filter(Boolean) as Property[];
  };

  const clientProperties = getClientProperties();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            Smart Schedule Generator
          </CardTitle>
          <CardDescription>
            Select a date, choose client properties, and generate an optimized schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calendar Selection */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Select Date
            </h3>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border"
                data-testid="calendar-schedule-date"
              />
            </div>
          </div>

          {/* Client Tabs - Only show when date is selected */}
          {selectedDate && (
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Available Clients ({availableClients.length})
              </h3>
              
              {availableClients.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground text-center">
                      No clients available on this day
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Tabs value={selectedClientId || ""} onValueChange={setSelectedClientId}>
                  <div className="w-full overflow-x-auto">
                    <TabsList className="inline-flex w-auto min-w-full">
                      {availableClients.map((client) => (
                        <TabsTrigger
                          key={client.id}
                          value={client.id}
                          data-testid={`trigger-client-${client.id}`}
                          className="flex items-center gap-2 whitespace-nowrap"
                        >
                          <User className="w-4 h-4" />
                          <span className="hidden sm:inline">{client.name}</span>
                          <span className="sm:hidden">{client.name.split(' ')[0]}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {availableClients.map((client) => (
                    <TabsContent key={client.id} value={client.id} className="mt-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center justify-between">
                            <span>{client.name}'s Properties</span>
                            <Badge variant="secondary">
                              {clientProperties.length} assigned
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {client.notes || "No notes available"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {clientProperties.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">
                              No properties assigned to this client. Go to Properties tab to assign properties.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {clientProperties.map((property) => (
                                <div
                                  key={property.id}
                                  className="flex items-start gap-3 p-3 rounded-md border hover-elevate"
                                  data-testid={`property-item-${property.id}`}
                                >
                                  <Checkbox
                                    checked={selectedPropertyIds.has(property.id)}
                                    onCheckedChange={() => togglePropertySelection(property.id)}
                                    data-testid={`checkbox-property-${property.id}`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Home className="w-4 h-4 text-muted-foreground" />
                                      <Badge variant="secondary" className="text-xs">{property.propertyType}</Badge>
                                    </div>
                                    <h4 className="font-medium text-sm">{property.address}</h4>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {property.city}, {property.state}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleGenerateSchedule}
              disabled={!selectedDate || availableClients.length === 0 || smartScheduleMutation.isPending}
              data-testid="button-generate-schedule"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {smartScheduleMutation.isPending ? 'Generating...' : 'Generate Smart Schedule'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {scheduleResult && (
        <Card data-testid="card-schedule-results">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Schedule Generated Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent" data-testid="text-clients-scheduled">
                  {scheduleResult.clientsScheduled}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  Clients Scheduled
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent" data-testid="text-properties-visited">
                  {scheduleResult.propertiesVisited}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Properties
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent" data-testid="text-total-distance">
                  {(scheduleResult.totalDistance * 1.60934).toFixed(1)} km
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Route className="w-3 h-3" />
                  Total Distance
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent" data-testid="text-travel-time">
                  {Math.round(scheduleResult.totalTravelTime)}m
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  Travel Time
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground text-center pt-4 border-t">
              {scheduleResult.appointments.length} appointments created and showing slots booked. 
              View the schedule in the Schedule tab or Map View.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
