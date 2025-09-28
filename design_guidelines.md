# Real Estate Scheduling App Design Guidelines

## Design Approach
**Reference-Based Approach**: Following productivity apps like Linear and Notion for clean, efficiency-focused interface with map integration inspiration from Google Maps and Waze for route optimization displays.

## Core Design Elements

### Color Palette
**Light Mode:**
- Primary: 220 85% 25% (Professional navy blue)
- Secondary: 220 20% 95% (Light gray backgrounds)
- Accent: 145 60% 45% (Success green for optimized routes)
- Warning: 25 90% 55% (Orange for scheduling conflicts)

**Dark Mode:**
- Primary: 220 85% 75% (Light blue)
- Secondary: 220 15% 15% (Dark gray backgrounds)
- Background: 220 15% 8% (Deep dark)

### Typography
- **Primary**: Inter (Google Fonts) - Clean, professional
- **Headers**: Inter Bold (600-700 weight)
- **Body**: Inter Regular (400-500 weight)
- **Monospace**: JetBrains Mono for time displays

### Layout System
**Tailwind Spacing**: Primary units of 2, 4, 8, 16 for consistent spacing
- Padding: p-4 for cards, p-8 for main containers
- Margins: m-2 for small gaps, m-8 for section spacing
- Heights: h-16 for headers, h-8 for form elements

### Component Library

**Navigation:**
- Clean sidebar with property icons
- Sticky top navigation with agent profile
- Breadcrumb navigation for deep views

**Core Components:**
- **Schedule Cards**: Property cards with address, time, and distance indicators
- **Route Optimizer Panel**: Interactive map with drag-and-drop scheduling
- **Time Slots**: Visual time blocks with travel time buffers
- **Distance Indicators**: Color-coded travel time estimates (green: <15min, yellow: 15-30min, red: >30min)
- **Property Thumbnails**: Small property images in schedule cards

**Forms:**
- Minimal input styling with clear labels
- Date/time pickers optimized for mobile
- Address autocomplete fields

**Data Displays:**
- **Daily Route View**: Timeline with property stops and travel segments
- **Map Integration**: Interactive property locations with route overlay
- **Schedule Grid**: Weekly calendar view with drag-and-drop optimization
- **Travel Summary**: Total distance and time for daily routes

**Key Visual Elements:**
- Route lines on maps in primary color
- Optimized routes highlighted in accent green
- Travel time badges with clear typography
- Property status indicators (scheduled, available, conflict)

**Mobile Optimization:**
- Bottom navigation for core actions
- Swipe gestures for schedule adjustments
- Large touch targets for map interactions
- Collapsible route details

**Interactive Features:**
- Real-time route recalculation on schedule changes
- One-tap route optimization
- Quick property swap functionality
- Travel time buffer adjustments

The design prioritizes efficiency and clarity, helping agents visualize and optimize their daily routes while maintaining a professional, trustworthy appearance suitable for client interactions.