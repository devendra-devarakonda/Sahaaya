import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner@2.0.3';
import { 
  ArrowLeft,
  Users,
  MapPin,
  Calendar,
  Shield,
  Star,
  Loader2,
  UserPlus,
  Heart,
  Stethoscope,
  GraduationCap,
  Wallet,
  Building2,
  UtensilsCrossed,
  Home,
  AlertCircle,
  CheckCircle,
  HandHeart,
  Search
} from 'lucide-react';
import {
  getCommunityById,
  getCommunityMembers,
  joinCommunity,
  leaveCommunity,
  isUserMemberOfCommunity,
  subscribeToCommunityMembers,
  unsubscribeChannel
} from '../../utils/supabaseService';
import { CommunityHelpRequestForm } from './CommunityHelpRequestForm';
import { CommunityBrowseHelp } from './CommunityBrowseHelp';
import { CommunityActivity } from './CommunityActivity';

interface CommunityDetailsProps {
  communityId: string;
  setCurrentPage: (page: string) => void;
  userRole: 'individual' | 'ngo' | null;
  userProfile?: any;
}

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  location?: string;
  creator_id: string;
  is_verified: boolean;
  members_count: number;
  trust_rating: number;
  created_at: string;
  updated_at?: string;
}

const categoryConfig: Record<string, any> = {
  'medical': { icon: Stethoscope, color: 'bg-red-100 text-red-800', bgColor: '#fee2e2', label: 'Medical' },
  'education': { icon: GraduationCap, color: 'bg-blue-100 text-blue-800', bgColor: '#dbeafe', label: 'Educational' },
  'financial': { icon: Wallet, color: 'bg-green-100 text-green-800', bgColor: '#d1fae5', label: 'Financial' },
  'food': { icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-800', bgColor: '#fed7aa', label: 'Food' },
  'shelter': { icon: Home, color: 'bg-purple-100 text-purple-800', bgColor: '#e9d5ff', label: 'Shelter' },
  'emergency': { icon: AlertCircle, color: 'bg-red-100 text-red-800', bgColor: '#fee2e2', label: 'Emergency' },
  'other': { icon: Heart, color: 'bg-pink-100 text-pink-800', bgColor: '#fce7f3', label: 'Other' }
};

export function CommunityDetails({ communityId, setCurrentPage, userRole, userProfile }: CommunityDetailsProps) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Fetch community details and membership status
  useEffect(() => {
    const fetchCommunityDetails = async () => {
      setIsLoading(true);
      
      try {
        // Fetch community details
        const communityResponse = await getCommunityById(communityId);
        
        if (communityResponse.success && communityResponse.data) {
          setCommunity(communityResponse.data);
        } else {
          toast.error(communityResponse.error || 'Failed to load community details');
        }

        // Fetch members
        const membersResponse = await getCommunityMembers(communityId);
        if (membersResponse.success && membersResponse.data) {
          setMembers(membersResponse.data);
        }

        // Check if user is a member
        const membershipResponse = await isUserMemberOfCommunity(communityId);
        if (membershipResponse.success && membershipResponse.data !== undefined) {
          setIsMember(membershipResponse.data);
        }
      } catch (error) {
        console.error('Error fetching community details:', error);
        toast.error('Failed to load community details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunityDetails();

    // Set up real-time subscription for members
    const subscription = subscribeToCommunityMembers(
      communityId,
      async (member, eventType) => {
        console.log('Real-time member event:', eventType, member);
        
        // Refresh members list
        const membersResponse = await getCommunityMembers(communityId);
        if (membersResponse.success && membersResponse.data) {
          setMembers(membersResponse.data);
        }

        // Update community members count
        const communityResponse = await getCommunityById(communityId);
        if (communityResponse.success && communityResponse.data) {
          setCommunity(communityResponse.data);
        }
      },
      (error) => {
        console.error('Real-time subscription error:', error);
      }
    );

    return () => {
      if (subscription) {
        unsubscribeChannel(subscription);
      }
    };
  }, [communityId]);

  const handleJoinCommunity = async () => {
    setIsJoining(true);
    
    try {
      const response = await joinCommunity(communityId);
      
      if (response.success) {
        toast.success('Successfully joined the community!');
        setIsMember(true);
        
        // Refresh community data
        const communityResponse = await getCommunityById(communityId);
        if (communityResponse.success && communityResponse.data) {
          setCommunity(communityResponse.data);
        }

        // Refresh members
        const membersResponse = await getCommunityMembers(communityId);
        if (membersResponse.success && membersResponse.data) {
          setMembers(membersResponse.data);
        }
      } else {
        toast.error(response.error || 'Failed to join community');
      }
    } catch (error) {
      console.error('Error joining community:', error);
      toast.error('Failed to join community. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!confirm('Are you sure you want to leave this community?')) {
      return;
    }

    setIsLeaving(true);
    
    try {
      const response = await leaveCommunity(communityId);
      
      if (response.success) {
        toast.success('Successfully left the community');
        setIsMember(false);
        
        // Refresh community data
        const communityResponse = await getCommunityById(communityId);
        if (communityResponse.success && communityResponse.data) {
          setCommunity(communityResponse.data);
        }

        // Refresh members
        const membersResponse = await getCommunityMembers(communityId);
        if (membersResponse.success && membersResponse.data) {
          setMembers(membersResponse.data);
        }
      } else {
        toast.error(response.error || 'Failed to leave community');
      }
    } catch (error) {
      console.error('Error leaving community:', error);
      toast.error('Failed to leave community. Please try again.');
    } finally {
      setIsLeaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f9fefa' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <Loader2 className="h-12 w-12 mx-auto animate-spin" style={{ color: '#41695e' }} />
            <p className="text-gray-600 mt-4">Loading community details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f9fefa' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-xl text-gray-900 mb-2">Community Not Found</h3>
            <p className="text-gray-600 mb-6">The community you're looking for doesn't exist.</p>
            <Button onClick={() => setCurrentPage('communities')} style={{ backgroundColor: '#41695e' }}>
              Back to Communities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const categoryData = categoryConfig[community.category] || categoryConfig.other;
  const CategoryIcon = categoryData.icon;

  return (
    <div className="min-h-screen py-4 md:py-8 px-3 sm:px-4 md:px-6 lg:px-8" style={{ backgroundColor: '#f9fefa' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => setCurrentPage('communities')}
          className="mb-4 md:mb-6 -ml-2 md:ml-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Back to Communities</span>
          <span className="sm:hidden">Back</span>
        </Button>

        {/* Community Header */}
        <Card className="mb-4 md:mb-6 shadow-sm border-0">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4 md:mb-6">
              <div className="flex items-start space-x-3 sm:space-x-4 flex-1 w-full">
                <div 
                  className="p-3 sm:p-4 rounded-lg flex-shrink-0" 
                  style={{ backgroundColor: categoryData.bgColor }}
                >
                  <CategoryIcon className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: '#033b4a' }} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl truncate" style={{ color: '#033b4a' }}>{community.name}</h1>
                    {community.is_verified && (
                      <Badge variant="outline" className="flex items-center space-x-1 bg-green-50 text-green-700 border-green-200 w-fit">
                        <Shield className="h-3 w-3" />
                        <span className="text-xs sm:text-sm">Verified</span>
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-none">{community.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap">{community.members_count} {community.members_count === 1 ? 'member' : 'members'}</span>
                    </div>
                    {community.location && (
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{community.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="whitespace-nowrap hidden sm:inline">Created {new Date(community.created_at).toLocaleDateString()}</span>
                      <span className="whitespace-nowrap sm:hidden">{new Date(community.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    </div>
                    {community.trust_rating > 0 && (
                      <div className="flex items-center space-x-1 sm:space-x-2 text-amber-600">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-current flex-shrink-0" />
                        <span>{community.trust_rating.toFixed(1)}</span>
                      </div>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {categoryData.label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                {isMember ? (
                  <Button 
                    variant="outline" 
                    onClick={handleLeaveCommunity}
                    disabled={isLeaving}
                    className="flex-1 sm:flex-none text-sm sm:text-base"
                  >
                    {isLeaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Leaving...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Leave Community</span>
                        <span className="sm:hidden">Leave</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleJoinCommunity}
                    disabled={isJoining}
                    style={{ backgroundColor: '#41695e' }}
                    className="flex-1 sm:flex-none text-sm sm:text-base"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Joining...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Join Community</span>
                        <span className="sm:hidden">Join</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 md:mb-6 w-full sm:w-auto flex-wrap sm:flex-nowrap h-auto overflow-x-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3 py-2">
              Overview
            </TabsTrigger>
            <TabsTrigger value="members" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3 py-2">
              <span className="hidden sm:inline">Members ({members.length})</span>
              <span className="sm:hidden">({members.length})</span>
            </TabsTrigger>
            {isMember && (
              <>
                <TabsTrigger value="request-help" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3 py-2">
                  <HandHeart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden md:inline">Request Help</span>
                  <span className="md:hidden">Request</span>
                </TabsTrigger>
                <TabsTrigger value="browse-help" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3 py-2">
                  <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden md:inline">Browse Help</span>
                  <span className="md:hidden">Browse</span>
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="activity" className="text-xs sm:text-sm whitespace-nowrap px-2 sm:px-3 py-2">
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Card className="shadow-sm border-0">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl" style={{ color: '#033b4a' }}>About</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <h4 className="font-medium mb-1 text-sm md:text-base" style={{ color: '#033b4a' }}>Description</h4>
                      <p className="text-sm md:text-base text-gray-600">{community.description}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1 text-sm md:text-base" style={{ color: '#033b4a' }}>Category</h4>
                      <Badge variant="outline" className="text-xs sm:text-sm">{categoryData.label}</Badge>
                    </div>
                    {community.location && (
                      <div>
                        <h4 className="font-medium mb-1 text-sm md:text-base" style={{ color: '#033b4a' }}>Location</h4>
                        <p className="text-sm md:text-base text-gray-600">{community.location}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-0">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl" style={{ color: '#033b4a' }}>Community Stats</CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between text-sm md:text-base">
                      <span className="text-gray-600">Total Members</span>
                      <span className="font-medium" style={{ color: '#033b4a' }}>{community.members_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm md:text-base">
                      <span className="text-gray-600">Trust Rating</span>
                      <span className="font-medium text-amber-600 flex items-center">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 fill-current" />
                        {community.trust_rating.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm md:text-base">
                      <span className="text-gray-600">Status</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs sm:text-sm">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm md:text-base">
                      <span className="text-gray-600">Verified</span>
                      {community.is_verified ? (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      ) : (
                        <span className="text-gray-400 text-sm">Not verified</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <Card className="shadow-sm border-0">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl" style={{ color: '#033b4a' }}>Community Members</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                {members.length > 0 ? (
                  <div className="space-y-3 md:space-y-4">
                    {members.map((member) => {
                      const displayName = member.user?.full_name || member.user?.email || 'Anonymous User';
                      const initials = member.user?.full_name 
                        ? member.user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                        : (member.user?.email?.charAt(0).toUpperCase() || 'U');
                      
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3">
                          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                              <AvatarFallback style={{ backgroundColor: '#41695e', color: 'white' }} className="text-xs sm:text-sm">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm sm:text-base truncate" style={{ color: '#033b4a' }}>
                                {displayName}
                              </div>
                              {member.user?.full_name && member.user?.email && (
                                <div className="text-xs sm:text-sm text-gray-500 truncate">
                                  {member.user.email}
                                </div>
                              )}
                              <div className="text-xs text-gray-500">
                                Joined {new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${member.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'} text-xs whitespace-nowrap flex-shrink-0`}
                          >
                            {member.role === 'admin' ? '👑 Admin' : '👤 Member'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12">
                    <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-sm sm:text-base text-gray-600">No members yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="request-help">
            <CommunityHelpRequestForm 
              communityId={communityId} 
              communityName={community.name}
              communityCategory={community.category}
              onRequestCreated={() => {
                // Optionally switch to browse help tab after creating a request
                toast.success('Request posted! You can now browse help requests from other members.');
              }}
            />
          </TabsContent>

          <TabsContent value="browse-help">
            <Card className="shadow-sm border-0">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl" style={{ color: '#033b4a' }}>Browse Help</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <CommunityBrowseHelp 
                  communityId={communityId} 
                  communityName={community.name}
                  userProfile={userProfile}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <CommunityActivity 
              communityId={communityId} 
              communityName={community.name}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}