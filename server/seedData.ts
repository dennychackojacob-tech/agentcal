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

  console.log('Seed data created successfully!');
  console.log(`Agent: ${createdAgent.name} (${createdAgent.id})`);
  console.log(`Properties: ${createdProperties.length}`);
  console.log(`Appointments: ${appointments.length}`);
}