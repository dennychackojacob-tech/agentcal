import { 
  type Agent, 
  type InsertAgent, 
  type Property, 
  type InsertProperty,
  type Appointment,
  type InsertAppointment
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
}

export class MemStorage implements IStorage {
  private agents: Map<string, Agent>;
  private properties: Map<string, Property>;
  private appointments: Map<string, Appointment>;

  constructor() {
    this.agents = new Map();
    this.properties = new Map();
    this.appointments = new Map();
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
      clientEmail: insertAppointment.clientEmail ?? null,
      clientPhone: insertAppointment.clientPhone ?? null,
      notes: insertAppointment.notes ?? null
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
}

export const storage = new MemStorage();
