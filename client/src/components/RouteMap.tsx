import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, Navigation, Route, Zap, Loader2 } from "lucide-react";
import type { DailySchedule } from "@shared/schema";

interface RouteMapProps {
  schedule: DailySchedule;
  onOptimize?: () => void;
  className?: string;
}

export default function RouteMap({ schedule, onOptimize, className }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setError("Google Maps API key not found");
        setIsLoading(false);
        return;
      }

      try {
        // Set options once
        setOptions({
          apiKey: apiKey,
          version: "weekly",
        });

        // Import the maps library
        await importLibrary('maps');
        
        // Check if Google Maps loaded successfully
        if (!google || !google.maps) {
          throw new Error("Google Maps failed to load properly");
        }

        // Calculate center of all points
        const validStops = schedule.stops.filter(
          stop => stop.property.latitude && stop.property.longitude
        );

        if (validStops.length === 0) {
          setError("No valid coordinates found for properties");
          setIsLoading(false);
          return;
        }

        const bounds = new google.maps.LatLngBounds();
        validStops.forEach(stop => {
          bounds.extend({
            lat: parseFloat(stop.property.latitude!),
            lng: parseFloat(stop.property.longitude!)
          });
        });

        // Create map
        const map = new google.maps.Map(mapRef.current, {
          zoom: 12,
          center: bounds.getCenter(),
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        googleMapRef.current = map;

        // Fit bounds to show all markers
        map.fitBounds(bounds);

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Add markers for each stop
        const markers = validStops.map((stop, index) => {
          const position = {
            lat: parseFloat(stop.property.latitude!),
            lng: parseFloat(stop.property.longitude!)
          };

          const marker = new google.maps.Marker({
            position,
            map,
            label: {
              text: String(index + 1),
              color: "white",
              fontSize: "14px",
              fontWeight: "bold"
            },
            title: stop.property.address,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 20,
              fillColor: schedule.optimized ? "#9333ea" : "#7c3aed",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 3,
            }
          });

          // Add info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 250px;">
                <h4 style="margin: 0 0 8px 0; font-weight: 600;">${stop.property.address}</h4>
                <p style="margin: 4px 0; font-size: 13px; color: #666;">
                  ${stop.property.city}, ${stop.property.state} ${stop.property.zipCode}
                </p>
                <p style="margin: 4px 0; font-size: 13px;">
                  <strong>Time:</strong> ${new Date(stop.appointment.scheduledDate).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
                <p style="margin: 4px 0; font-size: 13px;">
                  <strong>Client:</strong> ${stop.appointment.clientName}
                </p>
                ${stop.estimatedTravelTime && index > 0 ? 
                  `<p style="margin: 4px 0; font-size: 13px; color: #9333ea;">
                    <strong>Travel time from previous:</strong> ${stop.estimatedTravelTime} min
                  </p>` : ''}
              </div>
            `
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });

          return marker;
        });

        markersRef.current = markers;

        // Draw route polyline
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
        }

        const path = validStops.map(stop => ({
          lat: parseFloat(stop.property.latitude!),
          lng: parseFloat(stop.property.longitude!)
        }));

        const polyline = new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: schedule.optimized ? "#9333ea" : "#7c3aed",
          strokeOpacity: 0.8,
          strokeWeight: 3,
          icons: [{
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              fillColor: schedule.optimized ? "#9333ea" : "#7c3aed",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 1,
            },
            offset: "100%",
            repeat: "100px"
          }]
        });

        polyline.setMap(map);
        polylineRef.current = polyline;

        setIsLoading(false);
      } catch (err) {
        console.error("Error loading Google Maps:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to load Google Maps: ${errorMessage}`);
        setIsLoading(false);
      }
    };

    initMap();

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [schedule]);

  return (
    <Card className={className} data-testid="card-route-map">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
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
          {/* Google Map */}
          <div className="relative bg-muted/30 rounded-lg h-96 border border-border overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading map...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                <div className="text-center p-4">
                  <p className="text-destructive font-medium">{error}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Please check your Google Maps API key configuration
                  </p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" data-testid="google-map-container" />
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
                  className="flex items-center gap-3 text-sm p-2 rounded bg-muted/30 hover-elevate cursor-pointer"
                  data-testid={`route-stop-${index}`}
                  onClick={() => {
                    // Center map on this marker
                    if (googleMapRef.current && stop.property.latitude && stop.property.longitude) {
                      const position = {
                        lat: parseFloat(stop.property.latitude),
                        lng: parseFloat(stop.property.longitude)
                      };
                      googleMapRef.current.panTo(position);
                      googleMapRef.current.setZoom(16);
                      
                      // Trigger marker click to show info window
                      if (markersRef.current[index]) {
                        google.maps.event.trigger(markersRef.current[index], 'click');
                      }
                    }
                  }}
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
