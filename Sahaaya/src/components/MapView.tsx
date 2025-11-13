import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { 
  MapPin, 
  Navigation, 
  AlertCircle, 
  Heart, 
  GraduationCap, 
  IndianRupee, 
  Users, 
  Brain,
  Phone,
  Mail,
  Clock,
  Search,
  X
} from 'lucide-react';

// Types for our map data
export interface MapRequest {
  id: string;
  title: string;
  category: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  description: string;
  contact: {
    phone?: string;
    email?: string;
  };
  timestamp: string;
  amount?: string;
}

export interface MapCommunity {
  id: string;
  name: string;
  description: string;
  category: 'Medical' | 'Educational' | 'Financial' | 'NGO' | 'Emotional';
  location_name: string;
  location_coordinates?: {
    lat: number;
    lng: number;
  };
  privacy_type: 'public' | 'private' | 'invite-only';
  member_count: number;
  verified: boolean;
  trust_score: number;
  admin_name: string;
  created_at: string;
}

interface MapViewProps {
  requests: MapRequest[];
  communities?: MapCommunity[];
  showCommunities?: boolean;
  className?: string;
  height?: string;
  onRequestClick?: (request: MapRequest) => void;
  onCommunityClick?: (community: MapCommunity) => void;
  externalLocationSelection?: {
    coordinates: [number, number];
    name: string;
  } | null;
}

// Category icons mapping
const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'medical':
      return '🏥';
    case 'education':
      return '📚';
    case 'financial':
      return '💰';
    case 'ngo':
      return '🏢';
    case 'emotional':
      return '💝';
    default:
      return '📍';
  }
};

// Urgency colors mapping
const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'critical':
      return '#dc2626'; // red-600
    case 'high':
      return '#ea580c'; // orange-600
    case 'medium':
      return '#ca8a04'; // yellow-600
    case 'low':
      return '#16a34a'; // green-600
    default:
      return '#6b7280'; // gray-500
  }
};

export function MapView({ requests, communities, showCommunities, className = '', height = '400px', onRequestClick, onCommunityClick, externalLocationSelection }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  // Debug: Log when external location selection changes
  useEffect(() => {
    console.log('🗺️ MapView: externalLocationSelection prop changed:', externalLocationSelection);
    console.log('🗺️ MapView: Current states - leafletLoaded:', leafletLoaded, 'mapInstance:', !!mapInstanceRef.current);
    console.log('🗺️ MapView: Leaflet window object:', !!(window as any).L);
  }, [externalLocationSelection]);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MapRequest | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<MapCommunity | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'default'>('loading');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeUrgencyFilters, setActiveUrgencyFilters] = useState<Set<string>>(new Set(['critical', 'high', 'medium', 'low']));
  const [mapKey, setMapKey] = useState(0); // Add unique key for map container
  const highlightMarkerRef = useRef<any>(null);

  // Predefined locations for search
  const searchableLocations = [
    // Major Cities
    { name: 'Mumbai', state: 'Maharashtra', coords: { lat: 19.0760, lng: 72.8777 } },
    { name: 'Delhi', state: 'Delhi', coords: { lat: 28.6139, lng: 77.2090 } },
    { name: 'Bangalore', state: 'Karnataka', coords: { lat: 12.9716, lng: 77.5946 } },
    { name: 'Pune', state: 'Maharashtra', coords: { lat: 18.5204, lng: 73.8567 } },
    { name: 'Chennai', state: 'Tamil Nadu', coords: { lat: 13.0827, lng: 80.2707 } },
    { name: 'Kolkata', state: 'West Bengal', coords: { lat: 22.5726, lng: 88.3639 } },
    { name: 'Hyderabad', state: 'Telangana', coords: { lat: 17.3850, lng: 78.4867 } },
    
    // Andhra Pradesh Districts
    { name: 'Visakhapatnam', state: 'Andhra Pradesh', coords: { lat: 17.6868, lng: 83.2185 } },
    { name: 'Vijayawada', state: 'Andhra Pradesh', coords: { lat: 16.5062, lng: 80.6480 } },
    { name: 'Guntur', state: 'Andhra Pradesh', coords: { lat: 16.3067, lng: 80.4365 } },
    { name: 'Nellore', state: 'Andhra Pradesh', coords: { lat: 14.4426, lng: 79.9865 } },
    { name: 'Kurnool', state: 'Andhra Pradesh', coords: { lat: 15.8281, lng: 78.0373 } },
    { name: 'Anantapur', state: 'Andhra Pradesh', coords: { lat: 14.6819, lng: 77.6006 } },
    { name: 'Kadapa', state: 'Andhra Pradesh', coords: { lat: 14.4673, lng: 78.8242 } },
    { name: 'Chittoor', state: 'Andhra Pradesh', coords: { lat: 13.2172, lng: 79.1003 } },
    { name: 'Tirupati', state: 'Andhra Pradesh', coords: { lat: 13.6288, lng: 79.4192 } },
    { name: 'Rajahmundry', state: 'Andhra Pradesh', coords: { lat: 17.0005, lng: 81.8040 } },
    
    // Other Major Indian Cities
    { name: 'Ahmedabad', state: 'Gujarat', coords: { lat: 23.0225, lng: 72.5714 } },
    { name: 'Jaipur', state: 'Rajasthan', coords: { lat: 26.9124, lng: 75.7873 } },
    { name: 'Lucknow', state: 'Uttar Pradesh', coords: { lat: 26.8467, lng: 80.9462 } },
    { name: 'Kanpur', state: 'Uttar Pradesh', coords: { lat: 26.4499, lng: 80.3319 } },
    { name: 'Nagpur', state: 'Maharashtra', coords: { lat: 21.1458, lng: 79.0882 } },
    { name: 'Indore', state: 'Madhya Pradesh', coords: { lat: 22.7196, lng: 75.8577 } },
    { name: 'Bhopal', state: 'Madhya Pradesh', coords: { lat: 23.2599, lng: 77.4126 } },
    { name: 'Patna', state: 'Bihar', coords: { lat: 25.5941, lng: 85.1376 } },
    { name: 'Vadodara', state: 'Gujarat', coords: { lat: 22.3072, lng: 73.1812 } },
    { name: 'Ludhiana', state: 'Punjab', coords: { lat: 30.9010, lng: 75.8573 } },
  ];

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      const filtered = searchableLocations.filter(location => 
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        location.state.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered.slice(0, 5)); // Limit to 5 results
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  const selectLocation = (location: any) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([location.coords.lat, location.coords.lng], 10);
      setSearchQuery(`${location.name}, ${location.state}`);
      setShowSearchResults(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Toggle urgency filter
  const toggleUrgencyFilter = (urgency: string) => {
    const newFilters = new Set(activeUrgencyFilters);
    if (newFilters.has(urgency)) {
      newFilters.delete(urgency);
    } else {
      newFilters.add(urgency);
    }
    setActiveUrgencyFilters(newFilters);
  };

  // Filter requests based on active urgency filters
  const filteredRequests = requests.filter(request => 
    activeUrgencyFilters.has(request.urgency)
  );

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Check if Leaflet CSS is already loaded to avoid duplicates
        const existingCSS = document.querySelector('link[href*="leaflet"]');
        if (!existingCSS) {
          // Create a more robust CSS loader that avoids CORS issues
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          link.crossOrigin = 'anonymous';
          link.onload = () => {
            console.log('Leaflet CSS loaded successfully');
          };
          link.onerror = () => {
            console.warn('Failed to load Leaflet CSS from CDN, continuing without external styles');
            // Don't set error state for CSS loading failure, the map can still work
          };
          document.head.appendChild(link);
        }

        // Load Leaflet JS with better error handling
        if (!(window as any).L) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
          script.crossOrigin = 'anonymous';
          script.onload = () => {
            console.log('Leaflet JS loaded successfully');
            setLeafletLoaded(true);
          };
          script.onerror = () => {
            console.error('Failed to load Leaflet JavaScript');
            setError('Failed to load map library. Please check your internet connection.');
            setIsLoading(false);
          };
          document.head.appendChild(script);
        } else {
          console.log('Leaflet already available');
          setLeafletLoaded(true);
        }
      } catch (err) {
        console.error('Error setting up Leaflet:', err);
        setError('Failed to initialize map library');
        setIsLoading(false);
      }
    };

    loadLeaflet();
  }, []);

  // Get user's current location
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        if ('geolocation' in navigator) {
          console.log('Requesting user location...');
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Location access granted:', position.coords.latitude, position.coords.longitude);
              setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
              setLocationStatus('granted');
            },
            (error) => {
              // Geolocation permission denied or unavailable - silently fall back to default
              // This is expected behavior in many environments (no permissions policy, user denial, etc.)
              setLocationStatus('denied');
              setUserLocation({ lat: 19.0760, lng: 72.8777 });
            },
            {
              enableHighAccuracy: false,
              timeout: 15000, // Increased timeout
              maximumAge: 300000 // 5 minutes cache
            }
          );
        } else {
          console.info('Geolocation not supported by browser - using Mumbai as default location');
          setUserLocation({ lat: 19.0760, lng: 72.8777 });
          setLocationStatus('default');
        }
      } catch (err) {
        console.warn('Unexpected error during location initialization:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
        // Fallback to Mumbai location
        setUserLocation({ lat: 19.0760, lng: 72.8777 });
        setLocationStatus('denied');
      }
    };

    initializeLocation();
  }, []);

  // Function to retry location access
  const retryLocationAccess = async () => {
    try {
      console.log('Retrying location access...');
      setLocationStatus('loading');
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Location access granted on retry:', position.coords.latitude, position.coords.longitude);
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setLocationStatus('granted');
            // Center map on new location
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([position.coords.latitude, position.coords.longitude], 13);
            }
          },
          (error) => {
            // Silently fall back to default location
            setLocationStatus('denied');
          },
          {
            enableHighAccuracy: true,
            timeout: 20000, // Longer timeout for retry
            maximumAge: 0 // Force fresh location
          }
        );
      } else {
        setLocationStatus('denied');
      }
    } catch (err) {
      setLocationStatus('denied');
    }
  };

  // Generate mock coordinates for requests that don't have them
  const generateMockCoordinates = (location: string, index: number) => {
    const cityCoordinates = {
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'Delhi': { lat: 28.6139, lng: 77.2090 },
      'Bangalore': { lat: 12.9716, lng: 77.5946 },
      'Pune': { lat: 18.5204, lng: 73.8567 },
      'Chennai': { lat: 13.0827, lng: 80.2707 }
    };

    const baseCoords = cityCoordinates[location as keyof typeof cityCoordinates] || 
                      cityCoordinates['Mumbai'];
    
    // Add small random offset to avoid overlapping markers
    const offset = 0.01;
    return {
      lat: baseCoords.lat + (Math.random() - 0.5) * offset * (index + 1),
      lng: baseCoords.lng + (Math.random() - 0.5) * offset * (index + 1)
    };
  };

  // Initialize map when Leaflet is loaded and user location is available
  useEffect(() => {
    if (!leafletLoaded || !userLocation || !mapRef.current) return;

    const L = (window as any).L;
    
    try {
      // Check if map container is already initialized and clean it up
      if (mapInstanceRef.current) {
        console.log('Cleaning up existing map instance');
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          console.warn('Error removing existing map:', err);
        }
        mapInstanceRef.current = null;
      }

      // Clear the map container
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
      }

      // Create map instance
      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        attributionControl: true
      }).setView([userLocation.lat, userLocation.lng], 10);

      // Add tiles with error handling
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }).addTo(map).on('tileerror', function(error: any) {
        console.warn('Tile loading error:', error);
      });

      // Add user location marker
      const userIcon = L.divIcon({
        html: `<div style="background: #41695e; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
        className: 'user-location-marker',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<div style="text-align: center; font-weight: 500; color: #033b4a;">📍 Your Location</div>');

      mapInstanceRef.current = map;
      setIsLoading(false);
      
      // Handle map events
      map.on('error', function(error: any) {
        console.error('Map error:', error);
        setError('Map encountered an error');
      });

      // Add event listeners for community popup buttons
      document.addEventListener('viewCommunity', (event: any) => {
        const communityId = event.detail;
        if (onCommunityClick && communities) {
          const community = communities.find(c => c.id === communityId);
          if (community) {
            onCommunityClick(community);
          }
        }
      });

      document.addEventListener('joinCommunity', (event: any) => {
        const communityId = event.detail;
        console.log('Join community clicked:', communityId);
        // This could trigger a join modal or API call
        alert('Join community functionality will be implemented soon!');
      });
      
    } catch (err) {
      console.error('Failed to initialize map:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Handle specific Leaflet errors
      if (errorMessage.includes('Map container is already initialized')) {
        console.log('Map container already initialized, forcing cleanup and retry');
        setMapKey(prev => prev + 1); // Force re-render
        return; // Don't set error, let it retry
      }
      
      setError(`Failed to initialize map: ${errorMessage}`);
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up map on component unmount/deps change');
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          console.warn('Error during map cleanup:', err);
        }
        mapInstanceRef.current = null;
      }
      // Clear markers reference
      markersRef.current = [];
    };
  }, [leafletLoaded, userLocation, communities, onCommunityClick, mapKey]);

  // Handle external location selection (from PlaceSearchInput components)
  useEffect(() => {
    console.log('🗺️ MapView: externalLocationSelection useEffect triggered');
    console.log('  📊 New externalLocationSelection:', externalLocationSelection);
    console.log('  🔧 mapInstanceRef.current exists:', !!mapInstanceRef.current);
    console.log('  📚 leafletLoaded:', leafletLoaded);
    
    if (!externalLocationSelection) {
      console.log('❌ MapView: No external selection provided - exiting early');
      return;
    }
    
    console.log('✅ MapView: External selection exists - proceeding with zoom attempt');

    // Wait for map to be ready with a more robust check
    const attemptZoom = () => {
      console.log('🎯 MapView: attemptZoom() called');
      
      if (!mapInstanceRef.current) {
        console.log('❌ MapView: Map instance not ready, waiting...');
        console.log('  🔧 mapInstanceRef.current:', mapInstanceRef.current);
        return false;
      }

      if (!leafletLoaded) {
        console.log('❌ MapView: Leaflet not loaded yet, waiting...');
        console.log('  📚 leafletLoaded:', leafletLoaded);
        return false;
      }

      const L = (window as any).L;
      if (!L) {
        console.warn('❌ MapView: Leaflet library not available on window object');
        console.log('  🪟 window.L:', L);
        return false;
      }
      
      console.log('✅ MapView: All prerequisites met - proceeding with zoom logic');

      try {
        const { coordinates, name } = externalLocationSelection;
        console.log('📦 MapView: Extracting data from externalLocationSelection');
        console.log('  🌐 Raw coordinates:', coordinates);
        console.log('  📍 Location name:', name);
        console.log('  📊 Coordinates type:', typeof coordinates);
        console.log('  📋 Coordinates is array:', Array.isArray(coordinates));
        
        const [lat, lng] = coordinates;
        console.log('📐 MapView: Destructured coordinates:');
        console.log('  📍 lat:', lat, 'type:', typeof lat);
        console.log('  📍 lng:', lng, 'type:', typeof lng);

        // Validate coordinates
        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
          console.warn('❌ MapView: Invalid coordinates detected');
          console.log('  📍 lat valid:', typeof lat === 'number' && !isNaN(lat));
          console.log('  📍 lng valid:', typeof lng === 'number' && !isNaN(lng));
          return false;
        }
        
        console.log('✅ MapView: Coordinates validation passed');

        // Ensure map is fully initialized (check if _loaded exists first)
        const mapLoaded = mapInstanceRef.current._loaded;
        console.log('🗺️ MapView: Checking map load status');
        console.log('  📊 _loaded property:', mapLoaded);
        console.log('  📊 _loaded type:', typeof mapLoaded);
        
        if (mapLoaded === false) {
          console.log('❌ MapView: Map not fully loaded yet');
          return false;
        }

        console.log('✅ MapView: Map is ready and loaded');
        console.log('🎯 MapView: Attempting to zoom to coordinates:', [lat, lng]);
        
        // Use flyTo for smoother animation with error handling
        try {
          console.log('🚁 MapView: Calling flyTo with parameters:');
          console.log('  📍 Target:', [lat, lng]);
          console.log('  🔍 Zoom level:', 13);
          console.log('  ⏱️ Duration:', 1.5);
          
          const flyToResult = mapInstanceRef.current.flyTo([lat, lng], 13, {
            duration: 1.5,
            easeLinearity: 0.5
          });
          
          console.log('✅ MapView: flyTo() called successfully');
          console.log('  📊 flyTo result:', flyToResult);
        } catch (flyToError) {
          console.error('❌ MapView: Error in flyTo call:', flyToError);
          console.log('  📊 Error details:', {
            name: flyToError instanceof Error ? flyToError.name : 'Unknown',
            message: flyToError instanceof Error ? flyToError.message : 'Unknown error',
            stack: flyToError instanceof Error ? flyToError.stack : 'No stack trace'
          });
          return false;
        }

        // Remove any existing highlight marker first
        if (highlightMarkerRef.current && mapInstanceRef.current.hasLayer(highlightMarkerRef.current)) {
          mapInstanceRef.current.removeLayer(highlightMarkerRef.current);
        }

        // Add a temporary marker to highlight the selected location
        const highlightIcon = L.divIcon({
          html: `
            <div style="
              background: #ef4444; 
              width: 32px; 
              height: 32px; 
              border-radius: 50%; 
              border: 3px solid white; 
              box-shadow: 0 4px 12px rgba(239, 68, 68, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              color: white;
              z-index: 1000;
              animation: pulse 2s infinite;
            ">🎯</div>
            <style>
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
                100% { transform: scale(1); opacity: 1; }
              }
            </style>
          `,
          className: 'search-highlight-marker',
          iconSize: [38, 38],
          iconAnchor: [19, 19]
        });

        const highlightMarker = L.marker([lat, lng], { icon: highlightIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="text-align: center; padding: 10px; min-width: 200px;">
              <div style="font-weight: 600; color: #033b4a; margin-bottom: 6px; font-size: 16px;">🎯 Searched Location</div>
              <div style="font-size: 14px; color: #6b7280; line-height: 1.4;">${name}</div>
              <div style="font-size: 12px; color: #9ca3af; margin-top: 4px;">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</div>
            </div>
          `)
          .openPopup();

        highlightMarkerRef.current = highlightMarker;
        console.log('MapView: Successfully added highlight marker at:', [lat, lng]);

        // Remove the highlight marker after 8 seconds
        setTimeout(() => {
          try {
            if (mapInstanceRef.current && highlightMarkerRef.current && mapInstanceRef.current.hasLayer(highlightMarkerRef.current)) {
              mapInstanceRef.current.removeLayer(highlightMarkerRef.current);
              console.log('MapView: Removed highlight marker');
              highlightMarkerRef.current = null;
            }
          } catch (err) {
            console.warn('MapView: Error removing highlight marker:', err);
          }
        }, 8000);

        return true;

      } catch (error) {
        console.error('MapView: Error handling external location selection:', error);
        return false;
      }
    };

    // Try immediately, then retry with delays if needed
    if (!attemptZoom()) {
      console.log('MapView: Initial zoom attempt failed, starting retry sequence...');
      const retryIntervals = [100, 300, 500, 1000, 2000];
      
      retryIntervals.forEach((delay, index) => {
        setTimeout(() => {
          console.log(`MapView: Retry attempt ${index + 1} after ${delay}ms...`);
          if (attemptZoom()) {
            console.log(`MapView: Successfully zoomed after ${delay}ms delay`);
          } else if (index === retryIntervals.length - 1) {
            console.warn('MapView: Failed to zoom after all retry attempts');
          } else {
            console.log(`MapView: Retry attempt ${index + 1} failed, will try again...`);
          }
        }, delay);
      });
    } else {
      console.log('MapView: Initial zoom attempt succeeded immediately');
    }
  }, [externalLocationSelection, leafletLoaded]);

  // Update markers when requests change
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded) return;

    const L = (window as any).L;
    const map = mapInstanceRef.current;

    // Check if map is still valid
    if (!map || !map.getContainer) {
      console.warn('Map instance is invalid, skipping marker update');
      return;
    }

    try {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        try {
          if (marker && map.hasLayer && map.hasLayer(marker)) {
            map.removeLayer(marker);
          }
        } catch (err) {
          console.warn('Error removing marker:', err);
        }
      });
      markersRef.current = [];

      // Add request markers
      filteredRequests.forEach((request, index) => {
        try {
          const coords = request.coordinates || generateMockCoordinates(request.location, index);
          
          // Validate coordinates
          if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
            console.warn(`Invalid coordinates for request ${request.id}:`, coords);
            return;
          }
          
          const urgencyColor = getUrgencyColor(request.urgency);
          const categoryIcon = getCategoryIcon(request.category);

          // Create custom marker with category icon and urgency color
          const markerIcon = L.divIcon({
            html: `
              <div style="
                background: ${urgencyColor}; 
                width: 32px; 
                height: 32px; 
                border-radius: 50%; 
                border: 3px solid white; 
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                color: white;
                cursor: pointer;
                transition: transform 0.2s ease;
              " 
              onmouseover="this.style.transform='scale(1.1)'" 
              onmouseout="this.style.transform='scale(1)'"
              >${categoryIcon}</div>
            `,
            className: 'request-marker',
            iconSize: [38, 38],
            iconAnchor: [19, 19]
          });

          const marker = L.marker([coords.lat, coords.lng], { icon: markerIcon })
            .addTo(map);

          // Create popup content
          const popupContent = `
            <div style="min-width: 250px; max-width: 300px; padding: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #033b4a; line-height: 1.3; flex: 1; margin-right: 8px;">${request.title}</h3>
                <span style="
                  background: ${urgencyColor}; 
                  color: white; 
                  padding: 2px 8px; 
                  border-radius: 12px; 
                  font-size: 11px; 
                  font-weight: 500;
                  white-space: nowrap;
                  text-transform: capitalize;
                ">${request.urgency}</span>
              </div>
              
              <div style="margin-bottom: 8px;">
                <span style="
                  background: #e8f5f0; 
                  color: #41695e; 
                  padding: 2px 8px; 
                  border-radius: 8px; 
                  font-size: 12px; 
                  font-weight: 500;
                ">${request.category}</span>
              </div>
              
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; line-height: 1.4;">${request.description}</p>
              
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px; font-size: 12px; color: #6b7280;">
                <span>📍</span>
                <span>${request.location}</span>
              </div>
              
              <div style="display: flex; gap: 8px; margin-top: 12px;">
                ${request.contact.phone ? `
                  <button 
                    onclick="window.open('tel:${request.contact.phone}', '_self')"
                    style="
                      background: #41695e; 
                      color: white; 
                      border: none; 
                      padding: 6px 12px; 
                      border-radius: 6px; 
                      font-size: 12px; 
                      cursor: pointer;
                      font-weight: 500;
                    "
                  >📞 Call</button>
                ` : ''}
                ${request.contact.email ? `
                  <button 
                    onclick="window.open('mailto:${request.contact.email}', '_self')"
                    style="
                      background: #41695e; 
                      color: white; 
                      border: none; 
                      padding: 6px 12px; 
                      border-radius: 6px; 
                      font-size: 12px; 
                      cursor: pointer;
                      font-weight: 500;
                    "
                  >✉️ Email</button>
                ` : ''}
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
          
          // Handle marker click
          marker.on('click', () => {
            setSelectedRequest(request);
            if (onRequestClick) {
              onRequestClick(request);
            }
          });

          markersRef.current.push(marker);
        } catch (err) {
          console.warn(`Error creating marker for request ${request.id}:`, err);
        }
      });

      // Add community markers if enabled
      if (showCommunities && communities) {
        communities.forEach((community, index) => {
          try {
            const coords = community.location_coordinates || generateMockCoordinates(community.location_name, index + 1000);
            
            // Validate coordinates
            if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
              console.warn(`Invalid coordinates for community ${community.id}:`, coords);
              return;
            }
            
            // Community marker styling - different from requests
            const communityColor = '#41695e'; // Sahaaya primary color
            const communityIcon = '🏛️'; // Building icon for communities
            
            // Create custom community marker
            const markerIcon = L.divIcon({
              html: `
                <div style="
                  background: ${communityColor}; 
                  width: 36px; 
                  height: 36px; 
                  border-radius: 12px; 
                  border: 3px solid white; 
                  box-shadow: 0 2px 8px rgba(65, 105, 94, 0.4);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 16px;
                  color: white;
                  cursor: pointer;
                  transition: transform 0.2s ease;
                  position: relative;
                " 
                onmouseover="this.style.transform='scale(1.1)'" 
                onmouseout="this.style.transform='scale(1)'"
                >
                  ${communityIcon}
                  ${community.verified ? '<div style="position: absolute; top: -4px; right: -4px; background: #10b981; border-radius: 50%; width: 12px; height: 12px; border: 2px solid white;"></div>' : ''}
                </div>
              `,
              className: 'community-marker',
              iconSize: [42, 42],
              iconAnchor: [21, 21]
            });

            const marker = L.marker([coords.lat, coords.lng], { icon: markerIcon })
              .addTo(map);

            // Create community popup content
            const popupContent = `
              <div style="min-width: 280px; max-width: 320px; padding: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #033b4a; line-height: 1.3; flex: 1; margin-right: 8px;">${community.name}</h3>
                  ${community.verified ? '<span style="color: #10b981; font-size: 14px;">✓ Verified</span>' : ''}
                </div>
                
                <div style="margin-bottom: 8px;">
                  <span style="
                    background: #e8f5f0; 
                    color: #41695e; 
                    padding: 2px 8px; 
                    border-radius: 8px; 
                    font-size: 12px; 
                    font-weight: 500;
                  ">${community.category}</span>
                  <span style="
                    background: ${community.privacy_type === 'public' ? '#dbeafe' : community.privacy_type === 'private' ? '#fef3c7' : '#e0e7ff'}; 
                    color: ${community.privacy_type === 'public' ? '#1e40af' : community.privacy_type === 'private' ? '#92400e' : '#3730a3'}; 
                    padding: 2px 8px; 
                    border-radius: 8px; 
                    font-size: 11px; 
                    font-weight: 500;
                    margin-left: 4px;
                  ">${community.privacy_type}</span>
                </div>
                
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; line-height: 1.4;">${community.description}</p>
                
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; font-size: 12px; color: #6b7280;">
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span>👥</span>
                    <span>${community.member_count} members</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span>⭐</span>
                    <span>${community.trust_score}/5</span>
                  </div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px; font-size: 12px; color: #6b7280;">
                  <span>📍</span>
                  <span>${community.location_name}</span>
                </div>
                
                <div style="margin-bottom: 8px; font-size: 12px; color: #6b7280;">
                  Admin: ${community.admin_name}
                </div>
                
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                  <button 
                    onclick="document.dispatchEvent(new CustomEvent('viewCommunity', { detail: '${community.id}' }))"
                    style="
                      background: #41695e; 
                      color: white; 
                      border: none; 
                      padding: 6px 12px; 
                      border-radius: 6px; 
                      font-size: 12px; 
                      cursor: pointer;
                      font-weight: 500;
                    "
                  >View Details</button>
                  <button 
                    onclick="document.dispatchEvent(new CustomEvent('joinCommunity', { detail: '${community.id}' }))"
                    style="
                      background: transparent; 
                      color: #41695e; 
                      border: 1px solid #41695e; 
                      padding: 6px 12px; 
                      border-radius: 6px; 
                      font-size: 12px; 
                      cursor: pointer;
                      font-weight: 500;
                    "
                  >${community.privacy_type === 'public' ? 'Join' : 'Request to Join'}</button>
                </div>
              </div>
            `;

            marker.bindPopup(popupContent, {
              maxWidth: 350,
              className: 'custom-popup'
            });

            marker.on('click', () => {
              setSelectedCommunity(community);
              if (onCommunityClick) {
                onCommunityClick(community);
              }
            });

            markersRef.current.push(marker);
          } catch (err) {
            console.warn(`Error creating marker for community ${community.id}:`, err);
          }
        });
      }

      // Fit map to show all markers if there are any
      if (markersRef.current.length > 0) {
        try {
          const group = new L.featureGroup(markersRef.current);
          const bounds = group.getBounds();
          
          // If we have multiple markers spread across India, fit to show all
          if (markersRef.current.length > 5) {
            map.fitBounds(bounds, { 
              padding: [20, 20],
              maxZoom: 6 // Don't zoom in too much when showing all of India
            });
          } else {
            map.fitBounds(bounds, { padding: [20, 20] });
          }
        } catch (err) {
          console.warn('Error fitting map bounds:', err);
        }
      }
    } catch (err) {
      console.error('Error updating map markers:', err);
      setError('Failed to update map markers');
    }
  }, [filteredRequests, leafletLoaded, communities, showCommunities, mapKey]);

  const centerOnUser = () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 13);
    }
  };

  if (error) {
    return (
      <Card className={`${className} border-2 border-dashed border-gray-300`}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Map Loading Failed</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  setLeafletLoaded(false);
                  setMapKey(prev => prev + 1); // Force re-render with new key
                  // Don't reload the entire page, just reset the map
                }}
                variant="outline"
                className="mx-auto"
              >
                Retry Loading Map
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} relative overflow-hidden shadow-lg`} style={{ backgroundColor: '#ffffff' }}>
      <CardContent className="p-0 relative">
        {/* Map Container */}
        <div 
          ref={mapRef} 
          key={mapKey}
          style={{ height, width: '100%' }}
          className="relative z-10"
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center z-20"
            style={{ backgroundColor: 'rgba(249, 254, 250, 0.9)' }}
          >
            <div className="text-center space-y-4">
              <div 
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center shadow-lg"
                style={{ backgroundColor: '#41695e' }}
              >
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-30 space-y-2">
          <Button
            onClick={centerOnUser}
            size="sm"
            className="shadow-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
            variant="outline"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="absolute bottom-16 sm:bottom-20 right-1 sm:right-2 z-30 relative search-container">
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-52 sm:w-60 md:w-64 pl-8 sm:pl-10 pr-8 sm:pr-10 bg-white border border-gray-200 shadow-lg rounded-lg text-xs sm:text-sm h-8 sm:h-10"
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowSearchResults(true);
                }
              }}
            />
            {searchQuery && (
              <Button
                onClick={clearSearch}
                className="absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 p-0 text-gray-400 hover:text-gray-600"
                variant="ghost"
                size="sm"
              >
                <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </Button>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 sm:max-h-48 overflow-y-auto z-40">
              {searchResults.map((location, index) => (
                <div 
                  key={index}
                  className="flex items-center p-2 sm:p-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                  onClick={() => selectLocation(location)}
                >
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 sm:mr-2.5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{location.name}</p>
                    <p className="text-xs text-gray-500 truncate">{location.state}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-1 sm:bottom-4 right-1 sm:right-2 z-30">
          {/* Only show urgency legend when there are requests */}
          {requests.length > 0 && (
            <Card className="shadow-lg border border-gray-200 w-36 sm:w-auto" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
              <CardContent className="p-1.5 sm:p-3">
                <div className="space-y-1.5 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-900">Urgency Levels</h4>
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-1">Demo</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 sm:gap-2 text-xs">
                    <div 
                      className={`flex items-center gap-1 sm:gap-2 cursor-pointer px-2 py-1 rounded-lg transition-all duration-200 ${
                        activeUrgencyFilters.has('critical') 
                          ? 'bg-red-50 hover:bg-red-100 border border-red-200' 
                          : 'opacity-50 hover:opacity-75 bg-gray-50 border border-gray-200'
                      }`}
                      onClick={() => toggleUrgencyFilter('critical')}
                    >
                      <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full bg-red-600 border border-white sm:border-2 shadow-sm flex-shrink-0"></div>
                      <span className="font-medium text-xs sm:text-xs flex-1">Critical</span>
                      <span className="text-xs text-gray-500">
                        {requests.filter(r => r.urgency === 'critical').length}
                      </span>
                    </div>
                    <div 
                      className={`flex items-center gap-1 sm:gap-2 cursor-pointer px-2 py-1 rounded-lg transition-all duration-200 ${
                        activeUrgencyFilters.has('high') 
                          ? 'bg-orange-50 hover:bg-orange-100 border border-orange-200' 
                          : 'opacity-50 hover:opacity-75 bg-gray-50 border border-gray-200'
                      }`}
                      onClick={() => toggleUrgencyFilter('high')}
                    >
                      <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full bg-orange-600 border border-white sm:border-2 shadow-sm flex-shrink-0"></div>
                      <span className="font-medium text-xs sm:text-xs flex-1">High</span>
                      <span className="text-xs text-gray-500">
                        {requests.filter(r => r.urgency === 'high').length}
                      </span>
                    </div>
                    <div 
                      className={`flex items-center gap-1 sm:gap-2 cursor-pointer px-2 py-1 rounded-lg transition-all duration-200 ${
                        activeUrgencyFilters.has('medium') 
                          ? 'bg-yellow-50 hover:bg-yellow-100 border border-yellow-200' 
                          : 'opacity-50 hover:opacity-75 bg-gray-50 border border-gray-200'
                      }`}
                      onClick={() => toggleUrgencyFilter('medium')}
                    >
                      <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full bg-yellow-600 border border-white sm:border-2 shadow-sm flex-shrink-0"></div>
                      <span className="font-medium text-xs sm:text-xs flex-1">Medium</span>
                      <span className="text-xs text-gray-500">
                        {requests.filter(r => r.urgency === 'medium').length}
                      </span>
                    </div>
                    <div 
                      className={`flex items-center gap-1 sm:gap-2 cursor-pointer px-2 py-1 rounded-lg transition-all duration-200 ${
                        activeUrgencyFilters.has('low') 
                          ? 'bg-green-50 hover:bg-green-100 border border-green-200' 
                          : 'opacity-50 hover:opacity-75 bg-gray-50 border border-gray-200'
                      }`}
                      onClick={() => toggleUrgencyFilter('low')}
                    >
                      <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full bg-green-600 border border-white sm:border-2 shadow-sm flex-shrink-0"></div>
                      <span className="font-medium text-xs sm:text-xs flex-1">Low</span>
                      <span className="text-xs text-gray-500">
                        {requests.filter(r => r.urgency === 'low').length}
                      </span>
                    </div>
                  </div>
                  <div className="pt-1 sm:pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 leading-none sm:leading-normal">
                      Click levels to filter • {activeUrgencyFilters.size === 4 ? 'All shown' : `${activeUrgencyFilters.size}/4 active`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Request Count Badge */}
        {requests.length > 0 && (
          <div className="absolute top-4 left-4 z-30">
            <Badge 
              variant="secondary" 
              className="shadow-lg bg-white border border-gray-200 text-gray-700"
            >
              {filteredRequests.length} requests nearby ({filteredRequests.filter(r => r.id.startsWith('demo-')).length} demo)
            </Badge>
          </div>
        )}

        {/* Location Status Badge */}
        {userLocation && (
          <div className={`absolute top-4 left-4 z-30 ${requests.length > 0 ? 'mt-8' : ''} space-y-2`}>
            <Badge 
              variant={locationStatus === 'granted' ? 'default' : 'secondary'}
              className={`shadow-lg border ${
                locationStatus === 'granted' 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : locationStatus === 'denied'
                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              {locationStatus === 'granted' && '📍 Your location'}
              {locationStatus === 'denied' && '⚠️ Location access denied - showing Mumbai area'}
              {locationStatus === 'default' && '📍 Default location (Mumbai area)'}
            </Badge>
            
            {locationStatus === 'denied' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 max-w-xs shadow-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-orange-800">
                    <p className="font-medium mb-1">Location access needed</p>
                    <p className="mb-2">To see nearby help requests, please:</p>
                    <ol className="list-decimal list-inside text-xs space-y-1 mb-2">
                      <li>Click the location icon in your browser's address bar</li>
                      <li>Select "Allow" for location access</li>
                      <li>Refresh the page if needed</li>
                    </ol>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={retryLocationAccess}
                      className="h-6 px-2 text-xs border-orange-300 hover:bg-orange-100"
                      disabled={locationStatus === 'loading'}
                    >
                      {locationStatus === 'loading' ? 'Checking...' : 'Try Again'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}