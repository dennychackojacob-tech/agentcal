# RouteWise - Real Estate Scheduling & Route Optimization App

## Overview
RouteWise is an intelligent scheduling application designed specifically for real estate agents to manage property showings and optimize travel routes. The app calculates distances between properties and suggests the most efficient visiting sequence to minimize travel time and maximize productivity.

## Recent Changes
- **2025-10-03**: Added Google Maps navigation - "Start Navigation" button opens turn-by-turn directions with all route stops
- **2025-09-28**: Integrated Google Maps API with interactive map, property markers, and route visualization
- **2025-09-28**: Implemented client filtering for schedules with accurate stats and timeline
- **2025-09-28**: Applied purple color scheme (Primary: 270 85% 35%, Accent: 280 60% 45%)
- **2025-09-28**: Built complete backend API with route optimization using nearest neighbor algorithm
- **2025-09-28**: Created dashboard with schedule timeline and property management components

## User Preferences
- Focus on route optimization and travel time efficiency
- Professional, clean interface suitable for real estate agents
- Mobile-responsive design for agents working in the field
- Visual map representation of properties and routes

## Project Architecture
### Frontend (React + TypeScript)
- **Dashboard Component**: Main interface with stats, schedule overview, and navigation tabs
- **ScheduleTimeline Component**: Visual timeline showing daily appointments with travel times
- **RouteMap Component**: Interactive map view with property markers and route visualization
- **PropertyCard Component**: Reusable property display with scheduling actions
- **Theme System**: Dark/light mode toggle with professional color scheme

### Data Models
- **Agent**: Real estate agent information
- **Property**: Property details with geocoordinates for route calculation  
- **Appointment**: Scheduled showings with client information
- **DailySchedule**: Optimized daily route with travel time calculations
- **RouteStop**: Individual stops with travel time estimates

### Design System
- **Colors**: Professional navy blue primary, success green for optimized routes
- **Typography**: Inter font family for clean, modern appearance
- **Components**: Shadcn/ui component library for consistency
- **Layout**: Responsive grid system with mobile-first approach

## Integration Notes
- **Outlook Integration**: User dismissed connector setup - would need manual calendar API credentials if calendar sync is required in the future
- **Mapping Service**: Google Maps API fully integrated with interactive maps, route visualization, and turn-by-turn navigation

## Future Enhancements
- Real-time traffic integration for accurate travel times
- Multi-day schedule optimization
- Client self-scheduling portal
- MLS system integration for automatic property data sync
- SMS/email notification system

## Current Status
Functional application with complete backend API, route optimization, Google Maps integration, and turn-by-turn navigation. Ready for real-world testing and deployment.