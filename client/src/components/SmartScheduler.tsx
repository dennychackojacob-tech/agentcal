import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Sparkles, MapPin, Users, CheckCircle2, Clock, Route } from "lucide-react";
import type { Client } from "@shared/schema";

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
  const [scheduleResult, setScheduleResult] = useState<SmartScheduleResult | null>(null);

  // Fetch clients
  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients', agentId],
    queryFn: async () => {
      const res = await fetch(`/api/clients?agentId=${agentId}`);
      return res.json();
    }
  });

  // Smart schedule mutation
  const smartScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate) throw new Error("No date selected");
      
      const res = await apiRequest("POST", "/api/smart-schedule", {
        agentId,
        date: selectedDate.toISOString().split('T')[0],
        startingLocation: { lat: 43.5890, lng: -79.6441 } // Mississauga
      });
      return res.json();
    },
    onSuccess: (data) => {
      setScheduleResult(data);
      // Update the main schedule date to show the newly created appointments
      if (onDateChange && selectedDate) {
        onDateChange(selectedDate.toISOString().split('T')[0]);
      }
      // Invalidate schedule queries to refresh the schedule view
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
    }
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

  const handleGenerateSchedule = () => {
    smartScheduleMutation.mutate();
  };

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
            Automatically create an optimized schedule based on client availability, property preferences, and showing slots
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Calendar Selection */}
            <div>
              <h3 className="text-sm font-medium mb-3">Select Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
                data-testid="calendar-smart-schedule"
              />
            </div>

            {/* Available Clients */}
            <div>
              <h3 className="text-sm font-medium mb-3">
                {selectedDate ? `Available Clients (${availableClients.length})` : `All Clients (${clients?.length || 0})`}
              </h3>
              {clientsLoading ? (
                <p className="text-sm text-muted-foreground">Loading clients...</p>
              ) : !clients || clients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No clients found</p>
              ) : !selectedDate ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {clients.map((client, index) => (
                    <Card key={client.id} data-testid={`card-client-${index}`}>
                      <CardContent className="p-3">
                        <div>
                          <p className="font-medium" data-testid={`text-client-name-${index}`}>{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.notes}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {client.preferredDays?.map(day => (
                              <Badge key={day} variant="secondary" className="text-xs">
                                {day}
                              </Badge>
                            ))}
                          </div>
                          {client.preferredTimeSlots && (
                            <div className="flex gap-1 mt-1">
                              {client.preferredTimeSlots.map(slot => (
                                <Badge key={slot} variant="outline" className="text-xs">
                                  {slot}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Select a date to filter available clients
                  </p>
                </div>
              ) : availableClients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No clients available on this day</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {availableClients.map((client, index) => (
                    <Card key={client.id} data-testid={`card-client-${index}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium" data-testid={`text-client-name-${index}`}>{client.name}</p>
                            <p className="text-xs text-muted-foreground">{client.notes}</p>
                            {client.preferredTimeSlots && (
                              <div className="flex gap-1 mt-2">
                                {client.preferredTimeSlots.map(slot => (
                                  <Badge key={slot} variant="outline" className="text-xs">
                                    {slot}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end">
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
