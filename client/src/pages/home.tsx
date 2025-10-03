import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Dashboard from "@/components/Dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { Agent, DailySchedule, Property } from "@shared/schema";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Fetch all agents
  const { data: agents, isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
  });

  // Get the first agent (in real app, would be based on login)
  const agentId = agents?.[0]?.id;

  // Fetch schedule for selected date
  const { data: schedule, isLoading: scheduleLoading } = useQuery<DailySchedule>({
    queryKey: ['/api/schedule', agentId, selectedDate],
    enabled: !!agentId,
  });

  // Fetch available properties
  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    enabled: !!agentId,
  });

  // Optimize route mutation
  const optimizeRouteMutation = useMutation({
    mutationFn: async () => {
      if (!agentId) throw new Error("No agent ID");
      const res = await apiRequest("POST", `/api/optimize-route`, { agentId, date: selectedDate });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule', agentId, selectedDate] });
    }
  });

  // Schedule property mutation
  const handleScheduleProperty = (propertyId: string) => {
    console.log('Schedule property:', propertyId);
    // This would open a dialog to create an appointment
  };

  const handleOptimizeRoute = () => {
    optimizeRouteMutation.mutate();
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  if (agentsLoading || scheduleLoading || propertiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your schedule...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!agents || agents.length === 0 || !schedule || !properties) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-8">
            <p className="text-muted-foreground">No data available. Please check the server.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Dashboard
      agent={agents[0]}
      schedule={schedule}
      selectedDate={selectedDate}
      availableProperties={properties}
      onScheduleProperty={handleScheduleProperty}
      onOptimizeRoute={handleOptimizeRoute}
      onDateChange={handleDateChange}
    />
  );
}