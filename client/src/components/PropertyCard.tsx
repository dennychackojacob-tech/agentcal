import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, MapPin, Calendar, DollarSign, Bed, Bath, Square } from "lucide-react";
import type { Property } from "@shared/schema";

interface PropertyCardProps {
  property: Property;
  scheduledTime?: string;
  travelTime?: number; // minutes from previous appointment
  distance?: number; // miles from previous appointment
  onSchedule?: () => void;
  onViewDetails?: () => void;
  isOptimized?: boolean;
}

export default function PropertyCard({ 
  property, 
  scheduledTime, 
  travelTime, 
  distance, 
  onSchedule, 
  onViewDetails,
  isOptimized = false 
}: PropertyCardProps) {
  const formatPrice = (price: number | null) => {
    if (!price) return "Price on request";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatSquareFeet = (sqft: number | null) => {
    if (!sqft) return null;
    return new Intl.NumberFormat('en-US').format(sqft);
  };

  const getTravelTimeColor = (minutes?: number) => {
    if (!minutes) return "";
    if (minutes <= 15) return "bg-accent text-accent-foreground";
    if (minutes <= 30) return "bg-yellow-500 text-yellow-50";
    return "bg-destructive text-destructive-foreground";
  };

  return (
    <Card className={`hover-elevate ${isOptimized ? 'border-accent' : ''}`} data-testid={`card-property-${property.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Home className="w-4 h-4 text-muted-foreground" />
              <Badge variant="secondary" data-testid={`badge-type-${property.propertyType}`}>
                {property.propertyType}
              </Badge>
              {isOptimized && (
                <Badge className="bg-accent text-accent-foreground" data-testid="badge-optimized">
                  Optimized
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg leading-tight" data-testid={`text-address-${property.id}`}>
              {property.address}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {property.city}, {property.state} {property.zipCode}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-primary" data-testid={`text-price-${property.id}`}>
              {formatPrice(property.price)}
            </div>
            {scheduledTime && (
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {scheduledTime}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Property Details */}
          <div className="flex items-center gap-4 text-sm">
            {property.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4 text-muted-foreground" />
                <span data-testid={`text-bedrooms-${property.id}`}>{property.bedrooms} bed</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4 text-muted-foreground" />
                <span data-testid={`text-bathrooms-${property.id}`}>{property.bathrooms} bath</span>
              </div>
            )}
            {property.squareFeet && (
              <div className="flex items-center gap-1">
                <Square className="w-4 h-4 text-muted-foreground" />
                <span data-testid={`text-sqft-${property.id}`}>{formatSquareFeet(property.squareFeet)} sqft</span>
              </div>
            )}
          </div>

          {/* Travel Info */}
          {(travelTime || distance) && (
            <div className="flex items-center gap-2">
              {travelTime && (
                <Badge 
                  className={getTravelTimeColor(travelTime)}
                  data-testid={`badge-travel-time-${property.id}`}
                >
                  {travelTime}min travel
                </Badge>
              )}
              {distance && (
                <Badge variant="outline" data-testid={`badge-distance-${property.id}`}>
                  {(distance * 1.60934).toFixed(1)} km
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onViewDetails}
              data-testid={`button-view-details-${property.id}`}
            >
              View Details
            </Button>
            {onSchedule && (
              <Button 
                size="sm" 
                onClick={onSchedule}
                data-testid={`button-schedule-${property.id}`}
              >
                {scheduledTime ? 'Reschedule' : 'Schedule Showing'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}