import { 
  type Agent, 
  type InsertAgent, 
  type Property, 
  type InsertProperty,
  type Appointment,
  type InsertAppointment,
  type Client,
  type InsertClient,
  type PropertyPreference,
  type InsertPropertyPreference,
  type ShowingSlot,
  type InsertShowingSlot,
  type BookingRequest,
  type InsertBookingRequest
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Agent operations
  getAgent(id: string): Promise<Agent | undefined>;
  getAgentByEmail(email: string): Promise<Agent | undefined>;
  getAllAgents(): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, agent: Partial<InsertAgent>): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<boolean>;

  // Property operations
  getProperty(id: string): Promise<Property | undefined>;
  getAllProperties(): Promise<Property[]>;
  getPropertiesByStatus(status: string): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: string): Promise<boolean>;

  // Appointment operations
  getAppointment(id: string): Promise<Appointment | undefined>;
  getAllAppointments(): Promise<Appointment[]>;
  getAppointmentsByAgent(agentId: string): Promise<Appointment[]>;
  getAppointmentsByDate(agentId: string, date: Date): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<boolean>;

  // Client operations
  getClient(id: string): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  getClientsByAgent(agentId: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  // Property Preference operations
  getPropertyPreference(id: string): Promise<PropertyPreference | undefined>;
  getPreferencesByClient(clientId: string): Promise<PropertyPreference[]>;
  getClientsByProperty(propertyId: string): Promise<PropertyPreference[]>;
  createPropertyPreference(preference: InsertPropertyPreference): Promise<PropertyPreference>;
  deletePropertyPreference(id: string): Promise<boolean>;

  // Showing Slot operations
  getShowingSlot(id: string): Promise<ShowingSlot | undefined>;
  getSlotsByProperty(propertyId: string): Promise<ShowingSlot[]>;
  getAvailableSlots(propertyId: string, date: Date): Promise<ShowingSlot[]>;
  getAllShowingSlots(): Promise<ShowingSlot[]>;
  createShowingSlot(slot: InsertShowingSlot): Promise<ShowingSlot>;
  updateShowingSlot(id: string, slot: Partial<InsertShowingSlot>): Promise<ShowingSlot | undefined>;
  deleteShowingSlot(id: string): Promise<boolean>;

  // Booking Request operations
  getBookingRequest(id: string): Promise<BookingRequest | undefined>;
  getAllBookingRequests(): Promise<BookingRequest[]>;
  getBookingRequestsByAgent(agentId: string): Promise<BookingRequest[]>;
  getBookingRequestsByDate(agentId: string, date: Date): Promise<BookingRequest[]>;
  getBookingRequestsByStatus(status: string): Promise<BookingRequest[]>;
  createBookingRequest(request: InsertBookingRequest): Promise<BookingRequest>;
  updateBookingRequest(id: string, request: Partial<InsertBookingRequest>): Promise<BookingRequest | undefined>;
  deleteBookingRequest(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private agents: Map<string, Agent>;
  private properties: Map<string, Property>;
  private appointments: Map<string, Appointment>;
  private clients: Map<string, Client>;
  private propertyPreferences: Map<string, PropertyPreference>;
  private showingSlots: Map<string, ShowingSlot>;
  private bookingRequests: Map<string, BookingRequest>;

  constructor() {
    this.agents = new Map();
    this.properties = new Map();
    this.appointments = new Map();
    this.clients = new Map();
    this.propertyPreferences = new Map();
    this.showingSlots = new Map();
    this.bookingRequests = new Map();
  }

  // Agent operations
  async getAgent(id: string): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgentByEmail(email: string): Promise<Agent | undefined> {
    return Array.from(this.agents.values()).find(
      (agent) => agent.email === email,
    );
  }

  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = randomUUID();
    const agent: Agent = { 
      ...insertAgent, 
      id,
      phone: insertAgent.phone ?? null
    };
    this.agents.set(id, agent);
    return agent;
  }

  async updateAgent(id: string, updates: Partial<InsertAgent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    const updatedAgent = { ...agent, ...updates };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: string): Promise<boolean> {
    return this.agents.delete(id);
  }

  // Property operations
  async getProperty(id: string): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getAllProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async getPropertiesByStatus(status: string): Promise<Property[]> {
    return Array.from(this.properties.values()).filter(
      (property) => property.status === status,
    );
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = randomUUID();
    const property: Property = { 
      ...insertProperty, 
      id,
      status: insertProperty.status ?? "available",
      latitude: insertProperty.latitude ?? null,
      longitude: insertProperty.longitude ?? null,
      price: insertProperty.price ?? null,
      bedrooms: insertProperty.bedrooms ?? null,
      bathrooms: insertProperty.bathrooms ?? null,
      squareFeet: insertProperty.squareFeet ?? null
    };
    this.properties.set(id, property);
    return property;
  }

  async updateProperty(id: string, updates: Partial<InsertProperty>): Promise<Property | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;
    const updatedProperty = { ...property, ...updates };
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  async deleteProperty(id: string): Promise<boolean> {
    return this.properties.delete(id);
  }

  // Appointment operations
  async getAppointment(id: string): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointmentsByAgent(agentId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.agentId === agentId,
    );
  }

  async getAppointmentsByDate(agentId: string, date: Date): Promise<Appointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Array.from(this.appointments.values()).filter(
      (appointment) => 
        appointment.agentId === agentId &&
        new Date(appointment.scheduledDate) >= startOfDay &&
        new Date(appointment.scheduledDate) <= endOfDay
    );
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const appointment: Appointment = { 
      ...insertAppointment, 
      id,
      status: insertAppointment.status ?? "scheduled",
      duration: insertAppointment.duration ?? 60,
      clientId: insertAppointment.clientId ?? null,
      clientEmail: insertAppointment.clientEmail ?? null,
      clientPhone: insertAppointment.clientPhone ?? null,
      notes: insertAppointment.notes ?? null,
      postAppointmentNotes: insertAppointment.postAppointmentNotes ?? null,
      bookingRequestId: insertAppointment.bookingRequestId ?? null
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    const updatedAppointment = { ...appointment, ...updates };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    return this.appointments.delete(id);
  }

  // Client operations
  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClientsByAgent(agentId: string): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(
      (client) => client.agentId === agentId,
    );
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = { 
      ...insertClient, 
      id,
      email: insertClient.email ?? null,
      phone: insertClient.phone ?? null,
      preferredDays: insertClient.preferredDays ?? null,
      preferredTimeSlots: insertClient.preferredTimeSlots ?? null,
      notes: insertClient.notes ?? null
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, updates: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    const updatedClient = { ...client, ...updates };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Property Preference operations
  async getPropertyPreference(id: string): Promise<PropertyPreference | undefined> {
    return this.propertyPreferences.get(id);
  }

  async getPreferencesByClient(clientId: string): Promise<PropertyPreference[]> {
    return Array.from(this.propertyPreferences.values()).filter(
      (pref) => pref.clientId === clientId,
    );
  }

  async getClientsByProperty(propertyId: string): Promise<PropertyPreference[]> {
    return Array.from(this.propertyPreferences.values()).filter(
      (pref) => pref.propertyId === propertyId,
    );
  }

  async createPropertyPreference(insertPref: InsertPropertyPreference): Promise<PropertyPreference> {
    const id = randomUUID();
    const preference: PropertyPreference = { 
      ...insertPref, 
      id,
      priority: insertPref.priority ?? 1,
      notes: insertPref.notes ?? null,
      bookedAt: new Date()
    };
    this.propertyPreferences.set(id, preference);
    return preference;
  }

  async deletePropertyPreference(id: string): Promise<boolean> {
    return this.propertyPreferences.delete(id);
  }

  // Showing Slot operations
  async getShowingSlot(id: string): Promise<ShowingSlot | undefined> {
    return this.showingSlots.get(id);
  }

  async getSlotsByProperty(propertyId: string): Promise<ShowingSlot[]> {
    return Array.from(this.showingSlots.values()).filter(
      (slot) => slot.propertyId === propertyId,
    );
  }

  async getAvailableSlots(propertyId: string, date: Date): Promise<ShowingSlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Array.from(this.showingSlots.values()).filter(
      (slot) => 
        slot.propertyId === propertyId &&
        slot.isBooked === "false" &&
        new Date(slot.date) >= startOfDay &&
        new Date(slot.date) <= endOfDay
    );
  }

  async getAllShowingSlots(): Promise<ShowingSlot[]> {
    return Array.from(this.showingSlots.values());
  }

  async createShowingSlot(insertSlot: InsertShowingSlot): Promise<ShowingSlot> {
    const id = randomUUID();
    const slot: ShowingSlot = { 
      ...insertSlot, 
      id,
      isBooked: insertSlot.isBooked ?? "false",
      bookedBy: insertSlot.bookedBy ?? null,
      maxCapacity: insertSlot.maxCapacity ?? 10
    };
    this.showingSlots.set(id, slot);
    return slot;
  }

  async updateShowingSlot(id: string, updates: Partial<InsertShowingSlot>): Promise<ShowingSlot | undefined> {
    const slot = this.showingSlots.get(id);
    if (!slot) return undefined;
    const updatedSlot = { ...slot, ...updates };
    this.showingSlots.set(id, updatedSlot);
    return updatedSlot;
  }

  async deleteShowingSlot(id: string): Promise<boolean> {
    return this.showingSlots.delete(id);
  }

  // Booking Request operations
  async getBookingRequest(id: string): Promise<BookingRequest | undefined> {
    return this.bookingRequests.get(id);
  }

  async getAllBookingRequests(): Promise<BookingRequest[]> {
    return Array.from(this.bookingRequests.values());
  }

  async getBookingRequestsByAgent(agentId: string): Promise<BookingRequest[]> {
    return Array.from(this.bookingRequests.values()).filter(
      (request) => request.agentId === agentId
    );
  }

  async getBookingRequestsByDate(agentId: string, date: Date): Promise<BookingRequest[]> {
    return Array.from(this.bookingRequests.values()).filter((request) => {
      if (request.agentId !== agentId) return false;
      const slot = this.showingSlots.get(request.slotId);
      if (!slot) return false;
      const slotDate = new Date(slot.date);
      return slotDate.toDateString() === date.toDateString();
    });
  }

  async getBookingRequestsByStatus(status: string): Promise<BookingRequest[]> {
    return Array.from(this.bookingRequests.values()).filter(
      (request) => request.status === status
    );
  }

  async createBookingRequest(insertRequest: InsertBookingRequest): Promise<BookingRequest> {
    const id = randomUUID();
    const request: BookingRequest = {
      ...insertRequest,
      id,
      status: insertRequest.status ?? "pending",
      requestedAt: new Date(),
      respondedAt: insertRequest.respondedAt ?? null,
      notes: insertRequest.notes ?? null,
      listingAgentEmail: insertRequest.listingAgentEmail ?? null,
      travelTimeFromPrevious: insertRequest.travelTimeFromPrevious ?? null,
      distanceFromPrevious: insertRequest.distanceFromPrevious ?? null
    };
    this.bookingRequests.set(id, request);
    return request;
  }

  async updateBookingRequest(id: string, updates: Partial<InsertBookingRequest>): Promise<BookingRequest | undefined> {
    const request = this.bookingRequests.get(id);
    if (!request) return undefined;
    const updatedRequest = { ...request, ...updates };
    this.bookingRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteBookingRequest(id: string): Promise<boolean> {
    return this.bookingRequests.delete(id);
  }
}

export const storage = new MemStorage();
