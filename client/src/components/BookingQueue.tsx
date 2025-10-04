import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Users, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { BookingRequest, Property, ShowingSlot } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface BookingRequestWithDetails extends BookingRequest {
  property?: Property;
  slot?: ShowingSlot;
}

export function BookingQueue({ agentId }: { agentId: string }) {
  const { toast } = useToast();
  const [rejectReason, setRejectReason] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Fetch booking requests for this agent
  const { data: bookingRequests, isLoading } = useQuery<BookingRequestWithDetails[]>({
    queryKey: ["/api/booking-requests", agentId],
    queryFn: async () => {
      const requests = await fetch(`/api/booking-requests?agentId=${agentId}`).then(res => res.json());
      
      // Fetch property and slot details for each request
      const enrichedRequests = await Promise.all(
        requests.map(async (req: BookingRequest) => {
          const [property, slot] = await Promise.all([
            fetch(`/api/properties/${req.propertyId}`).then(res => res.json()),
            fetch(`/api/showing-slots/${req.slotId}`).then(res => res.json())
          ]);
          return { ...req, property, slot };
        })
      );
      
      return enrichedRequests;
    }
  });

  // Confirm booking request mutation
  const confirmMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("PATCH", `/api/booking-requests/${requestId}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booking-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Booking Confirmed",
        description: "The booking request has been confirmed and appointments created."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Reject booking request mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason?: string }) => {
      return apiRequest("PATCH", `/api/booking-requests/${requestId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booking-requests"] });
      setRejectReason("");
      setSelectedRequestId(null);
      toast({
        title: "Booking Rejected",
        description: "The booking request has been rejected."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleReject = () => {
    if (selectedRequestId) {
      rejectMutation.mutate({ 
        requestId: selectedRequestId, 
        reason: rejectReason || undefined 
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "default",
      confirmed: "secondary",
      rejected: "destructive"
    };
    
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100",
      confirmed: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100",
      rejected: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100"
    };

    return (
      <Badge variant={variants[status] || "default"} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingRequests = bookingRequests?.filter(r => r.status === "pending") || [];
  const otherRequests = bookingRequests?.filter(r => r.status !== "pending") || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold" data-testid="text-booking-queue-title">Booking Queue</h2>
        <p className="text-muted-foreground">Manage booking requests and confirmations</p>
      </div>

      {pendingRequests.length === 0 && otherRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No booking requests yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pending Confirmations</h3>
              {pendingRequests.map((request) => (
                <Card key={request.id} data-testid={`card-booking-request-${request.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {request.property?.address}
                        </CardTitle>
                        <CardDescription>
                          {request.property?.city}, {request.property?.state}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{request.slot ? format(new Date(request.slot.date), "MMM d, yyyy") : "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{request.slot ? `${request.slot.startTime} - ${request.slot.endTime}` : "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{request.clientIds.length} client{request.clientIds.length > 1 ? "s" : ""}</span>
                      </div>
                      {request.distanceFromPrevious && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{parseFloat(request.distanceFromPrevious).toFixed(1)} km from previous</span>
                        </div>
                      )}
                    </div>

                    {request.notes && (
                      <p className="text-sm text-muted-foreground border-l-2 border-primary pl-3">
                        {request.notes}
                      </p>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => confirmMutation.mutate(request.id)}
                        disabled={confirmMutation.isPending}
                        data-testid={`button-confirm-${request.id}`}
                      >
                        {confirmMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Confirm Booking
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRequestId(request.id)}
                            data-testid={`button-reject-${request.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Booking Request</DialogTitle>
                            <DialogDescription>
                              Provide a reason for rejecting this booking request (optional)
                            </DialogDescription>
                          </DialogHeader>
                          <Textarea
                            placeholder="Reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            data-testid="input-reject-reason"
                          />
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setRejectReason("");
                                setSelectedRequestId(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleReject}
                              disabled={rejectMutation.isPending}
                              data-testid="button-confirm-reject"
                            >
                              {rejectMutation.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              )}
                              Reject Booking
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Confirmed/Rejected Requests */}
          {otherRequests.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">History</h3>
              {otherRequests.map((request) => (
                <Card key={request.id} data-testid={`card-booking-request-${request.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {request.property?.address}
                        </CardTitle>
                        <CardDescription>
                          {request.property?.city}, {request.property?.state}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{request.slot ? format(new Date(request.slot.date), "MMM d, yyyy") : "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{request.slot ? `${request.slot.startTime} - ${request.slot.endTime}` : "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{request.clientIds.length} client{request.clientIds.length > 1 ? "s" : ""}</span>
                      </div>
                      {request.respondedAt && (
                        <div className="text-sm text-muted-foreground">
                          {request.status === "confirmed" ? "Confirmed" : "Rejected"} on {format(new Date(request.respondedAt), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
