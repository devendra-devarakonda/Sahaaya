import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ArrowLeft,
  Filter,
  FileText,
  CheckCircle
} from 'lucide-react';
import { getMyRequests, unsubscribeChannel, subscribeToMyRequests } from '../utils/supabaseService';
import { CompleteHelpModal } from './CompleteHelpModal';

interface AllRequestsProps {
  setCurrentPage: (page: string) => void;
  userProfile?: any;
}

export function AllRequests({ setCurrentPage, userProfile }: AllRequestsProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [sourceFilter, setSourceFilter] = useState<'all' | 'global' | 'community'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'matched' | 'in_progress' | 'completed'>('all');
  const [currentPage, setCurrentPageNumber] = useState(1);
  const itemsPerPage = 10;

  // Complete help modal state
  const [selectedRequestForCompletion, setSelectedRequestForCompletion] = useState<any | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Handle request refresh after completion
  const handleRequestCompleted = async () => {
    // Reload all requests to get the updated status
    const response = await getMyRequests();
    if (response.success && response.data) {
      setRequests(response.data);
    }
  };

  // Load all requests
  useEffect(() => {
    let subscription: any = null;

    const loadRequests = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getMyRequests();
        
        if (response.success && response.data) {
          setRequests(response.data);
        } else if (response.error) {
          setError(response.error);
        }

        // Set up real-time subscription
        if (userProfile?.id) {
          subscription = subscribeToMyRequests(
            userProfile.id,
            async (updatedRequest, eventType) => {
              if (eventType === 'INSERT' || eventType === 'UPDATE') {
                setRequests(prev => {
                  const existingIndex = prev.findIndex(r => r.id === updatedRequest.id);
                  if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = updatedRequest;
                    return updated;
                  } else {
                    return [updatedRequest, ...prev];
                  }
                });
              } else if (eventType === 'DELETE') {
                setRequests(prev => prev.filter(r => r.id !== updatedRequest.id));
              }
            },
            (error) => console.error('Subscription error:', error)
          );
        }
      } catch (error) {
        console.error('Error loading requests:', error);
        setError('Failed to load requests');
      } finally {
        setIsLoading(false);
      }
    };

    loadRequests();

    return () => {
      if (subscription) {
        unsubscribeChannel(subscription);
      }
    };
  }, [userProfile?.id]);

  // Apply filters
  useEffect(() => {
    let filtered = [...requests];

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(r => r.source_type === sourceFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    setFilteredRequests(filtered);
    setCurrentPageNumber(1); // Reset to first page when filters change
  }, [requests, sourceFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusConfig = {
    pending: { color: 'bg-blue-100 text-blue-800', label: 'Pending' },
    matched: { color: 'bg-purple-100 text-purple-800', label: 'Matched' },
    in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
    completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
    critical: { color: 'bg-red-100 text-red-800', label: 'Critical' },
    medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
    low: { color: 'bg-green-100 text-green-800', label: 'Low' }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f9fefa' }}>\n        <Card className="max-w-md w-full text-center p-8 shadow-lg border-0">
          <CardContent className="space-y-6">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg" 
                 style={{ backgroundColor: '#41695e' }}>
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 style={{ color: '#033b4a' }}>Loading Requests</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f9fefa' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => setCurrentPage('dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 style={{ color: '#033b4a' }} className="mb-2">
            All My Help Requests
          </h1>
          <p className="text-lg text-gray-600">
            View and manage all your help requests from global and community platforms
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6 shadow-sm border-0">
          <CardHeader>
            <CardTitle style={{ color: '#033b4a' }} className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Source Filter */}
              <div>
                <label className="block text-sm mb-2" style={{ color: '#033b4a' }}>Source</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={sourceFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSourceFilter('all')}
                    style={sourceFilter === 'all' ? { backgroundColor: '#41695e' } : {}}
                  >
                    All
                  </Button>
                  <Button
                    variant={sourceFilter === 'global' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSourceFilter('global')}
                    style={sourceFilter === 'global' ? { backgroundColor: '#41695e' } : {}}
                  >
                    🌐 Global
                  </Button>
                  <Button
                    variant={sourceFilter === 'community' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSourceFilter('community')}
                    style={sourceFilter === 'community' ? { backgroundColor: '#41695e' } : {}}
                  >
                    🏘️ Community
                  </Button>
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm mb-2" style={{ color: '#033b4a' }}>Status</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                    style={statusFilter === 'all' ? { backgroundColor: '#41695e' } : {}}
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('pending')}
                    style={statusFilter === 'pending' ? { backgroundColor: '#41695e' } : {}}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={statusFilter === 'matched' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('matched')}
                    style={statusFilter === 'matched' ? { backgroundColor: '#41695e' } : {}}
                  >
                    Matched
                  </Button>
                  <Button
                    variant={statusFilter === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('completed')}
                    style={statusFilter === 'completed' ? { backgroundColor: '#41695e' } : {}}
                  >
                    Completed
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {paginatedRequests.length} of {filteredRequests.length} requests
        </div>

        {/* Requests List */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 mb-6">
            {error}
          </div>
        )}

        {paginatedRequests.length > 0 ? (
          <div className="grid gap-4 mb-8">
            {paginatedRequests.map((request: any) => (
              <Card key={request.id} className="shadow-sm border-0 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 style={{ color: '#033b4a' }} className="mb-2">{request.title}</h3>
                      <span className="text-xs text-gray-500 inline-block">
                        {request.source_type === 'community' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                            🏘️ {request.community_name || 'Community'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            🌐 Global
                          </span>
                        )}
                      </span>
                    </div>
                    <Badge className={statusConfig[request.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                      {statusConfig[request.status as keyof typeof statusConfig]?.label || request.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{request.description}</p>

                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <p style={{ color: '#033b4a' }}>₹{Math.round(request.amount_needed || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <p style={{ color: '#033b4a' }}>{request.category || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Urgency:</span>
                      <Badge className={statusConfig[request.urgency as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                        {request.urgency || 'medium'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-500">Posted:</span>
                      <p style={{ color: '#033b4a' }}>
                        {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">{request.supporters || 0} supporters</span>
                  </div>

                  {/* Complete Help Button - Only show for matched requests */}
                  {request.status === 'matched' && (
                    <div className="mt-4">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedRequestForCompletion(request);
                          setShowCompleteModal(true);
                        }}
                        className="text-white hover:opacity-90"
                        style={{ backgroundColor: '#41695e' }}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Complete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-sm border-0">
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 style={{ color: '#033b4a' }} className="mb-2">No requests found</h3>
              <p className="text-gray-600 mb-4">
                {sourceFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first request to get started'}
              </p>
              {sourceFilter === 'all' && statusFilter === 'all' && (
                <Button 
                  onClick={() => setCurrentPage('request-help')}
                  style={{ backgroundColor: '#41695e' }}
                >
                  Create Request
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPageNumber(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPageNumber(page)}
                  style={currentPage === page ? { backgroundColor: '#41695e' } : {}}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPageNumber(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Complete Help Modal */}
      {showCompleteModal && selectedRequestForCompletion && (
        <CompleteHelpModal
          isOpen={showCompleteModal}
          request={selectedRequestForCompletion}
          onClose={() => {
            setShowCompleteModal(false);
            setSelectedRequestForCompletion(null);
          }}
          onComplete={handleRequestCompleted}
        />
      )}
    </div>
  );
}