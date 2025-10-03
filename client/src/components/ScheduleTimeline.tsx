import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, MapPin, Car, Route, Zap, ArrowUpDown } from "lucide-react";
import type { DailySchedule, RouteStop } from "@shared/schema";

interface ScheduleTimelineProps {
  schedule: DailySchedule;
  onOptimize?: () => void;
  onReorderStops?: (stops: RouteStop[]) => void;
}

export default function ScheduleTimeline({ schedule, onOptimize, onReorderStops }: ScheduleTimelineProps) {
  const [selectedClient, setSelectedClient] = useState<string>("all");
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Get unique client names
  const clients = Array.from(new Set(schedule.stops.map(stop => stop.appointment.clientName)));

  // Filter stops by selected client
  const filteredStops = selectedClient === "all" 
    ? schedule.stops 
    : schedule.stops.filter(stop => stop.appointment.clientName === selectedClient);

  // Calculate stats for filtered appointments
  const filteredStats = filteredStops.reduce((acc, stop, index) => {
    if (index > 0 && stop.distanceFromPrevious) {
      acc.totalDistance += stop.distanceFromPrevious;
    }
    if (stop.estimatedTravelTime) {
      acc.totalTravelTime += stop.estimatedTravelTime;
    }
    return acc;
  }, { totalDistance: 0, totalTravelTime: 0 });

  return (
    <Card data-testid="card-schedule-timeline">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Daily Schedule - {new Date(schedule.date).toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Car className="w-4 h-4" />
                {selectedClient === "all" 
                  ? (schedule.totalDistance * 1.60934).toFixed(1) 
                  : (filteredStats.totalDistance * 1.60934).toFixed(1)} km
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {selectedClient === "all"
                  ? formatDuration(schedule.totalTravelTime)
                  : formatDuration(filteredStats.totalTravelTime)} travel
              </div>
              <div className="flex items-center gap-1">
                {schedule.optimized ? (
                  <>
                    <Zap className="w-4 h-4 text-accent" />
                    <span className="text-accent font-medium">Optimized Route</span>
                  </>
                ) : (
                  <span>Not optimized</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-48" data-testid="select-filter-client">
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients ({schedule.stops.length})</SelectItem>
                {clients.map((client) => {
                  const count = schedule.stops.filter(s => s.appointment.clientName === client).length;
                  return (
                    <SelectItem key={client} value={client}>
                      {client} ({count})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {onOptimize && !schedule.optimized && (
              <Button 
                onClick={onOptimize}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                data-testid="button-optimize-route"
              >
                <Zap className="w-4 h-4 mr-2" />
                Optimize Route
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredStops.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No appointments found for this client.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStops.map((stop, index) => {
            const appointmentTime = new Date(stop.appointment.scheduledDate);
            const endTime = new Date(appointmentTime.getTime() + stop.appointment.duration * 60000);

            return (
              <div key={stop.appointment.id} className="relative">
                {/* Timeline Connection Line */}
                {index < filteredStops.length - 1 && (
                  <div className="absolute left-8 top-16 w-0.5 h-12 bg-border z-0" />
                )}
                
                <div className="flex gap-4" data-testid={`timeline-stop-${index}`}>
                  {/* Timeline Dot */}
                  <div className={`
                    w-4 h-4 rounded-full border-2 bg-background flex-shrink-0 mt-3 z-10
                    ${schedule.optimized ? 'border-accent' : 'border-primary'}
                  `} />

                  {/* Stop Content */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-card border border-card-border rounded-lg p-4 hover-elevate">
                      {/* Time and Travel Info */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="font-mono text-sm font-medium" data-testid={`text-time-${index}`}>
                            {formatTime(appointmentTime)} - {formatTime(endTime)}
                          </div>
                          {stop.estimatedTravelTime && index > 0 && (
                            <Badge 
                              variant="outline" 
                              className={`
                                ${stop.estimatedTravelTime <= 15 ? 'border-accent text-accent' : ''}
                                ${stop.estimatedTravelTime > 30 ? 'border-destructive text-destructive' : ''}
                              `}
                              data-testid={`badge-travel-${index}`}
                            >
                              {stop.estimatedTravelTime}min from previous
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary" data-testid={`badge-duration-${index}`}>
                          {formatDuration(stop.appointment.duration)}
                        </Badge>
                      </div>

                      {/* Property Info */}
                      <div className="space-y-2">
                        <h4 className="font-semibold" data-testid={`text-property-address-${index}`}>
                          {stop.property.address}
                        </h4>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {stop.property.city}, {stop.property.state} {stop.property.zipCode}
                        </div>
                        <div className="text-sm">
                          <strong>Client:</strong> {stop.appointment.clientName}
                          {stop.appointment.clientPhone && (
                            <span className="text-muted-foreground ml-2">
                              • {stop.appointment.clientPhone}
                            </span>
                          )}
                        </div>
                        {stop.appointment.notes && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Notes:</strong> {stop.appointment.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}