# Maps Integration Guide - Sahaaya Platform

## Overview
This guide explains the maps integration implemented for the Sahaaya platform, featuring OpenStreetMap with Leaflet.js for displaying help requests on an interactive map.

## Components

### MapView Component (`/components/MapView.tsx`)
A fully reusable React component that displays help requests on an interactive map.

#### Features:
- **Dynamic Location Detection**: Uses browser geolocation API to center map on user's location
- **Color-Coded Pins**: Urgency-based color coding (Critical: Red, High: Orange, Medium: Yellow, Low: Green)
- **Category Icons**: Emoji-based icons for different request categories (🏥 Medical, 📚 Education, etc.)
- **Interactive Popups**: Click markers to view request details with contact options
- **User Location Marker**: Shows user's current location with a distinct marker
- **Map Controls**: Zoom, pan, and "center on user" functionality
- **Legend**: Visual guide for urgency levels
- **Request Counter**: Badge showing number of nearby requests
- **Responsive Design**: Adapts to different screen sizes

#### Props Interface:
```typescript
interface MapViewProps {
  requests: MapRequest[];
  className?: string;
  height?: string;
  onRequestClick?: (request: MapRequest) => void;
}
```

#### Usage Example:
```tsx
<MapView 
  requests={filteredRequests} 
  height="600px"
  className="w-full shadow-lg"
  onRequestClick={(request) => {
    console.log('Request clicked:', request);
  }}
/>
```

## Integration with MatchingScreen

### View Mode Toggle
Added in the filter area with List/Map view options:
- Integrated seamlessly with existing filters
- Maintains Sahaaya color scheme (#41695e primary color)
- Responsive button group design

### Data Structure
Updated `mockRequests` to include coordinates:
```typescript
interface MapRequest {
  id: string;
  title: string;
  category: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  coordinates?: { lat: number; lng: number };
  description: string;
  contact: { phone?: string; email?: string; };
  timestamp: string;
  amount?: string;
  // ... other fields
}
```

## Technical Implementation

### Map Library
- **OpenStreetMap**: Free, open-source mapping solution
- **Leaflet.js**: Lightweight, mobile-friendly JavaScript library
- **Dynamic Loading**: Scripts loaded on-demand to optimize performance

### Coordinate Generation
For demo purposes, generates mock coordinates based on city names:
- Mumbai: 19.0760, 72.8777
- Delhi: 28.6139, 77.2090
- Bangalore: 12.9716, 77.5946
- Pune: 18.5204, 73.8567
- Chennai: 13.0827, 80.2707

### Geolocation
- Requests user permission for location access
- Falls back to Mumbai coordinates if denied or unavailable
- Shows user location with distinctive marker

### Performance Optimizations
- Lazy loading of Leaflet library
- Efficient marker management (clears and recreates on data changes)
- Responsive map bounds adjustment
- Minimal re-renders

## Styling & Accessibility

### Design Integration
- Matches Sahaaya color palette
- 3D-style elements with soft shadows
- Glassmorphism effects for controls
- Consistent with platform's modern design

### Accessibility Features
- Screen reader-friendly popup content
- Keyboard navigation support
- High contrast markers
- Clear visual hierarchy
- Proper ARIA labels

### Responsive Design
- Mobile-friendly controls
- Adaptive popup sizing
- Touch-friendly markers
- Responsive legend placement

## Configuration Options

### Marker Customization
```javascript
// Urgency colors
const urgencyColors = {
  critical: '#dc2626', // red-600
  high: '#ea580c',     // orange-600
  medium: '#ca8a04',   // yellow-600
  low: '#16a34a'       // green-600
};

// Category icons
const categoryIcons = {
  'medical': '🏥',
  'education': '📚',
  'financial': '💰',
  'ngo': '🏢',
  'emotional': '💝'
};
```

### Map Settings
- Default zoom level: 11
- Tile source: OpenStreetMap
- Attribution: Minimized for clean UI
- Bounds padding: [20, 20] pixels

## Usage Instructions

### 1. Basic Implementation
```tsx
import { MapView } from './components/MapView';

<MapView requests={yourRequestsArray} />
```

### 2. Custom Height
```tsx
<MapView 
  requests={requests} 
  height="400px" 
/>
```

### 3. With Click Handler
```tsx
<MapView 
  requests={requests}
  onRequestClick={(request) => {
    // Handle marker click
    openRequestDetails(request);
  }}
/>
```

### 4. Styled Container
```tsx
<MapView 
  requests={requests}
  className="rounded-lg shadow-xl border-2"
  height="500px"
/>
```

## Integration Steps for New Locations

1. **Add to MatchingScreen**: Include MapView in your component
2. **Import Dependencies**: Ensure MapView and MapRequest types are imported
3. **Add View Toggle**: Include list/map switch in your UI
4. **Configure Data**: Ensure requests have coordinate data
5. **Handle Interactions**: Add click handlers for marker interactions

## Future Enhancements

### Possible Additions:
- **Real Geocoding**: Convert addresses to coordinates automatically
- **Clustering**: Group nearby markers for better performance
- **Custom Map Styles**: Dark mode, custom themes
- **Routing**: Show directions to help locations
- **Search on Map**: Filter by map bounds
- **Advanced Filters**: Filter directly on map view
- **Offline Support**: Cache tiles for offline viewing

### API Integration:
When connecting to real APIs, ensure your backend provides:
- Latitude/longitude coordinates for each request
- Proper error handling for invalid coordinates
- Efficient pagination for large datasets
- Real-time updates for new requests

## Troubleshooting

### Common Issues:
1. **Map not loading**: Check if Leaflet CSS/JS loaded properly
2. **Markers not showing**: Verify coordinate format (lat/lng as numbers)
3. **Geolocation errors**: Handle permission denied gracefully
4. **Performance issues**: Implement marker clustering for large datasets
5. **Mobile responsiveness**: Test on various screen sizes

### Debug Tips:
- Check browser console for Leaflet errors
- Verify coordinates are valid numbers
- Test with different data sets
- Check network requests for tile loading

## Browser Support
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers with geolocation support

## License & Attribution
- OpenStreetMap: © OpenStreetMap contributors
- Leaflet.js: BSD 2-Clause License
- Implementation: Part of Sahaaya platform