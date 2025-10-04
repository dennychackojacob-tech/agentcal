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

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  preferredDays: text("preferred_days").array(), // ["Monday", "Saturday", etc.]
  preferredTimeSlots: text("preferred_time_slots").array(), // ["morning", "afternoon", "evening"]
  notes: text("notes"),
});

export const propertyPreferences = pgTable("property_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  priority: integer("priority").default(1), // 1 = high priority, 2 = medium, 3 = low
  notes: text("notes"),
  bookedAt: timestamp("booked_at").notNull().defaultNow(),
});

export const showingSlots = pgTable("showing_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(), // "09:00", "14:30", etc.
  endTime: text("end_time").notNull(),
  isBooked: text("is_booked").notNull().default("false"), // "false", "true"
  bookedBy: varchar("booked_by").references(() => clients.id),
});

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id),
  propertyId: varchar("property_id").notNull().references(() => properties.id),
  clientId: varchar("client_id").references(() => clients.id),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").notNull().default(60), // minutes
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled
  notes: text("notes"),
  postAppointmentNotes: text("post_appointment_notes"),
});

export const insertAgentSchema = createInsertSchema(agents).omit({ id: true });
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export const insertPropertyPreferenceSchema = createInsertSchema(propertyPreferences).omit({ id: true, bookedAt: true });
export const insertShowingSlotSchema = createInsertSchema(showingSlots).omit({ id: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });

export type Agent = typeof agents.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type PropertyPreference = typeof propertyPreferences.$inferSelect;
export type ShowingSlot = typeof showingSlots.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertPropertyPreference = z.infer<typeof insertPropertyPreferenceSchema>;
export type InsertShowingSlot = z.infer<typeof insertShowingSlotSchema>;
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
