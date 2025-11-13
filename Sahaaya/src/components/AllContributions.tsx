import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ArrowLeft,
  Filter,
  Heart
} from 'lucide-react';
import { getMyContributions, unsubscribeChannel, subscribeToMyContributions } from '../utils/supabaseService';

interface AllContributionsProps {
  setCurrentPage: (page: string) => void;
  userProfile?: any;
}

export function AllContributions({ setCurrentPage, userProfile }: AllContributionsProps) {
  const [contributions, setContributions] = useState<any[]>([]);
  const [filteredContributions, setFilteredContributions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [sourceFilter, setSourceFilter] = useState<'all' | 'global' | 'community'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'rejected'>('all');
  const [currentPage, setCurrentPageNumber] = useState(1);
  const itemsPerPage = 10;

  // Load all contributions
  useEffect(() => {
    let subscription: any = null;

    const loadContributions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getMyContributions();
        
        if (response.success && response.data) {
          setContributions(response.data);
        } else if (response.error) {
          setError(response.error);
        }

        // Set up real-time subscription
        if (userProfile?.id) {
          subscription = subscribeToMyContributions(
            userProfile.id,
            async (updatedContribution, eventType) => {
              // Refetch all contributions to get the joined help_requests data
              const response = await getMyContributions();
              if (response.success && response.data) {
                setContributions(response.data);
              }
            },
            (error) => console.error('Subscription error:', error)
          );
        }
      } catch (error) {
        console.error('Error loading contributions:', error);
        setError('Failed to load contributions');
      } finally {
        setIsLoading(false);
      }
    };

    loadContributions();

    return () => {
      if (subscription) {
        unsubscribeChannel(subscription);
      }
    };
  }, [userProfile?.id]);

  // Apply filters
  useEffect(() => {
    let filtered = [...contributions];

    if (sourceFilter !== 'all') {
      filtered = filtered.filter(c => c.source_type === sourceFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    setFilteredContributions(filtered);
    setCurrentPageNumber(1); // Reset to first page when filters change
  }, [contributions, sourceFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredContributions.length / itemsPerPage);
  const paginatedContributions = filteredContributions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusConfig = {
    pending: { color: 'bg-blue-100 text-blue-800', label: 'Pending' },
    accepted: { color: 'bg-green-100 text-green-800', label: 'Accepted' },
    completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
    rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f9fefa' }}>
        <Card className="max-w-md w-full text-center p-8 shadow-lg border-0">
          <CardContent className="space-y-6">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg" 
                 style={{ backgroundColor: '#41695e' }}>
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 style={{ color: '#033b4a' }}>Loading Contributions</h2>
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
            All My Contributions
          </h1>
          <p className="text-lg text-gray-600">
            View and manage all your help offers from global and community platforms
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
                    variant={statusFilter === 'accepted' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('accepted')}
                    style={statusFilter === 'accepted' ? { backgroundColor: '#41695e' } : {}}
                  >
                    Accepted
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
          Showing {paginatedContributions.length} of {filteredContributions.length} contributions
        </div>

        {/* Contributions List */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 mb-6">
            {error}
          </div>
        )}

        {paginatedContributions.length > 0 ? (
          <div className="grid gap-4 mb-8">
            {paginatedContributions.map((contribution: any) => {
              return (
                <Card key={contribution.id} className="shadow-sm border-0 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 style={{ color: '#033b4a' }} className="mb-2">{contribution.request_title || 'Contribution'}</h3>
                        <span className="text-xs text-gray-500 inline-block">
                          {contribution.source_type === 'community' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                              🏘️ {contribution.community_name || 'Community'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              🌐 Global
                            </span>
                          )}
                        </span>
                      </div>
                      <Badge className={statusConfig[contribution.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                        {statusConfig[contribution.status as keyof typeof statusConfig]?.label || contribution.status}
                      </Badge>
                    </div>

                    {contribution.message && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4" style={{ borderLeftColor: '#41695e' }}>
                        <p className="text-sm text-gray-700 italic">&quot;{contribution.message}&quot;</p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <p style={{ color: '#033b4a' }}>{contribution.category || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <p style={{ color: '#033b4a' }}>₹{Math.round(contribution.amount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Urgency:</span>
                        <p style={{ color: '#033b4a' }}>{contribution.urgency || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Offered on:</span>
                        <p style={{ color: '#033b4a' }}>
                          {contribution.created_at ? new Date(contribution.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {(contribution.requester_name || contribution.requester_city || contribution.requester_phone) && (
                      <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
                        {contribution.requester_name && <div>Contact: {contribution.requester_name}</div>}
                        {contribution.requester_city && contribution.requester_state && <div>Location: {contribution.requester_city}, {contribution.requester_state}</div>}
                        {contribution.requester_phone && <div>Phone: {contribution.requester_phone}</div>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="shadow-sm border-0">
            <CardContent className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 style={{ color: '#033b4a' }} className="mb-2">No contributions found</h3>
              <p className="text-gray-600 mb-4">
                {sourceFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Browse requests to start helping others'}
              </p>
              {sourceFilter === 'all' && statusFilter === 'all' && (
                <Button 
                  onClick={() => setCurrentPage('matching')}
                  style={{ backgroundColor: '#41695e' }}
                >
                  Browse Requests
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
    </div>
  );
}
