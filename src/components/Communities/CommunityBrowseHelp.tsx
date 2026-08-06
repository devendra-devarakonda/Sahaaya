import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { 
  Heart,
  Clock,
  MapPin,
  User,
  Phone,
  AlertCircle,
  Loader2,
  Search,
  CheckCircle
} from 'lucide-react';
import { 
  getCommunityHelpRequests, 
  createCommunityHelpOffer,
  subscribeToCommunityHelpRequests,
  unsubscribeChannel
} from '../../utils/supabaseService';

interface CommunityBrowseHelpProps {
  communityId: string;
  communityName: string;
  userProfile?: any;
}

export function CommunityBrowseHelp({ communityId, communityName, userProfile }: CommunityBrowseHelpProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isOffering, setIsOffering] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [helperContactInfo, setHelperContactInfo] = useState<any>(null);

  // Fetch help requests
  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      
      try {
        const response = await getCommunityHelpRequests(communityId);
        
        if (response.success && response.data) {
          setRequests(response.data);
        } else if (response.error) {
          toast.error(response.error);
        }
      } catch (error) {
        console.error('Error fetching community help requests:', error);
        toast.error('Failed to load help requests');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();

    // Set up real-time subscription
    const subscription = subscribeToCommunityHelpRequests(
      communityId,
      async (request, eventType) => {
        console.log('Real-time update:', eventType, request);
        
        if (eventType === 'INSERT') {
          // Refetch to get the complete data with joins
          const response = await getCommunityHelpRequests(communityId);
          if (response.success && response.data) {
            setRequests(response.data);
          }
        } else if (eventType === 'UPDATE') {
          setRequests(prev => prev.map(r => r.id === request.id ? { ...r, ...request } : r));
        } else if (eventType === 'DELETE') {
          setRequests(prev => prev.filter(r => r.id !== request.id));
        }
      },
      (error) => {
        console.error('Subscription error:', error);
      }
    );

    return () => {
      unsubscribeChannel(subscription);
    };
  }, [communityId]);

  const statusConfig = {
    pending: { color: 'bg-blue-100 text-blue-800', label: 'Pending' },
    matched: { color: 'bg-purple-100 text-purple-800', label: 'Matched' },
    in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
    completed: { color: 'bg-green-100 text-green-800', label: 'Completed' }
  };

  const urgencyConfig = {
    low: { color: 'bg-green-100 text-green-800', label: 'Low' },
    medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
    high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
    critical: { color: 'bg-red-100 text-red-800', label: 'Critical' }
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);
  };

  const handleOfferHelp = async () => {
    if (!selectedRequest) return;

    setIsOffering(true);

    try {
      const response = await createCommunityHelpOffer({
        help_request_id: selectedRequest.id,
        requester_id: selectedRequest.user_id,
        community_id: communityId,
        message: `I would like to help with "${selectedRequest.title}"`
      });

      if (response.success) {
        // Get requester info from user_profiles (not profiles)
        const requesterName = selectedRequest.user_profiles?.full_name || selectedRequest.user_profiles?.email || 'Anonymous';
        const requesterPhone = selectedRequest.user_profiles?.phone || 'Not provided';
        
        setHelperContactInfo({
          seekerName: requesterName,
          seekerPhone: requesterPhone,
          requestTitle: selectedRequest.title
        });

        setShowDetailDialog(false);
        setShowSuccessDialog(true);
        toast.success('Help offer sent successfully!');
      } else {
        toast.error(response.error || 'Failed to offer help');
      }
    } catch (error) {
      console.error('Error offering help:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsOffering(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-0">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 mx-auto animate-spin" style={{ color: '#41695e' }} />
          <p className="text-gray-600 mt-4">Loading help requests...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2" style={{ color: '#033b4a' }}>
            <Search className="h-5 w-5" style={{ color: '#41695e' }} />
            <span>Browse Help Requests</span>
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            View help requests from community members and offer assistance.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {requests.map((request) => {
                  const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
                  const urgency = urgencyConfig[request.urgency as keyof typeof urgencyConfig] || urgencyConfig.medium;
                  // Access user_profiles (not profiles) for requester info
                  const requesterName = request.user_profiles?.full_name || request.user_profiles?.email || 'Anonymous';
                  
                  return (
                    <div key={request.id} className="p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="mb-2 text-base sm:text-lg truncate" style={{ color: '#033b4a' }}>{request.title}</h4>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
                            <Badge className={`${status.color} text-xs`}>{status.label}</Badge>
                            <Badge className={`${urgency.color} text-xs`}>{urgency.label}</Badge>
                            <Badge variant="outline" className="text-xs">{request.category}</Badge>
                          </div>
                        </div>
                        {request.amount_needed && (
                          <div className="text-left sm:text-right flex-shrink-0">
                            <p className="font-medium text-base sm:text-lg" style={{ color: '#41695e' }}>
                              ₹{Math.round(request.amount_needed).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{request.description}</p>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate max-w-[100px] sm:max-w-none">{requesterName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">{new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="whitespace-nowrap">{request.supporters || 0}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(request)}
                          style={{ borderColor: '#41695e', color: '#41695e' }}
                          className="w-full sm:w-auto text-xs sm:text-sm"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 md:py-12">
                <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-base sm:text-lg mb-2" style={{ color: '#033b4a' }}>No Help Requests Yet</h3>
                <p className="text-sm sm:text-base text-gray-600 px-4">
                  No community members have posted help requests yet. Check back later or be the first to request help!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: '#033b4a' }}>Help Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl mb-2" style={{ color: '#033b4a' }}>{selectedRequest.title}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={statusConfig[selectedRequest.status as keyof typeof statusConfig]?.color || statusConfig.pending.color}>
                    {statusConfig[selectedRequest.status as keyof typeof statusConfig]?.label || 'Pending'}
                  </Badge>
                  <Badge className={urgencyConfig[selectedRequest.urgency as keyof typeof urgencyConfig]?.color || urgencyConfig.medium.color}>
                    {urgencyConfig[selectedRequest.urgency as keyof typeof urgencyConfig]?.label || 'Medium'}
                  </Badge>
                  <Badge variant="outline">{selectedRequest.category}</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2" style={{ color: '#033b4a' }}>Description</h4>
                <p className="text-gray-600">{selectedRequest.description}</p>
              </div>

              {selectedRequest.amount_needed && (
                <div>
                  <h4 className="font-medium mb-2" style={{ color: '#033b4a' }}>Amount Needed</h4>
                  <p className="text-2xl" style={{ color: '#41695e' }}>
                    ₹{Math.round(selectedRequest.amount_needed).toLocaleString()}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2" style={{ color: '#033b4a' }}>Posted By</h4>
                <div className="space-y-1 text-gray-600">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{selectedRequest.user_profiles?.full_name || selectedRequest.user_profiles?.email || 'Anonymous'}</span>
                  </div>
                  {selectedRequest.user_profiles?.email && selectedRequest.user_profiles?.full_name && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-500">Email:</span>
                      <span>{selectedRequest.user_profiles.email}</span>
                    </div>
                  )}
                  {selectedRequest.user_profiles?.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4" />
                      <span>{selectedRequest.user_profiles.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2" style={{ color: '#033b4a' }}>Posted On</h4>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(selectedRequest.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailDialog(false)}
                  className="max-[350px]:text-sm"
                >
                  Close
                </Button>
                <Button
                  onClick={handleOfferHelp}
                  disabled={isOffering}
                  style={{ backgroundColor: '#41695e' }}
                  className="max-[350px]:text-sm max-[350px]:py-2"
                >
                  {isOffering ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending Offer...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Offer Help
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center" style={{ color: '#033b4a' }}>
              Help Offer Sent Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: '#41695e' }}>
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-600">
              Your offer to help has been sent to the requester. They will be notified and can contact you.
            </p>
            {helperContactInfo && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-left">
                <h4 className="font-medium" style={{ color: '#033b4a' }}>Requester Contact Information</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{helperContactInfo.seekerName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{helperContactInfo.seekerPhone}</span>
                  </div>
                </div>
              </div>
            )}
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="w-full"
              style={{ backgroundColor: '#41695e' }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}