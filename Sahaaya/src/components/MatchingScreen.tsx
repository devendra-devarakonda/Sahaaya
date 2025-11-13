import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardContent, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { PlaceSearchInput } from './PlaceSearchInput';
import { toast } from 'sonner@2.0.3';
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
  List,
  X,
  UserCheck,
  Home
} from 'lucide-react';
import { MapView, MapRequest, MapCommunity } from './MapView';
import { getBrowseRequests, subscribeToBrowseRequests, unsubscribeChannel, createHelpOffer } from '../utils/supabaseService';

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
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter state
  const [urgencyFilter, setUrgencyFilter] = useState<string[]>(['Critical', 'High', 'Medium', 'Low']);
  
  // Detail dialog state
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isOffering, setIsOffering] = useState(false);
  const [showContactCard, setShowContactCard] = useState(false);
  const [helperContactInfo, setHelperContactInfo] = useState<any | null>(null);
  
  // Load browse requests from Supabase with real-time subscriptions
  useEffect(() => {
    let subscription: any = null;

    const loadRequests = async () => {
      setIsLoading(true);
      
      try {
        // Fetch browse requests (excludes current user's requests)
        const response = await getBrowseRequests();
        
        if (response.success && response.data) {
          setRequests(response.data);
        } else if (response.error) {
          console.error('Error loading browse requests:', response.error);
          toast.error(response.error);
        }

        // Set up real-time subscription for new requests from other users
        subscription = subscribeToBrowseRequests(
          (newRequest) => {
            console.log('New request from another user:', newRequest);
            
            // Add new request to the top of the list
            setRequests(prev => [newRequest, ...prev]);
            
            // Show toast notification
            toast.success(`New ${newRequest.urgency} request: ${newRequest.title}`, {
              description: 'A new help request is available in your area',
              duration: 5000
            });
          },
          (error) => {
            console.error('Real-time subscription error:', error);
          }
        );
      } catch (error) {
        console.error('Error loading browse requests:', error);
        toast.error('Failed to load help requests');
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        unsubscribeChannel(subscription);
      }
    };
  }, [selectedCategory, selectedUrgency, searchTerm]);
  
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

  // Format timestamp function
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || request.category === selectedCategory;
    const matchesUrgency = selectedUrgency === 'all' || request.urgency === selectedUrgency;
    
    return matchesSearch && matchesCategory && matchesUrgency;
  }).map(request => {
    // Transform the request data to include proper formatting
    const requesterName = request.name || 'Anonymous';
    const phone = request.phone || '';
    const location = request.full_location || request.city || 'Location not specified';
    
    return {
      ...request,
      requester: requesterName,
      // IMPORTANT: Keep amount_needed as the source of truth, only format for display
      amount: (request.amount_needed && request.amount_needed > 0) ? `₹${Math.round(request.amount_needed).toLocaleString()}` : null,
      amount_needed: request.amount_needed, // Preserve original numeric value
      location: location,
      contact: {
        phone: phone,
        email: ''
      },
      verified: false,
      timestamp: request.created_at ? formatTimestamp(request.created_at) : 'Recently posted',
      supporters: request.supporters || 0
    };
  });

  const handleConnect = (requestId: string) => {
    // Open detail dialog
    const request = filteredRequests.find(r => r.id === requestId);
    if (request) {
      setSelectedRequest(request);
      setShowDetailDialog(true);
    }
  };

  const handleOfferHelp = async () => {
    if (!selectedRequest) return;
    
    setIsOffering(true);
    
    try {
      // Create help offer using Supabase
      const response = await createHelpOffer({
        request_id: selectedRequest.id,
        requester_id: selectedRequest.user_id,
        message: '', // Can add a message field later
      });

      if (response.success) {
        // Store helper info to show contact card
        setHelperContactInfo({
          seekerName: selectedRequest.requester,
          seekerPhone: selectedRequest.contact.phone,
          seekerLocation: selectedRequest.location,
          requestTitle: selectedRequest.title
        });

        // Show success message
        toast.success(response.message || 'Help offer sent successfully!');
        
        // Close detail dialog and show contact card
        setShowDetailDialog(false);
        setShowContactCard(true);
      } else {
        // Show error message
        toast.error(response.error || 'Failed to send help offer');
      }
    } catch (error) {
      console.error('Error offering help:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsOffering(false);
    }
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
              {/* Info Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">Browse All Help Requests:</span> View requests from all users across India. Help requests you create will appear here for others to discover and support.
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-blue-700">
                      <span className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span><span>Critical</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span><span>High</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span><span>Medium</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span><span>Low</span>
                      </span>
                    </div>
                  </div>
                </div>
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
                      <label className="text-sm font-medium text-gray-700">Search Location</label>
                      <PlaceSearchInput
                        value={selectedLocation === 'all' ? '' : selectedLocation}
                        onChange={(location, coordinates) => {
                          setSelectedLocation(location || 'all');
                          
                          if (coordinates && location) {
                            setZoomStatus('attempting');
                            setMapLocationSelection(null);
                            
                            setTimeout(() => {
                              const newSelection = {
                                coordinates,
                                name: location
                              };
                              setMapLocationSelection(newSelection);
                              
                              setTimeout(() => {
                                setZoomStatus('success');
                                setTimeout(() => setZoomStatus('idle'), 2000);
                              }, 1000);
                            }, 50);
                          } else {
                            setZoomStatus('failed');
                            setTimeout(() => setZoomStatus('idle'), 2000);
                          }
                        }}
                        placeholder="Search location to zoom map..."
                        className="h-10 text-sm"
                      />
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
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-[#41695e] rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Loading help requests...</p>
            </div>
          </div>
        ) : filteredRequests.length > 0 ? (
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
                        <p className="text-gray-700">{request.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {request.amount && (
                            <div className="flex items-center space-x-1">
                              <IndianRupee className="h-4 w-4" />
                              <span>{request.amount}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{request.supporters} supporters</span>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <Button 
                            onClick={() => handleConnect(request.id)}
                            className="flex-1"
                            style={{ backgroundColor: '#41695e' }}
                          >
                            <Heart className="h-4 w-4 mr-2" />
                            Offer Help
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleConnect(request.id)}
                            className="flex-1"
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {viewMode === 'map' && (
              <div className="h-[600px] rounded-lg overflow-hidden shadow-lg">
                <MapView
                  requests={filteredRequests.map((req: any) => ({
                    id: req.id,
                    title: req.title,
                    description: req.description,
                    category: req.category,
                    urgency: req.urgency,
                    location: req.location,
                    coordinates: [req.latitude, req.longitude],
                    requester: req.requester,
                    contact: req.contact,
                    status: req.status,
                    amount: req.amount,
                    supporters: req.supporters,
                    timestamp: req.timestamp,
                    verified: req.verified || false
                  }))}
                  communities={[]}
                  onRequestClick={(request: MapRequest) => {
                    const fullRequest = filteredRequests.find(r => r.id === request.id);
                    if (fullRequest) {
                      setSelectedRequest(fullRequest);
                      setShowDetailDialog(true);
                    }
                  }}
                  onCommunityClick={(community: MapCommunity) => {}}
                  userLocation={userLocation}
                  highlightedLocation={mapLocationSelection}
                  urgencyFilter={urgencyFilter}
                  showCommunities={false}
                />
              </div>
            )}
          </div>
        ) : (
          <Card className="shadow-sm border-0">
            <CardContent className="py-16 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg mb-2" style={{ color: '#033b4a' }}>
                No requests found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search filters to find more help requests
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
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="w-full max-w-2xl">
            {selectedRequest && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <span>{selectedRequest.title}</span>
                    {selectedRequest.verified && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </DialogTitle>
                  <DialogDescription className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline">{selectedRequest.category}</Badge>
                    <Badge style={{ backgroundColor: getUrgencyColor(selectedRequest.urgency), color: 'white' }}>
                      {selectedRequest.urgency.charAt(0).toUpperCase() + selectedRequest.urgency.slice(1)}
                    </Badge>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div>
                    <h4 className="font-medium mb-2" style={{ color: '#033b4a' }}>Description</h4>
                    <p className="text-gray-700">{selectedRequest.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2 text-sm text-gray-600">Amount Needed</h4>
                      <p className="text-lg">{selectedRequest.amount || 'Not specified'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 text-sm text-gray-600">Supporters</h4>
                      <p className="text-lg">{selectedRequest.supporters} people</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 text-sm text-gray-600">Location</h4>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{selectedRequest.location}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 text-sm text-gray-600">Posted</h4>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{selectedRequest.timestamp}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleOfferHelp}
                      disabled={isOffering}
                      className="w-full max-[350px]:text-sm max-[350px]:py-2"
                      style={{ backgroundColor: '#41695e' }}
                    >
                      {isOffering ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <>
                          <Heart className="h-4 w-4 mr-2" />
                          Offer Help
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Contact Card Dialog */}
        <Dialog open={showContactCard} onOpenChange={setShowContactCard}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span>Help Offer Confirmed!</span>
              </DialogTitle>
              <DialogDescription>
                Thank you for offering to help. Here are the contact details:
              </DialogDescription>
            </DialogHeader>

            {helperContactInfo && (
              <div className="space-y-4 py-4">
                <Card className="border-0" style={{ backgroundColor: '#e8f5f0' }}>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Request</p>
                      <p className="font-medium">{helperContactInfo.requestTitle}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Requester Name</p>
                      <p className="font-medium">{helperContactInfo.seekerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <p className="font-medium">{helperContactInfo.seekerPhone}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <p className="font-medium">{helperContactInfo.seekerLocation}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Please contact the requester directly to coordinate your help. Keep all communication respectful and professional.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => setShowContactCard(false)}
                  className="w-full"
                  style={{ backgroundColor: '#41695e' }}
                >
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}