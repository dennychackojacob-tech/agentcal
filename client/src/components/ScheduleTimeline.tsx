import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Car, Route, Zap } from "lucide-react";
import type { DailySchedule, RouteStop } from "@shared/schema";

interface ScheduleTimelineProps {
  schedule: DailySchedule;
  onOptimize?: () => void;
  onReorderStops?: (stops: RouteStop[]) => void;
}

export default function ScheduleTimeline({ schedule, onOptimize, onReorderStops }: ScheduleTimelineProps) {
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

  return (
    <Card data-testid="card-schedule-timeline">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
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
                {schedule.totalDistance.toFixed(1)} miles
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(schedule.totalTravelTime)} travel
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
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {schedule.stops.map((stop, index) => {
            const appointmentTime = new Date(stop.appointment.scheduledDate);
            const endTime = new Date(appointmentTime.getTime() + stop.appointment.duration * 60000);

            return (
              <div key={stop.appointment.id} className="relative">
                {/* Timeline Connection Line */}
                {index < schedule.stops.length - 1 && (
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
      </CardContent>
    </Card>
  );
}