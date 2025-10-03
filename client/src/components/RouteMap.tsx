import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, Navigation, MapPin, Route, Zap } from "lucide-react";
import type { DailySchedule } from "@shared/schema";

interface RouteMapProps {
  schedule: DailySchedule;
  onOptimize?: () => void;
  className?: string;
}

export default function RouteMap({ schedule, onOptimize, className }: RouteMapProps) {
  // Mock map visualization - in a real app, this would integrate with a mapping service
  const mapPoints = schedule.stops.map((stop, index) => ({
    id: stop.property.id,
    lat: parseFloat(stop.property.latitude || "0"),
    lng: parseFloat(stop.property.longitude || "0"),
    address: stop.property.address,
    order: index + 1,
    time: new Date(stop.appointment.scheduledDate).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }));

  return (
    <Card className={className} data-testid="card-route-map">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Route Map
          </CardTitle>
          {onOptimize && !schedule.optimized && (
            <Button 
              size="sm" 
              onClick={onOptimize}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              data-testid="button-optimize-map"
            >
              <Zap className="w-4 h-4 mr-2" />
              Optimize
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Map Placeholder */}
          <div className="relative bg-muted/30 rounded-lg h-64 border border-border overflow-hidden">
            {/* Simulated Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950" />
            
            {/* Route Line Visualization */}
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                 refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" 
                    className={schedule.optimized ? "fill-accent" : "fill-primary"} />
                </marker>
              </defs>
              
              {mapPoints.slice(0, -1).map((point, index) => {
                const nextPoint = mapPoints[index + 1];
                const x1 = 20 + (index * 60);
                const y1 = 80 + Math.sin(index * 0.5) * 30;
                const x2 = 20 + ((index + 1) * 60);
                const y2 = 80 + Math.sin((index + 1) * 0.5) * 30;
                
                return (
                  <line
                    key={`route-${index}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className={schedule.optimized ? "stroke-accent" : "stroke-primary"}
                    strokeWidth="3"
                    strokeDasharray={schedule.optimized ? "0" : "5,5"}
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
            </svg>

            {/* Property Markers */}
            {mapPoints.map((point, index) => {
              const x = 20 + (index * 60);
              const y = 80 + Math.sin(index * 0.5) * 30;
              
              return (
                <div 
                  key={point.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: x, top: y }}
                  data-testid={`map-marker-${index}`}
                >
                  <div className={`
                    w-8 h-8 rounded-full border-2 bg-background flex items-center justify-center font-bold text-sm
                    ${schedule.optimized ? 'border-accent text-accent' : 'border-primary text-primary'}
                  `}>
                    {point.order}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
                    <div className="bg-background/90 backdrop-blur-sm border border-border rounded px-2 py-1 text-xs whitespace-nowrap shadow-sm">
                      {point.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button size="sm" variant="outline" className="w-8 h-8 p-0" data-testid="button-map-zoom-in">
                +
              </Button>
              <Button size="sm" variant="outline" className="w-8 h-8 p-0" data-testid="button-map-zoom-out">
                -
              </Button>
            </div>

            {/* Navigation Button */}
            <div className="absolute bottom-4 right-4">
              <Button 
                size="sm" 
                className="bg-primary/90 backdrop-blur-sm"
                data-testid="button-start-navigation"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Start Navigation
              </Button>
            </div>
          </div>

          {/* Route Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {(schedule.totalDistance * 1.60934).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Total Kilometers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(schedule.totalTravelTime)}
              </div>
              <div className="text-sm text-muted-foreground">Travel Minutes</div>
            </div>
          </div>

          {/* Stop List */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Route className="w-4 h-4" />
              Route Stops ({schedule.stops.length})
            </h4>
            <div className="space-y-1">
              {schedule.stops.map((stop, index) => (
                <div 
                  key={stop.appointment.id} 
                  className="flex items-center gap-3 text-sm p-2 rounded bg-muted/30"
                  data-testid={`route-stop-${index}`}
                >
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${schedule.optimized ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{stop.property.address}</div>
                    <div className="text-muted-foreground">
                      {new Date(stop.appointment.scheduledDate).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </div>
                  </div>
                  {stop.estimatedTravelTime && index > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {stop.estimatedTravelTime}m
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}