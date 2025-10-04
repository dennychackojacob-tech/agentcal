import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Home, MapPin, Bed, Bath, Square, DollarSign, Check } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Property, Client, PropertyPreference } from "@shared/schema";

interface PropertiesManagerProps {
  agentId: string;
  properties: Property[];
}

export default function PropertiesManager({ agentId, properties }: PropertiesManagerProps) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const { data: clients } = useQuery<Client[]>({
    queryKey: ['/api/clients', agentId],
    queryFn: async () => {
      const res = await fetch(`/api/clients?agentId=${agentId}`);
      return res.json();
    }
  });

  const { data: preferences } = useQuery<PropertyPreference[]>({
    queryKey: ['/api/property-preferences', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const res = await fetch(`/api/property-preferences?clientId=${selectedClientId}`);
      return res.json();
    },
    enabled: !!selectedClientId
  });

  const assignPropertyMutation = useMutation({
    mutationFn: async ({ clientId, propertyId, assign }: { clientId: string; propertyId: string; assign: boolean }) => {
      if (assign) {
        const res = await apiRequest("POST", "/api/property-preferences", {
          clientId,
          propertyId,
          priority: 1
        });
        return res.json();
      } else {
        const existingPref = preferences?.find(p => p.propertyId === propertyId);
        if (existingPref) {
          await apiRequest("DELETE", `/api/property-preferences/${existingPref.id}`);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-preferences'] });
    }
  });

  const isPropertyAssigned = (propertyId: string) => {
    return preferences?.some(p => p.propertyId === propertyId) || false;
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Price on request";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Property Assignment</h2>
        <Button data-testid="button-add-property">
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Button>
      </div>

      {!clients || clients.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">No clients found. Add clients first.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Client Selector Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Select Client</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <Tabs orientation="vertical" value={selectedClientId || ""} onValueChange={setSelectedClientId}>
                <TabsList className="flex flex-col h-auto w-full bg-transparent gap-1">
                  {clients.map((client) => (
                    <TabsTrigger
                      key={client.id}
                      value={client.id}
                      className="w-full justify-start data-[state=active]:bg-accent"
                      data-testid={`trigger-client-${client.id}`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm truncate">{client.name}</span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Properties Grid */}
          <div className="lg:col-span-3">
            {!selectedClientId ? (
              <Card>
                <CardContent className="p-12">
                  <p className="text-muted-foreground text-center">
                    Select a client to assign properties
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.map((property) => {
                  const assigned = isPropertyAssigned(property.id);
                  return (
                    <Card
                      key={property.id}
                      className={`hover-elevate ${assigned ? 'border-accent' : ''}`}
                      data-testid={`card-property-${property.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Home className="w-4 h-4 text-muted-foreground" />
                              <Badge variant="secondary">{property.propertyType}</Badge>
                              {assigned && (
                                <Badge className="bg-accent text-accent-foreground">
                                  <Check className="w-3 h-3 mr-1" />
                                  Booked
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-base leading-tight">{property.address}</h3>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {property.city}, {property.state}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <Checkbox
                              checked={assigned}
                              onCheckedChange={(checked) => {
                                assignPropertyMutation.mutate({
                                  clientId: selectedClientId,
                                  propertyId: property.id,
                                  assign: checked as boolean
                                });
                              }}
                              data-testid={`checkbox-property-${property.id}`}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-accent">{formatPrice(property.price)}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {property.bedrooms && (
                              <div className="flex items-center gap-1">
                                <Bed className="w-3 h-3" />
                                {property.bedrooms} bed
                              </div>
                            )}
                            {property.bathrooms && (
                              <div className="flex items-center gap-1">
                                <Bath className="w-3 h-3" />
                                {property.bathrooms} bath
                              </div>
                            )}
                            {property.squareFeet && (
                              <div className="flex items-center gap-1">
                                <Square className="w-3 h-3" />
                                {new Intl.NumberFormat('en-US').format(property.squareFeet)} sqft
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
