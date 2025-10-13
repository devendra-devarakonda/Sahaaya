import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { PlaceSearchInput } from './PlaceSearchInput';
import { 
  Search,
  MapPin,
  Clock,
  Heart,
  Filter,
  Users,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  Calendar,
  IndianRupee,
  Map,
  List
} from 'lucide-react';
import { MapView, MapRequest, MapCommunity } from './MapView';

interface MatchingScreenProps {
  userRole: 'individual' | 'ngo' | null;
  setCurrentPage?: (page: string) => void;
  setSelectedCommunityId?: (id: string) => void;
}

export function MatchingScreen({
  userRole,
  setCurrentPage,
  setSelectedCommunityId
}: MatchingScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapRef, setMapRef] = useState<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapLocationSelection, setMapLocationSelection] = useState<{
    coordinates: [number, number];
    name: string;
  } | null>(null);
  const [zoomStatus, setZoomStatus] = useState<'idle' | 'attempting' | 'success' | 'failed'>('idle');
  
  // Filter state
  const [urgencyFilter, setUrgencyFilter] = useState<string[]>(['Critical', 'High', 'Medium', 'Low']);
  
  // Debug: Log mapLocationSelection changes
  useEffect(() => {
    console.log('🔄 MatchingScreen: mapLocationSelection state changed:', mapLocationSelection);
  }, [mapLocationSelection]);

  const categories = [
    'Food & Nutrition',
    'Medical & Healthcare', 
    'Education',
    'Shelter & Housing',
    'Employment',
    'Financial Assistance',
    'Clothing',
    'Transportation',
    'Emergency Relief'
  ];

  const urgencyConfig = {
    critical: { color: 'bg-red-100 text-red-800', label: 'Critical' },
    high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
    medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
    low: { color: 'bg-green-100 text-green-800', label: 'Low' }
  };

  const statusConfig = {
    pending: { color: 'bg-blue-100 text-blue-800', label: 'Pending' },
    matched: { color: 'bg-purple-100 text-purple-800', label: 'Matched' },
    in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
    completed: { color: 'bg-green-100 text-green-800', label: 'Completed' }
  };

  // Mock data - replace with actual API call
  const mockRequests = [
    {
      id: '1',
      title: 'Emergency Surgery Required',
      description: 'Need urgent financial assistance for emergency surgery. Patient is in critical condition.',
      category: 'Medical & Healthcare',
      urgency: 'critical' as const,
      location: 'Mumbai',
      coordinates: { lat: 19.0760, lng: 72.8777 },
      requester: 'Priya Sharma',
      amount: '₹2,50,000',
      verified: true,
      contact: {
        phone: '+91 98765 43210',
        email: 'priya.sharma@email.com'
      },
      timestamp: '2 hours ago',
      tags: ['Surgery', 'Critical', 'Mumbai'],
      supporters: 12
    },
    {
      id: '2',
      title: 'School Fee Support Needed',
      description: 'Single mother seeking help with children\'s school fees for the upcoming academic year.',
      category: 'Education & Learning',
      urgency: 'high' as const,
      location: 'Delhi',
      coordinates: { lat: 28.6139, lng: 77.2090 },
      requester: 'Sunita Devi',
      amount: '₹45,000',
      verified: true,
      contact: {
        phone: '+91 98765 43211',
        email: 'sunita.devi@email.com'
      },
      timestamp: '5 hours ago',
      tags: ['Education', 'School Fees', 'Delhi'],
      supporters: 8
    },
    {
      id: '3',
      title: 'Monthly Grocery Support',
      description: 'Elderly couple needs assistance with monthly groceries and basic necessities.',
      category: 'Food & Nutrition',
      urgency: 'medium' as const,
      location: 'Pune',
      coordinates: { lat: 18.5204, lng: 73.8567 },
      requester: 'Ramesh & Kamala Patel',
      amount: '₹8,000',
      verified: false,
      contact: {
        phone: '+91 98765 43212',
        email: 'patel.family@email.com'
      },
      timestamp: '1 day ago',
      tags: ['Food', 'Groceries', 'Pune'],
      supporters: 5
    },
    {
      id: '4',
      title: 'Counseling Support Needed',
      description: 'Young adult seeking mental health counseling support after family tragedy.',
      category: 'Mental Health',
      urgency: 'high' as const,
      location: 'Bangalore',
      coordinates: { lat: 12.9716, lng: 77.5946 },
      requester: 'Anonymous',
      amount: '₹15,000',
      verified: true,
      contact: {
        email: 'support.needed@email.com'
      },
      timestamp: '3 hours ago',
      tags: ['Mental Health', 'Counseling', 'Bangalore'],
      supporters: 15
    },
    {
      id: '5',
      title: 'Disaster Relief - Flood Victims',
      description: 'Coordinating relief efforts for flood-affected families in rural areas.',
      category: 'NGO Support',
      urgency: 'critical' as const,
      location: 'Chennai',
      coordinates: { lat: 13.0827, lng: 80.2707 },
      requester: 'Chennai Relief Foundation',
      amount: '₹5,00,000',
      verified: true,
      contact: {
        phone: '+91 98765 43213',
        email: 'relief@chennaifoundation.org'
      },
      timestamp: '1 hour ago',
      tags: ['Disaster Relief', 'NGO', 'Chennai'],
      supporters: 45
    },
    {
      id: '6',
      title: 'Small Business Loan',
      description: 'Help needed to restart small tailoring business after equipment theft.',
      category: 'Financial Support',
      urgency: 'medium' as const,
      location: 'Mumbai',
      coordinates: { lat: 19.0860, lng: 72.8877 },
      requester: 'Meera Joshi',
      amount: '₹75,000',
      verified: true,
      contact: {
        phone: '+91 98765 43214',
        email: 'meera.joshi@email.com'
      },
      timestamp: '6 hours ago',
      tags: ['Business', 'Loan', 'Mumbai'],
      supporters: 3
    }
  ] as MapRequest[];

  // Community functionality has been moved to the Communities page

  const filteredRequests = mockRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || request.category === selectedCategory;
    const matchesUrgency = selectedUrgency === 'all' || request.urgency === selectedUrgency;
    // Location search is used for map zoom only, not for filtering requests
    // const matchesLocation = selectedLocation === 'all' || request.location.includes(selectedLocation);
    
    return matchesSearch && matchesCategory && matchesUrgency;
  });

  const handleConnect = (requestId: string) => {
    // In real app, this would connect the donor/volunteer with the requester
    alert(`Connecting with request ${requestId}. You'll receive contact details via email/SMS.`);
  };

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

  const getUrgencyBadgeColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f9fefa' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl mb-4" style={{ color: '#033b4a' }}>
            Browse Help Requests
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Discover help requests near you and make a meaningful impact in your community.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 shadow-sm border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Demo Notice Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center space-x-2">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Demo Mode:</span> Map shows sample requests with color-coded urgency levels - 
                  <span className="inline-flex items-center space-x-1 ml-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span><span className="text-xs">Critical</span>
                    <span className="w-2 h-2 bg-orange-500 rounded-full ml-2"></span><span className="text-xs">High</span>
                    <span className="w-2 h-2 bg-yellow-500 rounded-full ml-2"></span><span className="text-xs">Medium</span>
                    <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span><span className="text-xs">Low</span>
                  </span>
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by keywords, category, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full h-11 text-sm sm:text-base"
                />
              </div>

              {/* Stats and Controls Row */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0 gap-3">
                {/* Results Info */}
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                  <span className="font-medium">Showing {filteredRequests.length} requests</span>
                  {filteredRequests.length > 0 && (
                    <span className="hidden sm:inline">• Sorted by urgency and distance</span>
                  )}
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-between sm:justify-end space-x-3 order-1 sm:order-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center border border-gray-200 rounded-lg p-1 shadow-sm" 
                       style={{ backgroundColor: '#f9fefa' }}>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="flex items-center space-x-1 h-8 px-2 sm:px-3 min-w-0"
                      style={viewMode === 'list' ? { backgroundColor: '#41695e', color: 'white' } : {}}
                    >
                      <List className="h-3 w-3 flex-shrink-0" />
                      <span className="text-xs hidden sm:inline">List</span>
                    </Button>
                    <Button
                      variant={viewMode === 'map' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('map')}
                      className="flex items-center space-x-1 h-8 px-2 sm:px-3 min-w-0"
                      style={viewMode === 'map' ? { backgroundColor: '#41695e', color: 'white' } : {}}
                    >
                      <Map className="h-3 w-3 flex-shrink-0" />
                      <span className="text-xs hidden sm:inline">Map</span>
                    </Button>
                  </div>
                  
                  {/* Filter Toggle Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-1 h-8 px-3 shadow-sm border-gray-200 hover:border-gray-300 transition-all duration-200"
                    style={{ 
                      backgroundColor: showFilters ? '#41695e' : 'white',
                      color: showFilters ? 'white' : '#41695e'
                    }}
                  >
                    <Filter className="h-3 w-3 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Filters</span>
                    {showFilters && <span className="ml-1 text-xs">×</span>}
                  </Button>
                </div>
              </div>

              {/* Expanded Filters */}
              {showFilters && (
                <div className="pt-4 border-t border-gray-200 space-y-4 sm:space-y-0 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Category</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Urgency</label>
                      <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="All urgency levels" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Urgency Levels</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <label className="text-sm font-medium text-gray-700">Search Location (Map Zoom)</label>
                      <PlaceSearchInput
                        value={selectedLocation === 'all' ? '' : selectedLocation}
                        onChange={(location, coordinates) => {
                          console.log('🎬 MatchingScreen: PlaceSearchInput onChange FIRED!');
                          console.log('🔍 MatchingScreen: PlaceSearchInput onChange called');
                          console.log('  📍 Location:', location);
                          console.log('  🌐 Coordinates:', coordinates);
                          console.log('  📊 Coordinates type:', typeof coordinates);
                          console.log('  📋 Is Array:', Array.isArray(coordinates));
                          
                          setSelectedLocation(location || 'all');
                          
                          // Send location to map for zooming (works for both current and future map views)
                          if (coordinates && location) {
                            console.log('✅ MatchingScreen: Valid data received - preparing to set map location');
                            console.log('  🎯 Zoom target:', { lat: coordinates[0], lng: coordinates[1] });
                            console.log('  📺 Current view mode:', viewMode);
                            
                            // Update zoom status
                            setZoomStatus('attempting');
                            
                            // Clear any existing selection first
                            console.log('🧹 MatchingScreen: Clearing existing mapLocationSelection');
                            setMapLocationSelection(null);
                            
                            // Set new selection after a tiny delay to ensure clean state
                            setTimeout(() => {
                              const newSelection = {
                                coordinates,
                                name: location
                              };
                              console.log('🎯 MatchingScreen: Setting NEW mapLocationSelection:', newSelection);
                              console.log('  📐 Final coordinates to pass:', newSelection.coordinates);
                              setMapLocationSelection(newSelection);
                              
                              // Reset zoom status after a delay (simulating zoom completion)
                              setTimeout(() => {
                                setZoomStatus('success');
                                setTimeout(() => setZoomStatus('idle'), 2000);
                              }, 1000);
                            }, 50);
                          } else {
                            console.log('❌ MatchingScreen: Invalid data - cannot proceed with zoom');
                            console.log('  📍 Location valid:', !!location);
                            console.log('  🌐 Coordinates valid:', !!coordinates);
                            setZoomStatus('failed');
                            setTimeout(() => setZoomStatus('idle'), 2000);
                          }
                        }}
                        placeholder="Search location to zoom map..."
                        className="h-10 text-sm"
                      />
                      
                      {/* DEBUG: Test button to manually set location */}
                      <button
                        type="button"
                        onClick={() => {
                          console.log('🧪 DEBUG: Manual test - setting Mumbai location');
                          const testLocation = {
                            coordinates: [19.0760, 72.8777] as [number, number],
                            name: 'Mumbai, Maharashtra (Test)'
                          };
                          setMapLocationSelection(testLocation);
                        }}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        🧪 Test Mumbai Zoom
                      </button>
                      <div className="flex items-center justify-between">
                        {selectedLocation !== 'all' && (
                          <button
                            onClick={() => {
                              setSelectedLocation('all');
                              setMapLocationSelection(null);
                              setZoomStatus('idle');
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                          >
                            Clear location search
                          </button>
                        )}
                        
                        {/* Zoom Status Indicator */}
                        {zoomStatus !== 'idle' && (
                          <div className="flex items-center space-x-1 text-xs">
                            {zoomStatus === 'attempting' && (
                              <>
                                <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-blue-600">Zooming to location...</span>
                              </>
                            )}
                            {zoomStatus === 'success' && (
                              <>
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-green-600">✓ Map zoomed successfully</span>
                              </>
                            )}
                            {zoomStatus === 'failed' && (
                              <>
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-red-600">✗ Zoom failed</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Clear Filters Button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedUrgency('all');
                        setSelectedLocation('all');
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 h-8 px-3"
                    >
                      Clear all filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        {filteredRequests.length > 0 ? (
          <div className="space-y-6">
            {viewMode === 'list' && (
              <>
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <Card key={request.id} className="shadow-lg border-l-4 hover:shadow-xl transition-shadow" 
                          style={{ borderLeftColor: getUrgencyColor(request.urgency) }}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <CardTitle className="text-lg">{request.title}</CardTitle>
                              {request.verified && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="bg-gray-50">
                                {request.category}
                              </Badge>
                              <Badge 
                                className={`${getUrgencyBadgeColor(request.urgency)} text-white`}
                                style={{ backgroundColor: getUrgencyColor(request.urgency) }}
                              >
                                {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-sm text-gray-500">{request.timestamp}</p>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <MapPin className="h-3 w-3" />
                              <span>{request.location}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-gray-700 leading-relaxed">{request.description}</p>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">{request.requester}</span>
                            </div>
                            {request.amount && (
                              <div className="flex items-center space-x-2">
                                <IndianRupee className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">{request.amount}</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Heart className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">{request.supporters} responses</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Request #{request.id}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <div className="flex space-x-2">
                            {request.contact.phone && (
                              <Button size="sm" className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>Call</span>
                              </Button>
                            )}
                            {request.contact.email && (
                              <Button variant="outline" size="sm" className="flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span>Email</span>
                              </Button>
                            )}
                          </div>
                          
                          <Button 
                            className="px-6"
                            style={{ backgroundColor: '#41695e', color: 'white' }}
                          >
                            {userRole === 'individual' ? 'Offer Help' : 'Support Request'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Load More Button */}
                <div className="text-center">
                  <Button variant="outline" size="lg" className="px-8">
                    Load More Requests
                  </Button>
                </div>
              </>
            )}

            {/* Map View */}
            {viewMode === 'map' && (
              <div className="mt-6 space-y-4">
                {/* Map Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Map Navigation:</span> Use the location filter above to search and zoom to specific places, or click markers to view request details. The map automatically centers on your location.
                    </p>
                  </div>
                </div>



                {/* Debug: Check what's being passed to MapView */}
                {(() => {
                  console.log('🗺️ MatchingScreen: Rendering MapView component');
                  console.log('  📊 mapLocationSelection state:', mapLocationSelection);
                  console.log('  📺 Current viewMode:', viewMode);
                  console.log('  📋 Number of filtered requests:', filteredRequests.length);
                  return null;
                })()}
                <MapView 
                  requests={filteredRequests} 
                  communities={[]} // No communities in matching view - moved to community page
                  showCommunities={false}
                  height="600px"
                  className="w-full"
                  externalLocationSelection={mapLocationSelection}
                  onRequestClick={(request) => {
                    console.log('Request clicked:', request);
                    // You can add additional logic here, like opening a detailed view
                  }}
                  onCommunityClick={(community) => {
                    console.log('Community clicked:', community);
                    // Navigate to community details
                    setCurrentPage?.('community-details');
                    setSelectedCommunityId?.(community.id);
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters to find matching requests.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setSelectedUrgency('all');
                  setSelectedLocation('all');
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}