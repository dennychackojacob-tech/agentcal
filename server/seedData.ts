import { storage } from './storage';
import type { InsertAgent, InsertProperty, InsertAppointment, InsertClient, InsertPropertyPreference, InsertShowingSlot } from '@shared/schema';

export async function seedData() {
  // Check if data already exists
  const existingAgents = await storage.getAllAgents();
  if (existingAgents.length > 0) {
    console.log('Data already seeded, skipping...');
    return;
  }

  console.log('Seeding database with initial data...');

  // Create sample agent
  const agent: InsertAgent = {
    name: "Sarah Johnson",
    email: "sarah@realestate.com",
    phone: "(555) 123-4567"
  };
  const createdAgent = await storage.createAgent(agent);

  // Create sample properties
  const properties: InsertProperty[] = [
    {
      address: "123 Queen Street West",
      city: "Toronto",
      state: "ON",
      zipCode: "M5H 2M9",
      latitude: "43.6532",
      longitude: "-79.3832",
      price: 1250000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1800,
      propertyType: "house",
      status: "available"
    },
    {
      address: "456 Lakeshore Road East",
      city: "Mississauga", 
      state: "ON",
      zipCode: "L5G 1H5",
      latitude: "43.5890",
      longitude: "-79.6441",
      price: 875000,
      bedrooms: 2,
      bathrooms: 1,
      squareFeet: 1200,
      propertyType: "condo",
      status: "available"
    },
    {
      address: "789 Main Street North",
      city: "Brampton",
      state: "ON",
      zipCode: "L6X 1N8", 
      latitude: "43.6845",
      longitude: "-79.7612",
      price: 2100000,
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2400,
      propertyType: "townhouse",
      status: "available"
    },
    {
      address: "321 Yonge Street",
      city: "Toronto",
      state: "ON",
      zipCode: "M5B 1R7",
      latitude: "43.6580", 
      longitude: "-79.3792",
      price: 1650000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1950,
      propertyType: "house",
      status: "available"
    },
    {
      address: "654 Bronte Street South",
      city: "Milton",
      state: "ON",
      zipCode: "L9T 7X8",
      latitude: "43.5183", 
      longitude: "-79.8774",
      price: 995000,
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1350,
      propertyType: "condo",
      status: "available"
    },
    {
      address: "987 Hurontario Street",
      city: "Mississauga",
      state: "ON",
      zipCode: "L5A 4G4",
      latitude: "43.5942", 
      longitude: "-79.6506",
      price: 2750000,
      bedrooms: 5,
      bathrooms: 4,
      squareFeet: 3200,
      propertyType: "house",
      status: "available"
    }
  ];

  const createdProperties = await Promise.all(
    properties.map(p => storage.createProperty(p))
  );

  // Create sample appointments for today
  const today = new Date();
  const appointments: InsertAppointment[] = [
    {
      agentId: createdAgent.id,
      propertyId: createdProperties[0].id,
      clientName: "John & Mary Smith",
      clientEmail: "john.smith@email.com",
      clientPhone: "(555) 987-6543",
      scheduledDate: new Date(today.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      duration: 60,
      status: "scheduled",
      notes: "First time buyers, interested in schools nearby"
    },
    {
      agentId: createdAgent.id,
      propertyId: createdProperties[1].id, 
      clientName: "Lisa Chen",
      clientEmail: "lisa.chen@email.com",
      clientPhone: "(555) 456-7890",
      scheduledDate: new Date(today.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
      duration: 45,
      status: "scheduled",
      notes: "Looking for investment property"
    },
    {
      agentId: createdAgent.id,
      propertyId: createdProperties[2].id,
      clientName: "David Wilson", 
      clientEmail: "david.wilson@email.com",
      clientPhone: "(555) 321-0987",
      scheduledDate: new Date(today.getTime() + 6 * 60 * 60 * 1000), // 6 hours from now
      duration: 75,
      status: "scheduled",
      notes: "Looking for family home with good schools"
    }
  ];

  await Promise.all(
    appointments.map(a => storage.createAppointment(a))
  );

  // Create sample clients for smart scheduling
  const clients: InsertClient[] = [
    {
      agentId: createdAgent.id,
      name: "Robert Thompson",
      email: "robert.t@email.com",
      phone: "(555) 111-2222",
      preferredDays: ["Saturday", "Sunday"],
      preferredTimeSlots: ["morning", "afternoon"],
      notes: "Looking for properties in Hamilton area"
    },
    {
      agentId: createdAgent.id,
      name: "Emily Rodriguez",
      email: "emily.r@email.com",
      phone: "(555) 333-4444",
      preferredDays: ["Saturday"],
      preferredTimeSlots: ["afternoon"],
      notes: "Interested in Oakville properties"
    },
    {
      agentId: createdAgent.id,
      name: "Michael Chang",
      email: "michael.c@email.com",
      phone: "(555) 555-6666",
      preferredDays: ["Friday", "Saturday"],
      preferredTimeSlots: ["morning", "afternoon", "evening"],
      notes: "Flexible schedule, looking in Mississauga"
    },
    {
      agentId: createdAgent.id,
      name: "Sarah Williams",
      email: "sarah.w@email.com",
      phone: "(555) 777-8888",
      preferredDays: ["Sunday"],
      preferredTimeSlots: ["afternoon"],
      notes: "Prefers Toronto locations"
    }
  ];

  const createdClients = await Promise.all(
    clients.map(c => storage.createClient(c))
  );

  // Create property preferences (which client wants to see which properties)
  const preferences: InsertPropertyPreference[] = [
    // Robert Thompson (Hamilton area - no Hamilton properties in seed, so nearby)
    { clientId: createdClients[0].id, propertyId: createdProperties[2].id, priority: 1 }, // Brampton
    { clientId: createdClients[0].id, propertyId: createdProperties[4].id, priority: 2 }, // Milton
    { clientId: createdClients[0].id, propertyId: createdProperties[5].id, priority: 1 }, // Mississauga
    
    // Emily Rodriguez (Oakville area - Milton/Mississauga nearby)
    { clientId: createdClients[1].id, propertyId: createdProperties[1].id, priority: 1 }, // Mississauga
    { clientId: createdClients[1].id, propertyId: createdProperties[4].id, priority: 1 }, // Milton
    { clientId: createdClients[1].id, propertyId: createdProperties[5].id, priority: 2 }, // Mississauga
    
    // Michael Chang (Mississauga)
    { clientId: createdClients[2].id, propertyId: createdProperties[1].id, priority: 1 },
    { clientId: createdClients[2].id, propertyId: createdProperties[5].id, priority: 1 },
    
    // Sarah Williams (Toronto)
    { clientId: createdClients[3].id, propertyId: createdProperties[0].id, priority: 1 },
    { clientId: createdClients[3].id, propertyId: createdProperties[3].id, priority: 1 }
  ];

  await Promise.all(
    preferences.map(p => storage.createPropertyPreference(p))
  );

  // Create showing slots for next Saturday
  const nextSaturday = new Date();
  const daysUntilSaturday = (6 - nextSaturday.getDay() + 7) % 7;
  nextSaturday.setDate(nextSaturday.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday));
  nextSaturday.setHours(0, 0, 0, 0);

  const showingSlots: InsertShowingSlot[] = [
    // Property 0 (Toronto) - Morning and afternoon slots
    { propertyId: createdProperties[0].id, date: nextSaturday, startTime: "09:00", endTime: "10:00", isBooked: "false" },
    { propertyId: createdProperties[0].id, date: nextSaturday, startTime: "11:00", endTime: "12:00", isBooked: "false" },
    { propertyId: createdProperties[0].id, date: nextSaturday, startTime: "14:00", endTime: "15:00", isBooked: "false" },
    
    // Property 1 (Mississauga) - Multiple slots
    { propertyId: createdProperties[1].id, date: nextSaturday, startTime: "10:00", endTime: "11:00", isBooked: "false" },
    { propertyId: createdProperties[1].id, date: nextSaturday, startTime: "13:00", endTime: "14:00", isBooked: "false" },
    { propertyId: createdProperties[1].id, date: nextSaturday, startTime: "15:00", endTime: "16:00", isBooked: "false" },
    
    // Property 2 (Brampton) - Morning and afternoon
    { propertyId: createdProperties[2].id, date: nextSaturday, startTime: "09:00", endTime: "10:00", isBooked: "false" },
    { propertyId: createdProperties[2].id, date: nextSaturday, startTime: "14:00", endTime: "15:00", isBooked: "false" },
    
    // Property 3 (Toronto) - Afternoon only
    { propertyId: createdProperties[3].id, date: nextSaturday, startTime: "14:00", endTime: "15:00", isBooked: "false" },
    { propertyId: createdProperties[3].id, date: nextSaturday, startTime: "16:00", endTime: "17:00", isBooked: "false" },
    
    // Property 4 (Milton) - Full day availability
    { propertyId: createdProperties[4].id, date: nextSaturday, startTime: "09:00", endTime: "10:00", isBooked: "false" },
    { propertyId: createdProperties[4].id, date: nextSaturday, startTime: "11:00", endTime: "12:00", isBooked: "false" },
    { propertyId: createdProperties[4].id, date: nextSaturday, startTime: "13:00", endTime: "14:00", isBooked: "false" },
    { propertyId: createdProperties[4].id, date: nextSaturday, startTime: "15:00", endTime: "16:00", isBooked: "false" },
    
    // Property 5 (Mississauga) - Afternoon slots
    { propertyId: createdProperties[5].id, date: nextSaturday, startTime: "13:00", endTime: "14:00", isBooked: "false" },
    { propertyId: createdProperties[5].id, date: nextSaturday, startTime: "15:00", endTime: "16:00", isBooked: "false" }
  ];

  await Promise.all(
    showingSlots.map(s => storage.createShowingSlot(s))
  );

  console.log('Seed data created successfully!');
  console.log(`Agent: ${createdAgent.name} (${createdAgent.id})`);
  console.log(`Properties: ${createdProperties.length}`);
  console.log(`Appointments: ${appointments.length}`);
  console.log(`Clients: ${createdClients.length}`);
  console.log(`Property Preferences: ${preferences.length}`);
  console.log(`Showing Slots: ${showingSlots.length}`);
}