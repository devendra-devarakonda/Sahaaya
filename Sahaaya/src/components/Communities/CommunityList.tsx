import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner@2.0.3';
import { 
  Users, 
  MapPin, 
  Plus, 
  Search, 
  Shield,
  Eye,
  Lock,
  Globe,
  Heart,
  GraduationCap,
  Stethoscope,
  Building2,
  Wallet,
  MessageCircle,
  Star,
  UtensilsCrossed,
  AlertCircle,
  Home
} from 'lucide-react';
import {
  getMyCommunities,
  getExploreCommunities,
  joinCommunity,
  leaveCommunity,
  subscribeToCommunities,
  unsubscribeChannel
} from '../../utils/supabaseService';
import { supabase } from '../../utils/auth';

interface CommunityListProps {
  userRole: 'individual' | 'ngo' | null;
  setCurrentPage: (page: string) => void;
  userProfile?: any;
  selectedCommunityId?: string | null;
  setSelectedCommunityId?: (id: string) => void;
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

const categoryConfig = {
  'medical': { icon: Stethoscope, color: 'bg-red-100 text-red-800', bgColor: '#fee2e2', label: 'Medical' },
  'education': { icon: GraduationCap, color: 'bg-blue-100 text-blue-800', bgColor: '#dbeafe', label: 'Educational' },
  'financial': { icon: Wallet, color: 'bg-green-100 text-green-800', bgColor: '#d1fae5', label: 'Financial' },
  'food': { icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-800', bgColor: '#fed7aa', label: 'Food' },
  'shelter': { icon: Home, color: 'bg-purple-100 text-purple-800', bgColor: '#e9d5ff', label: 'Shelter' },
  'emergency': { icon: AlertCircle, color: 'bg-red-100 text-red-800', bgColor: '#fee2e2', label: 'Emergency' },
  'other': { icon: Heart, color: 'bg-pink-100 text-pink-800', bgColor: '#fce7f3', label: 'Other' }
};

export function CommunityList({ userRole, setCurrentPage, userProfile, selectedCommunityId, setSelectedCommunityId }: CommunityListProps) {
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [exploreCommunities, setExploreCommunities] = useState<Community[]>([]);
  const [filteredMyCommunities, setFilteredMyCommunities] = useState<Community[]>([]);
  const [filteredExploreCommunities, setFilteredExploreCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [activeTab, setActiveTab] = useState<'my' | 'explore'>('explore');

  // Fetch communities data
  const fetchCommunities = async () => {
    setIsLoading(true);
    
    try {
      // Fetch both my communities and explore communities
      const [myResponse, exploreResponse] = await Promise.all([
        getMyCommunities(),
        getExploreCommunities()
      ]);

      if (myResponse.success && myResponse.data) {
        setMyCommunities(myResponse.data);
      } else if (myResponse.error) {
        console.error('Error loading my communities:', myResponse.error);
      }

      if (exploreResponse.success && exploreResponse.data) {
        setExploreCommunities(exploreResponse.data);
      } else if (exploreResponse.error) {
        console.error('Error loading explore communities:', exploreResponse.error);
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast.error('Failed to load communities');
    } finally {
      setIsLoading(false);
    }
  };

  // Load communities and set up real-time subscriptions
  useEffect(() => {
    let subscription: any = null;

    const initCommunities = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch initial communities
      await fetchCommunities();

      // Set up real-time subscription for new communities
      subscription = subscribeToCommunities(
        async (newCommunity, eventType) => {
          console.log('Real-time community event:', eventType, newCommunity);
          
          if (eventType === 'INSERT') {
            // Refresh communities to ensure correct categorization
            await fetchCommunities();
            
            // Show toast notification
            toast.success('New Community Created!', {
              description: `${newCommunity.name} is now available to join`,
              duration: 5000
            });
          } else if (eventType === 'UPDATE' || eventType === 'DELETE') {
            // Refresh communities for updates and deletes
            await fetchCommunities();
          }
        },
        (error) => {
          console.error('Real-time subscription error:', error);
        }
      );
    };

    initCommunities();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        unsubscribeChannel(subscription);
      }
    };
  }, []);

  // Filter and sort communities
  useEffect(() => {
    const filterAndSort = (communities: Community[]) => {
      let filtered = [...communities];

      // Search filter
      if (searchTerm) {
        filtered = filtered.filter(community => 
          community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          community.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (community.location && community.location.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Category filter
      if (categoryFilter !== 'all') {
        filtered = filtered.filter(community => community.category === categoryFilter);
      }

      // Sort
      switch (sortBy) {
        case 'newest':
          filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'oldest':
          filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          break;
        case 'members':
          filtered.sort((a, b) => b.members_count - a.members_count);
          break;
        case 'trust_rating':
          filtered.sort((a, b) => b.trust_rating - a.trust_rating);
          break;
        case 'name':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }

      return filtered;
    };

    setFilteredMyCommunities(filterAndSort(myCommunities));
    setFilteredExploreCommunities(filterAndSort(exploreCommunities));
  }, [myCommunities, exploreCommunities, searchTerm, categoryFilter, sortBy]);

  const handleJoinCommunity = async (community: Community) => {
    try {
      const response = await joinCommunity(community.id);
      
      if (response.success) {
        toast.success(`Successfully joined ${community.name}!`);
        
        // Move community from explore to my communities
        setExploreCommunities(prev => prev.filter(c => c.id !== community.id));
        setMyCommunities(prev => [{ ...community, members_count: community.members_count + 1 }, ...prev]);
      } else {
        toast.error(response.error || 'Failed to join community');
      }
    } catch (error) {
      console.error('Error joining community:', error);
      toast.error('Failed to join community. Please try again.');
    }
  };

  const handleLeaveCommunity = async (community: Community) => {
    try {
      const response = await leaveCommunity(community.id);
      
      if (response.success) {
        toast.success(`Successfully left ${community.name}`);
        
        // Move community from my communities to explore
        setMyCommunities(prev => prev.filter(c => c.id !== community.id));
        setExploreCommunities(prev => [{ ...community, members_count: community.members_count - 1 }, ...prev]);
      } else {
        toast.error(response.error || 'Failed to leave community');
      }
    } catch (error) {
      console.error('Error leaving community:', error);
      toast.error('Failed to leave community. Please try again.');
    }
  };

  const handleViewCommunity = (community: Community) => {
    setSelectedCommunityId?.(community.id);
    setCurrentPage('community-details');
  };

  const handleCreateCommunity = () => {
    setCurrentPage('create-community');
  };

  const renderCommunityCard = (community: Community, isMember: boolean) => {
    const categoryData = categoryConfig[community.category as keyof typeof categoryConfig] || categoryConfig.other;
    const CategoryIcon = categoryData.icon;

    return (
      <Card 
        key={community.id} 
        className="hover:shadow-lg transition-all duration-200 border-0 cursor-pointer"
        onClick={() => handleViewCommunity(community)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between mb-3">
            <div 
              className="p-2 rounded-lg" 
              style={{ backgroundColor: categoryData.bgColor }}
            >
              <CategoryIcon className="h-5 w-5" style={{ color: '#033b4a' }} />
            </div>
            <div className="flex items-center space-x-2">
              {community.is_verified && (
                <Badge variant="outline" className="flex items-center space-x-1 bg-green-50 text-green-700 border-green-200">
                  <Shield className="h-3 w-3" />
                  <span>Verified</span>
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-lg" style={{ color: '#033b4a' }}>
            {community.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {community.description}
          </p>

          <div className="space-y-2 mb-4">
            {community.location && (
              <div className="flex items-center text-xs text-gray-500">
                <MapPin className="h-3 w-3 mr-1" />
                {community.location}
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center text-gray-500">
                <Users className="h-3 w-3 mr-1" />
                {community.members_count} {community.members_count === 1 ? 'member' : 'members'}
              </div>
              {community.trust_rating > 0 && (
                <div className="flex items-center text-amber-600">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  {community.trust_rating.toFixed(1)}
                </div>
              )}
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <Badge variant="outline" className="text-xs">
                {categoryData.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isMember ? (
              <>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLeaveCommunity(community);
                  }}
                  className="flex-1"
                  size="sm"
                  variant="outline"
                >
                  Leave Community
                </Button>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewCommunity(community);
                  }}
                  size="sm"
                  style={{ backgroundColor: '#41695e' }}
                >
                  View
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinCommunity(community);
                  }}
                  className="flex-1"
                  size="sm"
                  style={{ backgroundColor: '#41695e' }}
                >
                  Join Community
                </Button>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewCommunity(community);
                  }}
                  variant="outline"
                  size="sm"
                >
                  View
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f9fefa' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg" 
                 style={{ backgroundColor: '#41695e' }}>
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600">Loading communities...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentCommunities = activeTab === 'my' ? filteredMyCommunities : filteredExploreCommunities;
  const totalMyCommunities = myCommunities.length;
  const totalExploreCommunities = exploreCommunities.length;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f9fefa' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#41695e' }}>
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 style={{ color: '#033b4a' }}>Communities</h1>
                <p className="text-gray-600">Join local communities and connect with like-minded helpers</p>
              </div>
            </div>
            
            <Button 
              onClick={handleCreateCommunity}
              className="flex items-center space-x-2"
              style={{ backgroundColor: '#41695e' }}
            >
              <Plus className="h-4 w-4" />
              <span>Create Community</span>
            </Button>
          </div>

          {/* Info Banner */}
          {(totalMyCommunities > 0 || totalExploreCommunities > 0) && (
            <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-900 mb-1">🌐 Live Communities from Supabase</h3>
                  <p className="text-sm text-green-700 mb-2">
                    Showing {totalMyCommunities + totalExploreCommunities} {totalMyCommunities + totalExploreCommunities === 1 ? 'community' : 'communities'} from our database. 
                    You've joined {totalMyCommunities} {totalMyCommunities === 1 ? 'community' : 'communities'} and can explore {totalExploreCommunities} more!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalMyCommunities === 0 && totalExploreCommunities === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
              <Users className="h-12 w-12 mx-auto text-blue-500 mb-3" />
              <h3 className="font-medium text-blue-900 mb-2">No Communities Yet</h3>
              <p className="text-sm text-blue-700 mb-4">
                Be the first to create a community and start connecting with others!
              </p>
              <Button 
                onClick={handleCreateCommunity}
                style={{ backgroundColor: '#41695e' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Community
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        {(totalMyCommunities > 0 || totalExploreCommunities > 0) && (
          <>
            <div className="flex items-center space-x-4 mb-6">
              <Button
                onClick={() => setActiveTab('my')}
                variant={activeTab === 'my' ? 'default' : 'outline'}
                style={activeTab === 'my' ? { backgroundColor: '#41695e' } : {}}
              >
                My Communities ({totalMyCommunities})
              </Button>
              <Button
                onClick={() => setActiveTab('explore')}
                variant={activeTab === 'explore' ? 'default' : 'outline'}
                style={activeTab === 'explore' ? { backgroundColor: '#41695e' } : {}}
              >
                Explore Communities ({totalExploreCommunities})
              </Button>
            </div>

            {/* Search and Filters */}
            <Card className="mb-8 shadow-sm border-0">
              <CardContent className="p-6">
                <div className="grid lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 gap-4">
                  {/* Search */}
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search communities, locations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="education">Educational</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="food">Food Support</SelectItem>
                      <SelectItem value="shelter">Shelter</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort By */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="members">Most Members</SelectItem>
                      <SelectItem value="trust_rating">Highest Trust</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Communities Grid */}
            {currentCommunities.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentCommunities.map((community) => renderCommunityCard(community, activeTab === 'my'))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'my' ? 'No communities joined yet' : 'No communities found'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {activeTab === 'my' 
                    ? 'Start by exploring and joining communities that interest you'
                    : 'Try adjusting your search or filters'
                  }
                </p>
                {activeTab === 'my' ? (
                  <Button 
                    onClick={() => setActiveTab('explore')}
                    style={{ backgroundColor: '#41695e' }}
                  >
                    Explore Communities
                  </Button>
                ) : (
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('all');
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
