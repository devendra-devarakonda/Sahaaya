import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { MapPin, Search, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Place {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
  type: string;
  address_components?: {
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface PlaceSearchInputProps {
  value: string;
  onChange: (value: string, coordinates?: [number, number], place?: Place) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PlaceSearchInput({ 
  value, 
  onChange, 
  placeholder = "Search for a place...",
  className = "",
  disabled = false
}: PlaceSearchInputProps) {
  console.log('🔧 PlaceSearchInput: Component mounted/re-rendered with:', { value, placeholder });
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Mock place data for demo mode
  const mockPlaces: Place[] = [
    {
      display_name: "Mumbai, Maharashtra, India",
      lat: "19.0760",
      lon: "72.8777",
      place_id: "mumbai_1",
      type: "city",
      address_components: { city: "Mumbai", state: "Maharashtra", country: "India" }
    },
    {
      display_name: "Delhi, India",
      lat: "28.6139",
      lon: "77.2090",
      place_id: "delhi_1",
      type: "city",
      address_components: { city: "Delhi", state: "Delhi", country: "India" }
    },
    {
      display_name: "Bangalore, Karnataka, India",
      lat: "12.9716",
      lon: "77.5946",
      place_id: "bangalore_1",
      type: "city",
      address_components: { city: "Bangalore", state: "Karnataka", country: "India" }
    },
    {
      display_name: "Pune, Maharashtra, India",
      lat: "18.5204",
      lon: "73.8567",
      place_id: "pune_1",
      type: "city",
      address_components: { city: "Pune", state: "Maharashtra", country: "India" }
    },
    {
      display_name: "Chennai, Tamil Nadu, India",
      lat: "13.0827",
      lon: "80.2707",
      place_id: "chennai_1",
      type: "city",
      address_components: { city: "Chennai", state: "Tamil Nadu", country: "India" }
    },
    {
      display_name: "Hyderabad, Telangana, India",
      lat: "17.3850",
      lon: "78.4867",
      place_id: "hyderabad_1",
      type: "city",
      address_components: { city: "Hyderabad", state: "Telangana", country: "India" }
    },
    {
      display_name: "Kolkata, West Bengal, India",
      lat: "22.5726",
      lon: "88.3639",
      place_id: "kolkata_1",
      type: "city",
      address_components: { city: "Kolkata", state: "West Bengal", country: "India" }
    },
    {
      display_name: "Ahmedabad, Gujarat, India",
      lat: "23.0225",
      lon: "72.5714",
      place_id: "ahmedabad_1",
      type: "city",
      address_components: { city: "Ahmedabad", state: "Gujarat", country: "India" }
    },
    {
      display_name: "Jaipur, Rajasthan, India",
      lat: "26.9124",
      lon: "75.7873",
      place_id: "jaipur_1",
      type: "city",
      address_components: { city: "Jaipur", state: "Rajasthan", country: "India" }
    },
    {
      display_name: "Surat, Gujarat, India",
      lat: "21.1702",
      lon: "72.8311",
      place_id: "surat_1",
      type: "city",
      address_components: { city: "Surat", state: "Gujarat", country: "India" }
    },
    {
      display_name: "Lucknow, Uttar Pradesh, India",
      lat: "26.8467",
      lon: "80.9462",
      place_id: "lucknow_1",
      type: "city",
      address_components: { city: "Lucknow", state: "Uttar Pradesh", country: "India" }
    },
    {
      display_name: "Kanpur, Uttar Pradesh, India",
      lat: "26.4499",
      lon: "80.3319",
      place_id: "kanpur_1",
      type: "city",
      address_components: { city: "Kanpur", state: "Uttar Pradesh", country: "India" }
    },
    {
      display_name: "Nagpur, Maharashtra, India",
      lat: "21.1458",
      lon: "79.0882",
      place_id: "nagpur_1",
      type: "city",
      address_components: { city: "Nagpur", state: "Maharashtra", country: "India" }
    },
    {
      display_name: "Indore, Madhya Pradesh, India",
      lat: "22.7196",
      lon: "75.8577",
      place_id: "indore_1",
      type: "city",
      address_components: { city: "Indore", state: "Madhya Pradesh", country: "India" }
    },
    {
      display_name: "Thane, Maharashtra, India",
      lat: "19.2183",
      lon: "72.9781",
      place_id: "thane_1",
      type: "city",
      address_components: { city: "Thane", state: "Maharashtra", country: "India" }
    },
    {
      display_name: "Bhopal, Madhya Pradesh, India",
      lat: "23.2599",
      lon: "77.4126",
      place_id: "bhopal_1",
      type: "city",
      address_components: { city: "Bhopal", state: "Madhya Pradesh", country: "India" }
    },
    {
      display_name: "Visakhapatnam, Andhra Pradesh, India",
      lat: "17.6868",
      lon: "83.2185",
      place_id: "visakhapatnam_1",
      type: "city",
      address_components: { city: "Visakhapatnam", state: "Andhra Pradesh", country: "India" }
    },
    {
      display_name: "Pimpri-Chinchwad, Maharashtra, India",
      lat: "18.6298",
      lon: "73.7997",
      place_id: "pimpri_1",
      type: "city",
      address_components: { city: "Pimpri-Chinchwad", state: "Maharashtra", country: "India" }
    },
    {
      display_name: "Patna, Bihar, India",
      lat: "25.5941",
      lon: "85.1376",
      place_id: "patna_1",
      type: "city",
      address_components: { city: "Patna", state: "Bihar", country: "India" }
    },
    {
      display_name: "Vadodara, Gujarat, India",
      lat: "22.3072",
      lon: "73.1812",
      place_id: "vadodara_1",
      type: "city",
      address_components: { city: "Vadodara", state: "Gujarat", country: "India" }
    }
  ];

  const searchPlaces = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // In demo mode, use mock data
      const filteredMockPlaces = mockPlaces.filter(place => 
        place.display_name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      setSuggestions(filteredMockPlaces);

      // In production, you would use a real geocoding service like:
      
      // Option 1: OpenStreetMap Nominatim (Free)
      // const response = await fetch(
      //   `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=5`
      // );
      // const data = await response.json();
      // setSuggestions(data);

      // Option 2: Google Places API (Paid)
      // const service = new window.google.maps.places.AutocompleteService();
      // service.getPlacePredictions({
      //   input: searchQuery,
      //   componentRestrictions: { country: 'in' }
      // }, (predictions, status) => {
      //   if (status === window.google.maps.places.PlacesServiceStatus.OK) {
      //     setSuggestions(predictions || []);
      //   }
      // });

    } catch (error) {
      console.error('Error searching places:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (query && query !== value) {
        searchPlaces(query);
        setShowSuggestions(true);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, value]);

  const handleSelectPlace = (place: Place) => {
    const coordinates: [number, number] = [parseFloat(place.lat), parseFloat(place.lon)];
    console.log('PlaceSearchInput: Selected place:', { 
      place: place.display_name, 
      coordinates, 
      lat: place.lat, 
      lon: place.lon 
    });
    
    setQuery(place.display_name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onChange(place.display_name, coordinates, place);
    
    // Show toast notification for better user feedback
    toast.success(`📍 Location selected: ${place.display_name}`, {
      duration: 2000,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectPlace(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.', {
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // In demo mode, just use a generic location name
        const locationName = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        setQuery(locationName);
        onChange(locationName, [latitude, longitude]);
        
        // Show success toast
        toast.success('📍 Current location detected!', {
          duration: 2000,
        });
        
        // In production, you would reverse geocode to get the actual place name:
        // try {
        //   const response = await fetch(
        //     `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        //   );
        //   const data = await response.json();
        //   const locationName = data.display_name;
        //   setQuery(locationName);
        //   onChange(locationName, [latitude, longitude]);
        // } catch (error) {
        //   console.error('Error reverse geocoding:', error);
        // }
        
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
        
        // Handle different geolocation error types with specific messages
        let errorMessage = 'Unable to get your location. Please enter it manually.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please enter your location manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or enter manually.';
            break;
        }
        
        console.warn('Geolocation error:', {
          code: error.code,
          message: error.message,
          errorType: error.code === 1 ? 'PERMISSION_DENIED' : 
                     error.code === 2 ? 'POSITION_UNAVAILABLE' : 
                     error.code === 3 ? 'TIMEOUT' : 'UNKNOWN'
        });
        
        toast.error(errorMessage, {
          duration: 4000,
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const clearInput = () => {
    setQuery('');
    onChange('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={`pl-10 pr-20 ${className}`}
          disabled={disabled}
        />
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearInput}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isLoading}
            className="h-8 w-8 p-0 hover:bg-gray-100"
            title="Use current location"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <MapPin className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((place, index) => (
            <div
              key={place.place_id}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => handleSelectPlace(place)}
            >
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {place.display_name}
                  </p>
                  {place.address_components && (
                    <p className="text-xs text-gray-500 truncate">
                      {place.address_components.city && `${place.address_components.city}, `}
                      {place.address_components.state}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Demo Mode Notice */}
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
            <p className="text-xs text-blue-600">
              <span className="font-medium">Demo Mode:</span> Showing sample Indian cities. 
              In production, this would search global locations using a geocoding service.
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && suggestions.length === 0 && query.length > 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-4 py-3 flex items-center space-x-3">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="text-sm text-gray-600">Searching places...</span>
          </div>
        </div>
      )}
    </div>
  );
}