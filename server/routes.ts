import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAgentSchema, insertPropertySchema, insertAppointmentSchema, insertPropertyPreferenceSchema, insertBookingRequestSchema } from "@shared/schema";
import { z } from "zod";
import { generateBookingRequests, confirmBookingRequest, rejectBookingRequest } from "./utils/bookingOrchestrator";

export async function registerRoutes(app: Express): Promise<Server> {
  // Agent routes
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAllAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/:id", async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agent" });
    }
  });

  app.post("/api/agents", async (req, res) => {
    try {
      const validatedData = insertAgentSchema.parse(req.body);
      const agent = await storage.createAgent(validatedData);
      res.status(201).json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create agent" });
    }
  });

  app.put("/api/agents/:id", async (req, res) => {
    try {
      const validatedData = insertAgentSchema.partial().parse(req.body);
      const agent = await storage.updateAgent(req.params.id, validatedData);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update agent" });
    }
  });

  app.delete("/api/agents/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAgent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete agent" });
    }
  });

  // Property routes
  app.get("/api/properties", async (req, res) => {
    try {
      const { status } = req.query;
      const properties = status 
        ? await storage.getPropertiesByStatus(status as string)
        : await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      const validatedData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create property" });
    }
  });

  app.put("/api/properties/:id", async (req, res) => {
    try {
      const validatedData = insertPropertySchema.partial().parse(req.body);
      const property = await storage.updateProperty(req.params.id, validatedData);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProperty(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete property" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", async (req, res) => {
    try {
      const { agentId, date } = req.query;
      
      let appointments;
      if (agentId && date) {
        appointments = await storage.getAppointmentsByDate(agentId as string, new Date(date as string));
      } else if (agentId) {
        appointments = await storage.getAppointmentsByAgent(agentId as string);
      } else {
        appointments = await storage.getAllAppointments();
      }
      
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch appointment" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create appointment" });
    }
  });

  app.put("/api/appointments/:id", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(req.params.id, validatedData);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteAppointment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  // Route optimization endpoint
  app.post("/api/optimize-route", async (req, res) => {
    try {
      const { agentId, date } = req.body;
      
      if (!agentId || !date) {
        return res.status(400).json({ error: "agentId and date are required" });
      }

      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const appointments = await storage.getAppointmentsByDate(agentId, new Date(date));
      
      // Get properties for all appointments
      const propertiesMap = new Map();
      for (const appointment of appointments) {
        const property = await storage.getProperty(appointment.propertyId);
        if (property) {
          propertiesMap.set(appointment.propertyId, property);
        }
      }

      // Import route optimizer
      const { optimizeRoute } = await import('./utils/routeOptimizer');
      
      // Optimize the route
      const optimizedSchedule = optimizeRoute(appointments, propertiesMap, agent, date);
      
      res.json(optimizedSchedule);
    } catch (error) {
      console.error('Route optimization error:', error);
      res.status(500).json({ error: "Failed to optimize route" });
    }
  });

  // Smart scheduling endpoint
  app.post("/api/smart-schedule", async (req, res) => {
    try {
      const { agentId, date, startingLocation, selectedProperties } = req.body;
      
      if (!agentId || !date) {
        return res.status(400).json({ error: "agentId and date are required" });
      }

      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      // Default starting location (Mississauga) if not provided
      const startLocation = startingLocation || { lat: 43.5890, lng: -79.6441 };

      // Import smart scheduler
      const { generateSmartSchedule } = await import('./utils/smartScheduler');
      
      // Generate optimized schedule with selected properties filter
      const result = await generateSmartSchedule(
        agentId, 
        new Date(date), 
        startLocation,
        "08:00",
        selectedProperties || [] // Pass selected properties for filtering
      );
      
      res.json(result);
    } catch (error) {
      console.error('Smart scheduling error:', error);
      res.status(500).json({ error: "Failed to generate smart schedule" });
    }
  });

  // Get clients
  app.get("/api/clients", async (req, res) => {
    try {
      const { agentId } = req.query;
      
      if (agentId) {
        const clients = await storage.getClientsByAgent(agentId as string);
        res.json(clients);
      } else {
        const clients = await storage.getAllClients();
        res.json(clients);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  // Property Preference routes
  app.get("/api/property-preferences", async (req, res) => {
    try {
      const { clientId } = req.query;
      
      if (clientId) {
        const preferences = await storage.getPreferencesByClient(clientId as string);
        res.json(preferences);
      } else {
        res.status(400).json({ error: "clientId is required" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch property preferences" });
    }
  });

  app.post("/api/property-preferences", async (req, res) => {
    try {
      const validatedData = insertPropertyPreferenceSchema.parse(req.body);
      const preference = await storage.createPropertyPreference(validatedData);
      res.status(201).json(preference);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create property preference" });
    }
  });

  app.delete("/api/property-preferences/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePropertyPreference(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Property preference not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete property preference" });
    }
  });

  // Get showing slots for a date
  app.get("/api/showing-slots", async (req, res) => {
    try {
      const { date, propertyId } = req.query;
      
      if (!date) {
        return res.status(400).json({ error: "Date is required" });
      }

      const parsedDate = new Date(date as string);
      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      if (propertyId) {
        // Get all slots for this property on the date (including booked ones)
        const allSlots = await storage.getAllShowingSlots();
        const slots = allSlots.filter(
          (slot: any) => 
            slot.propertyId === propertyId &&
            new Date(slot.date) >= startOfDay &&
            new Date(slot.date) <= endOfDay
        );
        res.json(slots);
      } else {
        // Get all properties and their slots for the date (including booked ones)
        const properties = await storage.getAllProperties();
        const allSlots = await storage.getAllShowingSlots();
        const slotsWithProperties = [];
        
        for (const property of properties) {
          const propertySlots = allSlots.filter(
            (slot: any) => 
              slot.propertyId === property.id &&
              new Date(slot.date) >= startOfDay &&
              new Date(slot.date) <= endOfDay
          );
          
          for (const slot of propertySlots) {
            slotsWithProperties.push({
              ...slot,
              property
            });
          }
        }
        
        res.json(slotsWithProperties);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch showing slots" });
    }
  });

  // Get daily schedule endpoint
  app.get("/api/schedule/:agentId/:date", async (req, res) => {
    try {
      const { agentId, date } = req.params;
      
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }

      const appointments = await storage.getAppointmentsByDate(agentId, new Date(date));
      
      // Get properties for all appointments
      const propertiesMap = new Map();
      for (const appointment of appointments) {
        const property = await storage.getProperty(appointment.propertyId);
        if (property) {
          propertiesMap.set(appointment.propertyId, property);
        }
      }

      // Import route optimizer
      const { optimizeRoute } = await import('./utils/routeOptimizer');
      
      // Get optimized schedule
      const schedule = optimizeRoute(appointments, propertiesMap, agent, date);
      
      res.json(schedule);
    } catch (error) {
      console.error('Schedule fetch error:', error);
      res.status(500).json({ error: "Failed to fetch schedule" });
    }
  });

  // Booking Request routes
  app.get("/api/booking-requests", async (req, res) => {
    try {
      const { agentId, status, date } = req.query;
      
      let requests;
      if (agentId && date) {
        requests = await storage.getBookingRequestsByDate(agentId as string, new Date(date as string));
      } else if (agentId) {
        requests = await storage.getBookingRequestsByAgent(agentId as string);
      } else if (status) {
        requests = await storage.getBookingRequestsByStatus(status as string);
      } else {
        requests = await storage.getAllBookingRequests();
      }
      
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch booking requests" });
    }
  });

  app.post("/api/booking-requests/generate", async (req, res) => {
    try {
      const schema = z.object({
        agentId: z.string(),
        date: z.string(),
        clientIds: z.array(z.string()),
        startLocation: z.object({
          lat: z.number(),
          lng: z.number()
        }),
        startTime: z.string().optional(),
        endTime: z.string().optional()
      });

      const validatedData = schema.parse(req.body);
      const requests = await generateBookingRequests(
        storage,
        validatedData.agentId,
        new Date(validatedData.date),
        validatedData.clientIds,
        validatedData.startLocation,
        validatedData.startTime,
        validatedData.endTime
      );
      
      res.status(201).json(requests);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to generate booking requests" });
    }
  });

  app.patch("/api/booking-requests/:id/confirm", async (req, res) => {
    try {
      await confirmBookingRequest(storage, req.params.id);
      const updatedRequest = await storage.getBookingRequest(req.params.id);
      res.json(updatedRequest);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to confirm booking request" });
    }
  });

  app.patch("/api/booking-requests/:id/reject", async (req, res) => {
    try {
      const { reason } = req.body;
      await rejectBookingRequest(storage, req.params.id, reason);
      const updatedRequest = await storage.getBookingRequest(req.params.id);
      res.json(updatedRequest);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to reject booking request" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
