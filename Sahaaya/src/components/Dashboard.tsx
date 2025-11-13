import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { 
  Heart,
  Users, 
  Building2,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MapPin,
  Phone,
  Calendar,
  BarChart3,
  IndianRupee,
  Target,
  Award,
  Activity,
  HandHeart,
  Search,
  Bell
} from 'lucide-react';
import { 
  getMyRequests, 
  subscribeToMyRequests, 
  getMyContributions,
  subscribeToMyContributions,
  getRequestsByStatus,
  unsubscribeChannel 
} from '../utils/supabaseService';
import { supabase } from '../utils/auth';
import { CompleteHelpModal } from './CompleteHelpModal';

interface DashboardProps {
  userRole: 'individual' | 'ngo' | null;
  setCurrentPage: (page: string) => void;
  userProfile?: any;
  setUserRole: (role: 'individual' | 'ngo') => void;
}

export function Dashboard({ userRole, setCurrentPage, userProfile }: DashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [myContributions, setMyContributions] = useState<any[]>([]);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [contributionsError, setContributionsError] = useState<string | null>(null);
  
  // Dynamic counts from Supabase
  const [totalRequestsCount, setTotalRequestsCount] = useState<number>(0);
  const [totalContributionsCount, setTotalContributionsCount] = useState<number>(0);
  
  // Status tracking state
  const [activeStatusTab, setActiveStatusTab] = useState<'pending' | 'matched' | 'completed'>('pending');
  const [selectedRequestForCompletion, setSelectedRequestForCompletion] = useState<any | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Handle request completion refresh
  const handleRequestCompleted = async () => {
    // Reload requests to get updated status
    const response = await getMyRequests();
    if (response.success && response.data) {
      setMyRequests(response.data.slice(0, 2));
      setTotalRequestsCount(response.data.length);
    }
  };

  // Static mock data
  const getMockData = (role: 'individual' | 'ngo') => ({
    individual: {
      stats: {
        totalRequests: 3,
        activeRequests: 1,
        completedRequests: 2,
        totalHelped: 8,
        totalDonated: 15000,
        amountReceived: 25000,
        impactScore: 450
      },
      myRequests: [
        {
          id: 'HR-001',
          title: 'Medical assistance for surgery',
          status: 'matched',
          responses: 8,
          amount: 25000,
          postedDate: '2024-01-15',
          urgency: 'critical'
        },
        {
          id: 'HR-002',
          title: 'Educational support for children',
          status: 'pending',
          responses: 3,
          amount: 15000,
          postedDate: '2024-01-20',
          urgency: 'medium'
        }
      ],
      myContributions: [
        {
          id: 'HR-003',
          title: 'Food supplies for flood victims',
          amount: 5000,
          status: 'completed',
          recipient: 'Helping Hands NGO',
          date: '2024-01-18'
        },
        {
          id: 'HR-004',
          title: 'Medical assistance for elderly',
          amount: 10000,
          status: 'in_progress',
          recipient: 'Priya Sharma',
          date: '2024-01-22'
        }
      ]
    },
    ngo: {
      stats: {
        totalCampaigns: 156,
        activeCampaigns: 23,
        completedCampaigns: 98,
        totalBeneficiaries: 5420,
        fundsRaised: 2500000,
        partneredDonors: 342,
        impactScore: 1850
      },
      activeCampaigns: [
        {
          id: 'NG-005',
          title: 'Emergency relief for flood victims',
          status: 'active',
          donors: 12,
          target: 500000,
          raised: 325000,
          deadline: '2024-02-15',
          beneficiaries: 200
        },
        {
          id: 'NG-006',
          title: 'Educational support program',
          status: 'active',
          donors: 25,
          target: 200000,
          raised: 180000,
          deadline: '2024-02-28',
          beneficiaries: 150
        }
      ],
      recentDonations: [
        {
          id: 'DN-001',
          donorName: 'Anonymous',
          amount: 25000,
          campaign: 'Emergency relief for flood victims',
          date: '2024-01-22'
        },
        {
          id: 'DN-002', 
          donorName: 'Rahul Sharma',
          amount: 10000,
          campaign: 'Educational support program',
          date: '2024-01-21'
        }
      ]
    }
  });

  // Load data from Supabase with real-time subscriptions
  useEffect(() => {
    let subscription: any = null;
    let contributionsSubscription: any = null;

    const loadData = async () => {
      setIsLoading(true);
      setRequestsError(null);
      setContributionsError(null);

      try {
        // Load requests from Supabase for individual users
        if (userRole === 'individual' && userProfile?.id) {
          const response = await getMyRequests();
          
          if (response.success && response.data) {
            // Limit to 2 most recent for dashboard preview
            setMyRequests(response.data.slice(0, 2));
            // Set total count from all data
            setTotalRequestsCount(response.data.length);
          } else if (response.error) {
            setRequestsError(response.error);
          }

          // Set up real-time subscription for updates
          subscription = subscribeToMyRequests(
            userProfile.id,
            async (updatedRequest, eventType) => {
              console.log('Real-time update:', eventType, updatedRequest);
              
              if (eventType === 'INSERT' || eventType === 'UPDATE') {
                // Refetch to get accurate count
                const response = await getMyRequests();
                if (response.success && response.data) {
                  setMyRequests(response.data.slice(0, 2));
                  setTotalRequestsCount(response.data.length);
                }
              } else if (eventType === 'DELETE') {
                // Refetch to get accurate count
                const response = await getMyRequests();
                if (response.success && response.data) {
                  setMyRequests(response.data.slice(0, 2));
                  setTotalRequestsCount(response.data.length);
                }
              }
            },
            (error) => {
              console.error('Subscription error:', error);
            }
          );
        }

        // Load contributions from Supabase for individual users
        if (userRole === 'individual' && userProfile?.id) {
          const response = await getMyContributions();
          
          if (response.success && response.data) {
            // Limit to 2 most recent for dashboard preview
            setMyContributions(response.data.slice(0, 2));
            setTotalContributionsCount(response.data.length);
          } else if (response.error) {
            setContributionsError(response.error);
          }

          // Set up real-time subscription for updates
          contributionsSubscription = subscribeToMyContributions(
            userProfile.id,
            async (updatedContribution, eventType) => {
              console.log('Real-time contribution update:', eventType, updatedContribution);
              
              if (eventType === 'INSERT') {
                // Refetch all contributions to get the joined help_requests data
                const response = await getMyContributions();
                if (response.success && response.data) {
                  setMyContributions(response.data);
                  setTotalContributionsCount(response.data.length);
                }
              } else if (eventType === 'UPDATE') {
                // For updates, also refetch to ensure we have the latest data
                const response = await getMyContributions();
                if (response.success && response.data) {
                  setMyContributions(response.data);
                  setTotalContributionsCount(response.data.length);
                }
              } else if (eventType === 'DELETE') {
                setMyContributions(prev => prev.filter(r => r.id !== updatedContribution.id));
              }
            },
            (error) => {
              console.error('Contributions subscription error:', error);
            }
          );
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setRequestsError('Failed to load data');
        setContributionsError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        unsubscribeChannel(subscription);
      }
      if (contributionsSubscription) {
        unsubscribeChannel(contributionsSubscription);
      }
    };
  }, [userRole, userProfile?.id]);

  const statusConfig = {
    pending: { color: 'bg-blue-100 text-blue-800', label: 'Pending' },
    matched: { color: 'bg-purple-100 text-purple-800', label: 'Matched' },
    in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
    completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
    active: { color: 'bg-blue-100 text-blue-800', label: 'Active' },
    critical: { color: 'bg-red-100 text-red-800', label: 'Critical' },
    medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
    low: { color: 'bg-green-100 text-green-800', label: 'Low' }
  };

  const getRoleIcon = () => {
    const role = userRole || 'individual';
    switch (role) {
      case 'individual': return <Users className="h-5 w-5 text-white" />;
      case 'ngo': return <Building2 className="h-5 w-5 text-white" />;
      default: return <Activity className="h-5 w-5 text-white" />;
    }
  };

  const getRoleTitle = () => {
    const role = userRole || 'individual';
    switch (role) {
      case 'individual': return 'Individual User Dashboard';
      case 'ngo': return 'NGO Organization Dashboard';
      default: return 'Dashboard';
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f9fefa' }}>
        <Card className="max-w-md w-full text-center p-8 shadow-lg border-0">
          <CardContent className="space-y-6">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg" 
                 style={{ backgroundColor: '#41695e' }}>
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 style={{ color: '#033b4a' }}>Loading Dashboard</h2>
            <p className="text-gray-600">
              Please wait while we load your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get static data based on role
  const effectiveRole: 'individual' | 'ngo' = userRole || 'individual';
  const mockData = getMockData(effectiveRole);
  const data = mockData[effectiveRole];

  // Ensure data has the required structure with safe access
  // For individual users, use real data from Supabase for myRequests and myContributions
  const safeData = {
    stats: effectiveRole === 'individual' ? {
      ...data?.stats,
      totalRequests: myRequests.length,
      activeRequests: myRequests.filter(r => r.status === 'pending' || r.status === 'matched').length,
      completedRequests: myRequests.filter(r => r.status === 'completed').length,
      totalHelped: myContributions.filter(c => c.status === 'completed').length,
    } : data?.stats || mockData[effectiveRole].stats,
    myRequests: effectiveRole === 'individual' ? myRequests : (data?.myRequests || []),
    myContributions: effectiveRole === 'individual' ? myContributions : (data?.myContributions || []),
    activeCampaigns: data?.activeCampaigns || [],
    recentDonations: data?.recentDonations || []
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f9fefa' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#41695e' }}>
              {getRoleIcon()}
            </div>
            <div>
              <h1 style={{ color: '#033b4a' }}>
                {getRoleTitle()}
              </h1>
              {userProfile && (
                <p className="text-sm text-gray-500">Welcome back, {userProfile.name}!</p>
              )}
            </div>
          </div>
          <p className="text-lg text-gray-600">
            {effectiveRole === 'individual' 
              ? 'Manage your help requests and track your contributions to the Sahaaya community'
              : 'Manage your NGO campaigns, track donations, and monitor your social impact'
            }
          </p>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 shadow-sm border-0">
          <CardHeader>
            <CardTitle style={{ color: '#033b4a' }}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {effectiveRole === 'individual' ? (
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border" 
                      style={{ borderColor: '#41695e' }}
                      onClick={() => setCurrentPage('request-help')}>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" 
                         style={{ backgroundColor: '#e8f5f0' }}>
                      <HandHeart className="h-6 w-6" style={{ color: '#41695e' }} />
                    </div>
                    <h3 style={{ color: '#033b4a' }}>Request Help</h3>
                    <p className="text-sm text-gray-600">Submit a new request for assistance from the community</p>
                    <Button className="w-full" style={{ backgroundColor: '#41695e' }}>
                      Create Request
                    </Button>
                  </div>
                </Card>
                
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border" 
                      style={{ borderColor: '#41695e' }}
                      onClick={() => setCurrentPage('matching')}>
                  <div className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center" 
                         style={{ backgroundColor: '#e8f5f0' }}>
                      <Heart className="h-6 w-6" style={{ color: '#41695e' }} />
                    </div>
                    <h3 style={{ color: '#033b4a' }}>Offer Help</h3>
                    <p className="text-sm text-gray-600">Browse requests and offer assistance to others</p>
                    <Button variant="outline" className="w-full" style={{ borderColor: '#41695e', color: '#41695e' }}>
                      Browse Requests
                    </Button>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={() => setCurrentPage('create-campaign')}
                  className="flex items-center space-x-2"
                  style={{ backgroundColor: '#41695e' }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Campaign</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setCurrentPage('matching')}
                  className="flex items-center space-x-2"
                >
                  <Search className="h-4 w-4" />
                  <span>Browse Requests</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>View Analytics</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Manage Beneficiaries</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {effectiveRole === 'individual' && (
            <>
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">My Requests</p>
                      <p style={{ color: '#033b4a' }}>{totalRequestsCount}</p>
                    </div>
                    <FileText className="h-8 w-8" style={{ color: '#41695e' }} />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">My Contributions</p>
                      <p style={{ color: '#033b4a' }}>{totalContributionsCount}</p>
                    </div>
                    <Heart className="h-8 w-8" style={{ color: '#41695e' }} />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {effectiveRole === 'ngo' && (
            <>
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Campaigns</p>
                      <p style={{ color: '#033b4a' }}>{safeData.activeCampaigns.length}</p>
                    </div>
                    <Building2 className="h-8 w-8" style={{ color: '#41695e' }} />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Recent Donations</p>
                      <p style={{ color: '#033b4a' }}>{safeData.recentDonations.length}</p>
                    </div>
                    <Heart className="h-8 w-8" style={{ color: '#41695e' }} />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Content Sections */}
        <div className="grid lg:grid-cols-2 gap-8">
          {effectiveRole === 'individual' && (
            <>
              {/* My Requests */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle style={{ color: '#033b4a' }}>My Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {requestsError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                      {requestsError}
                    </div>
                  )}
                  {safeData.myRequests.length > 0 ? (
                    safeData.myRequests.map((request: any) => (
                      <div key={request.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 style={{ color: '#033b4a' }}>{request.title}</h4>
                            {/* Source badge: Global vs Community */}
                            <span className="text-xs text-gray-500 mt-1 inline-block">
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
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>₹{Math.round(request.amount || 0).toLocaleString()}</span>
                          <span>{request.supporters || 0} supporters</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            Posted: {request.created_at ? new Date(request.created_at).toLocaleDateString() : request.postedDate || 'N/A'}
                          </span>
                          <Badge className={statusConfig[request.urgency as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                            {request.urgency || 'medium'}
                          </Badge>
                        </div>
                        {/* Complete Help Button for matched requests */}
                        {request.status === 'matched' && (
                          <div className="mt-3">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSelectedRequestForCompletion(request);
                                setShowCompleteModal(true);
                              }}
                              className="w-full text-white hover:opacity-90"
                              style={{ backgroundColor: '#41695e' }}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Complete
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No requests yet. Create your first request to get started.</p>
                      <Button 
                        onClick={() => setCurrentPage('request-help')}
                        className="mt-4"
                        style={{ backgroundColor: '#41695e' }}
                      >
                        Create Request
                      </Button>
                    </div>
                  )}
                  {/* Show All Button */}
                  {safeData.myRequests.length > 0 && (
                    <div className="text-center pt-2">
                      <button
                        className="text-sm hover:underline transition-all"
                        style={{ color: '#41695e' }}
                        onClick={() => setCurrentPage('all-requests')}
                      >
                        Show All Requests →
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* My Contributions */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle style={{ color: '#033b4a' }}>My Contributions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contributionsError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                      {contributionsError}
                    </div>
                  )}
                  {safeData.myContributions.length > 0 ? (
                    safeData.myContributions.map((contribution: any) => {
                      return (
                        <div key={contribution.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 style={{ color: '#033b4a' }}>{contribution.request_title || 'Contribution'}</h4>
                              {/* Source badge: Global vs Community */}
                              <span className="text-xs text-gray-500 mt-1 inline-block">
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
                          <div className="text-sm text-gray-600">
                            <span className="block">Category: {contribution.category || 'N/A'}</span>
                            <span className="block">Amount: ₹{Math.round(contribution.amount || 0).toLocaleString()}</span>
                            {contribution.requester_name && <span className="block">To: {contribution.requester_name}</span>}
                            {contribution.requester_city && contribution.requester_state && (
                              <span className="block">Location: {contribution.requester_city}, {contribution.requester_state}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Offered on: {contribution.created_at ? new Date(contribution.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                          {contribution.message && (
                            <div className="text-xs text-gray-600 italic border-l-2 border-gray-300 pl-2">
                              &quot;{contribution.message}&quot;
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Heart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No contributions yet. Browse requests to help others.</p>
                      <Button 
                        onClick={() => setCurrentPage('matching')}
                        variant="outline"
                        className="mt-4"
                        style={{ borderColor: '#41695e', color: '#41695e' }}
                      >
                        Browse Requests
                      </Button>
                    </div>
                  )}
                  {/* Show All Button */}
                  {safeData.myContributions.length > 0 && (
                    <div className="text-center pt-2">
                      <button
                        className="text-sm hover:underline transition-all"
                        style={{ color: '#41695e' }}
                        onClick={() => setCurrentPage('all-contributions')}
                      >
                        Show All Contributions →
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {effectiveRole === 'ngo' && (
            <>
              {/* Active Campaigns */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle style={{ color: '#033b4a' }}>Active Campaigns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {safeData.activeCampaigns.length > 0 ? (
                    safeData.activeCampaigns.map((campaign: any) => (
                      <div key={campaign.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 style={{ color: '#033b4a' }}>{campaign.title}</h4>
                          <Badge className={statusConfig[campaign.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                            {statusConfig[campaign.status as keyof typeof statusConfig]?.label || campaign.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Progress: ₹{(campaign.raised || campaign.raisedAmount || 0).toLocaleString()} / ₹{(campaign.target || campaign.targetAmount || 0).toLocaleString()}</span>
                            <span>{campaign.donors || 0} donors</span>
                          </div>
                          <Progress value={((campaign.raised || campaign.raisedAmount || 0) / (campaign.target || campaign.targetAmount || 1)) * 100} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Deadline: {campaign.deadline || 'N/A'}</span>
                            <span>{campaign.beneficiaries || 0} beneficiaries</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No campaigns yet. Create your first campaign to get started.</p>
                    </div>
                  )}
                  <div className="text-center">
                    <Button 
                      onClick={() => setCurrentPage('create-campaign')}
                      className="w-full"
                      style={{ backgroundColor: '#41695e' }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Campaign
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Donations */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle style={{ color: '#033b4a' }}>Recent Donations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {safeData.recentDonations.length > 0 ? (
                    safeData.recentDonations.map((donation: any) => (
                      <div key={donation.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 style={{ color: '#033b4a' }}>₹{donation.amount?.toLocaleString() || '0'}</h4>
                            <p className="text-sm text-gray-600">from {donation.donorName || 'Anonymous'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{donation.createdAt ? new Date(donation.createdAt).toLocaleDateString() : donation.date || 'N/A'}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          For: {donation.campaign || donation.targetId || 'Campaign'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Heart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No donations yet. Share your campaigns to receive donations.</p>
                    </div>
                  )}
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline"
                      className="w-full"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View All Donations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
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