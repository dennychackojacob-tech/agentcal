import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
});

export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  price: integer("price"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  squareFeet: integer("square_feet"),
  propertyType: text("property_type").notNull(), // house, condo, townhouse, etc.
  status: text("status").notNull().default("available"), // available, under_contract, sold
});

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").notNull().default(60), // minutes
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  notes: text("notes"),
});

export const insertAgentSchema = createInsertSchema(agents).omit({ id: true });
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });

export type Agent = typeof agents.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// Additional types for route optimization
export type RouteStop = {
  appointment: Appointment;
  property: Property;
  estimatedTravelTime?: number; // minutes
  distanceFromPrevious?: number; // miles
};

export type DailySchedule = {
  date: string;
  agent: Agent;
  stops: RouteStop[];
  totalDistance: number;
  totalTravelTime: number;
  optimized: boolean;
};
