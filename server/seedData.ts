import { storage } from './storage';
import type { InsertAgent, InsertProperty, InsertAppointment } from '@shared/schema';

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
      address: "123 Oak Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      latitude: "37.7749295",
      longitude: "-122.4194155",
      price: 1250000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1800,
      propertyType: "house",
      status: "available"
    },
    {
      address: "456 Pine Avenue",
      city: "San Francisco", 
      state: "CA",
      zipCode: "94103",
      latitude: "37.7849295",
      longitude: "-122.4094155",
      price: 875000,
      bedrooms: 2,
      bathrooms: 1,
      squareFeet: 1200,
      propertyType: "condo",
      status: "available"
    },
    {
      address: "789 Market Boulevard",
      city: "San Francisco",
      state: "CA",
      zipCode: "94104", 
      latitude: "37.7949295",
      longitude: "-122.3994155",
      price: 2100000,
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2400,
      propertyType: "townhouse",
      status: "available"
    },
    {
      address: "321 Elm Drive",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      latitude: "37.7649295", 
      longitude: "-122.4294155",
      price: 1650000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1950,
      propertyType: "house",
      status: "available"
    },
    {
      address: "654 Cedar Lane",
      city: "San Francisco",
      state: "CA",
      zipCode: "94106",
      latitude: "37.7549295", 
      longitude: "-122.4394155",
      price: 995000,
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1350,
      propertyType: "condo",
      status: "available"
    },
    {
      address: "987 Birch Court",
      city: "San Francisco",
      state: "CA",
      zipCode: "94107",
      latitude: "37.7449295", 
      longitude: "-122.4494155",
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

  console.log('Seed data created successfully!');
  console.log(`Agent: ${createdAgent.name} (${createdAgent.id})`);
  console.log(`Properties: ${createdProperties.length}`);
  console.log(`Appointments: ${appointments.length}`);
}