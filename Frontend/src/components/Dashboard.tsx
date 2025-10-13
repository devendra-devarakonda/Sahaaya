import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
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
import { helpRequestsApi, campaignsApi, contributionsApi, analyticsApi, healthApi } from '../utils/api';
import { RoleValidationError, getRoleErrorMessage } from '../utils/roleValidation';

interface DashboardProps {
  userRole: 'individual' | 'ngo' | null;
  setCurrentPage: (page: string) => void;
  userProfile?: any;
  setUserRole: (role: 'individual' | 'ngo') => void;
}

export function Dashboard({ userRole, setCurrentPage, userProfile }: DashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fallback mock data for when API fails
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

  // Fetch role-based dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Validate user role and profile first
      if (!userRole) {
        console.log('No userRole provided, using mock data');
        setDashboardData(getMockData('individual').individual);
        setIsLoading(false);
        return;
      }

      if (!userProfile) {
        console.log('No userProfile provided, using mock data');
        setDashboardData(getMockData(userRole)[userRole]);
        setIsLoading(false);
        return;
      }

      // Ensure we only proceed with valid roles
      if (userRole !== 'individual' && userRole !== 'ngo') {
        console.error('Invalid user role:', userRole);
        setError('Invalid user role detected. Please log in again.');
        setDashboardData(getMockData('individual').individual);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('Fetching dashboard data for role:', userRole, 'User ID:', userProfile.id);

        // First, test server connectivity
        try {
          console.log('Testing server connectivity...');
          const healthCheck = await healthApi.check();
          console.log('Server health check successful:', healthCheck);
        } catch (healthError) {
          console.error('Server health check failed:', healthError);
          
          // Provide more specific error messages based on the error type
          let errorMessage = 'Server temporarily unavailable. Showing demo data.';
          
          if (healthError instanceof Error) {
            if (healthError.message.includes('authentication')) {
              errorMessage = 'Server authentication issue detected. Using demo data for now.';
              console.warn('The Edge Function may require authentication setup or deployment');
            } else if (healthError.message === 'Failed to fetch') {
              errorMessage = 'Server connection failed. Please check your internet connection or try again later.';
              console.warn('The Edge Function may not be deployed or accessible');
            }
          }
          
          console.warn('Server is not accessible, falling back to mock data');
          setError(errorMessage);
          
          // Fallback to mock data when server is not accessible
          const mockData = getMockData(userRole);
          setDashboardData(mockData[userRole]);
          setIsLoading(false);
          return;
        }

        if (userRole === 'individual') {
          // Only call Individual APIs
          const [statsResponse, requestsResponse, contributionsResponse] = await Promise.all([
            analyticsApi.getIndividualStats().catch(err => {
              console.error('Individual stats API error:', err);
              return { stats: getMockData('individual').individual.stats };
            }),
            helpRequestsApi.getMyRequests().catch(err => {
              console.error('My requests API error:', err);
              return { requests: getMockData('individual').individual.myRequests };
            }),
            contributionsApi.getMyContributions().catch(err => {
              console.error('My contributions API error:', err);
              return { contributions: getMockData('individual').individual.myContributions };
            })
          ]);

          setDashboardData({
            stats: statsResponse.stats || getMockData('individual').individual.stats,
            myRequests: requestsResponse.requests || [],
            myContributions: contributionsResponse.contributions || []
          });

        } else if (userRole === 'ngo') {
          // Only call NGO APIs
          const [statsResponse, campaignsResponse, donationsResponse] = await Promise.all([
            analyticsApi.getNGOStats().catch(err => {
              console.error('NGO stats API error:', err);
              return { stats: getMockData('ngo').ngo.stats };
            }),
            campaignsApi.getMyCampaigns().catch(err => {
              console.error('My campaigns API error:', err);
              return { campaigns: getMockData('ngo').ngo.activeCampaigns };
            }),
            contributionsApi.getMyContributions().catch(err => {
              console.error('NGO donations API error:', err);
              return { contributions: getMockData('ngo').ngo.recentDonations };
            })
          ]);

          setDashboardData({
            stats: statsResponse.stats || getMockData('ngo').ngo.stats,
            activeCampaigns: campaignsResponse.campaigns || [],
            recentDonations: donationsResponse.contributions || []
          });
        }

      } catch (error) {
        console.error('Dashboard fetch error:', error);
        setError('Unable to load dashboard data. Using sample data.');
        
        // Fallback to mock data based on role
        const mockData = getMockData(userRole);
        setDashboardData(mockData[userRole]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [userRole, userProfile]);

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
    switch (userRole) {
      case 'individual': return <Users className="h-5 w-5 text-white" />;
      case 'ngo': return <Building2 className="h-5 w-5 text-white" />;
      default: return <Activity className="h-5 w-5 text-white" />;
    }
  };

  const getRoleTitle = () => {
    switch (userRole) {
      case 'individual': return 'Individual User Dashboard';
      case 'ngo': return 'NGO Organization Dashboard';
      default: return 'Dashboard';
    }
  };

  if (!userRole || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f9fefa' }}>
        <Card className="max-w-md w-full text-center p-8 shadow-lg border-0">
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg" 
                   style={{ backgroundColor: '#41695e' }}>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <Users className="h-16 w-16 mx-auto text-gray-400" />
            )}
            <h2 style={{ color: '#033b4a' }}>Welcome to Sahaaya</h2>
            <p className="text-gray-600">
              {isLoading ? 'Loading your dashboard...' : 'Setting up your dashboard...'}
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use real data if available, otherwise fallback to mock data
  const data = dashboardData || getMockData(userRole)[userRole];

  // Ensure data has the required structure with safe access
  const safeData = {
    stats: data?.stats || getMockData(userRole)[userRole].stats,
    myRequests: data?.myRequests || [],
    myContributions: data?.myContributions || [],
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
            {userRole === 'individual' 
              ? 'Manage your help requests and track your contributions to the Sahaaya community'
              : userRole === 'ngo'
              ? 'Manage your NGO campaigns, track donations, and monitor your social impact'
              : 'Welcome to your Sahaaya dashboard'
            }
          </p>
        </div>

        {/* Error message if API calls failed */}
        {error && (
          <div className={`border rounded-lg p-4 mb-6 ${
            error.includes('only available for') 
              ? 'bg-red-50 border-red-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start space-x-3">
              <AlertCircle className={`h-5 w-5 mt-0.5 ${
                error.includes('only available for') 
                  ? 'text-red-500' 
                  : 'text-yellow-500'
              }`} />
              <div>
                <p className={`font-medium text-sm ${
                  error.includes('only available for') 
                    ? 'text-red-800' 
                    : 'text-yellow-800'
                }`}>
                  {error.includes('only available for') 
                    ? 'Access Restriction' 
                    : 'Data Loading Issue'
                  }
                </p>
                <p className={`text-sm mt-1 ${
                  error.includes('only available for') 
                    ? 'text-red-700' 
                    : 'text-yellow-700'
                }`}>
                  {error}
                </p>
                {error.includes('only available for') && (
                  <p className="text-xs mt-2 text-red-600">
                    Current role: <strong>{userRole === 'individual' ? 'Individual User' : 'NGO'}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <Card className="mb-8 shadow-sm border-0">
          <CardHeader>
            <CardTitle style={{ color: '#033b4a' }}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {userRole === 'individual' ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {userRole === 'individual' && (
            <>
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">My Requests</p>
                      <p style={{ color: '#033b4a' }}>{safeData.stats.totalRequests}</p>
                    </div>
                    <FileText className="h-8 w-8" style={{ color: '#41695e' }} />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">People Helped</p>
                      <p style={{ color: '#033b4a' }}>{safeData.stats.totalHelped}</p>
                    </div>
                    <Users className="h-8 w-8" style={{ color: '#41695e' }} />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Donated</p>
                      <p style={{ color: '#033b4a' }}>₹{safeData.stats.totalDonated?.toLocaleString() || '0'}</p>
                    </div>
                    <IndianRupee className="h-8 w-8" style={{ color: '#41695e' }} />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Amount Received</p>
                      <p style={{ color: '#033b4a' }}>₹{safeData.stats.amountReceived?.toLocaleString() || '0'}</p>
                    </div>
                    <Heart className="h-8 w-8" style={{ color: '#41695e' }} />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {userRole === 'ngo' && (
            <>
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Campaigns</p>
                      <p style={{ color: '#033b4a' }}>{safeData.stats.activeCampaigns}</p>
                    </div>
                    <Activity className="h-8 w-8" style={{ color: '#41695e' }} />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Beneficiaries</p>
                      <p style={{ color: '#033b4a' }}>{safeData.stats.totalBeneficiaries?.toLocaleString() || '0'}</p>
                    </div>
                    <Users className="h-8 w-8" style={{ color: '#41695e' }} />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Funds Raised</p>
                      <p style={{ color: '#033b4a' }}>₹{((safeData.stats.fundsRaised || 0) / 100000).toFixed(1)}L</p>
                    </div>
                    <IndianRupee className="h-8 w-8" style={{ color: '#41695e' }} />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Partner Donors</p>
                      <p style={{ color: '#033b4a' }}>{safeData.stats.partneredDonors || 0}</p>
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
          {userRole === 'individual' && (
            <>
              {/* My Requests */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle style={{ color: '#033b4a' }}>My Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {safeData.myRequests.length > 0 ? (
                    safeData.myRequests.map((request: any) => (
                      <div key={request.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 style={{ color: '#033b4a' }}>{request.title}</h4>
                          <Badge className={statusConfig[request.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                            {statusConfig[request.status as keyof typeof statusConfig]?.label || request.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>₹{request.amount?.toLocaleString() || '0'}</span>
                          <span>{request.responses || 0} responses</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            Posted: {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : request.postedDate || 'N/A'}
                          </span>
                          <Badge className={statusConfig[request.urgency as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                            {request.urgency || 'medium'}
                          </Badge>
                        </div>
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
                </CardContent>
              </Card>

              {/* My Contributions */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle style={{ color: '#033b4a' }}>My Contributions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {safeData.myContributions.length > 0 ? (
                    safeData.myContributions.map((contribution: any) => (
                      <div key={contribution.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 style={{ color: '#033b4a' }}>{contribution.title || 'Contribution'}</h4>
                          <Badge className={statusConfig[contribution.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                            {statusConfig[contribution.status as keyof typeof statusConfig]?.label || contribution.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>₹{contribution.amount?.toLocaleString() || '0'}</span>
                          <span>to {contribution.recipient || 'Unknown'}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Date: {contribution.createdAt ? new Date(contribution.createdAt).toLocaleDateString() : contribution.date || 'N/A'}
                        </div>
                      </div>
                    ))
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
                </CardContent>
              </Card>
            </>
          )}

          {userRole === 'ngo' && (
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
    </div>
  );
}