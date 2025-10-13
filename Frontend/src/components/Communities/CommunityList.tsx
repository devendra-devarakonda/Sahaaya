import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  UtensilsCrossed
} from 'lucide-react';
import { communitiesApi } from '../../utils/api';

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
  location_name: string;
  location_coordinates?: [number, number];
  privacy_type: 'public' | 'private' | 'invite-only';
  member_count: number;
  admin_name: string;
  created_at: string;
  status: 'approved' | 'pending' | 'rejected';
  verified: boolean;
  trust_score: number;
  cover_image_url?: string;
}

const categoryConfig = {
  'Medical': { icon: Stethoscope, color: 'bg-red-100 text-red-800', bgColor: '#fee2e2' },
  'Educational': { icon: GraduationCap, color: 'bg-blue-100 text-blue-800', bgColor: '#dbeafe' },
  'Financial': { icon: Wallet, color: 'bg-green-100 text-green-800', bgColor: '#d1fae5' },
  'Food': { icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-800', bgColor: '#fed7aa' },
  'NGO': { icon: Building2, color: 'bg-purple-100 text-purple-800', bgColor: '#e9d5ff' },
  'Emotional': { icon: Heart, color: 'bg-pink-100 text-pink-800', bgColor: '#fce7f3' }
};

const privacyConfig = {
  'public': { icon: Globe, label: 'Public', color: 'text-green-600' },
  'private': { icon: Lock, label: 'Private', color: 'text-orange-600' },
  'invite-only': { icon: Eye, label: 'Invite Only', color: 'text-blue-600' }
};

// Mock data for demonstration - moved above component to avoid temporal dead zone
const mockCommunities: Community[] = [
    {
      id: 'COMM-MUMBAI-MED-001',
      name: 'Mumbai Medical Support Network',
      description: 'Connecting patients, doctors, and volunteers to provide emergency medical assistance and support in Mumbai region. Our network includes verified medical professionals, ambulance services, and blood donors.',
      category: 'Medical',
      location_name: 'Mumbai, Maharashtra',
      location_coordinates: [19.0760, 72.8777],
      privacy_type: 'public',
      member_count: 1247,
      admin_name: 'Dr. Priya Sharma',
      created_at: '2024-01-15T10:30:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.8,
      cover_image_url: undefined
    },
    {
      id: 'COMM-PUNE-EDU-002',
      name: 'Rural Education Initiative',
      description: 'Supporting education in rural areas through volunteer teachers, learning materials, and infrastructure development. We focus on providing quality education to underprivileged children in remote villages.',
      category: 'Educational',
      location_name: 'Pune District, Maharashtra',
      location_coordinates: [18.5204, 73.8567],
      privacy_type: 'public',
      member_count: 856,
      admin_name: 'Helping Hands NGO',
      created_at: '2024-01-10T14:20:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.6,
      cover_image_url: undefined
    },
    {
      id: 'COMM-DELHI-FIN-003',
      name: 'Financial Literacy & Support',
      description: 'Providing financial education, microfinance opportunities, and emergency financial assistance to underserved communities. Learn budgeting, savings, and investment strategies.',
      category: 'Financial',
      location_name: 'Delhi NCR',
      location_coordinates: [28.6139, 77.2090],
      privacy_type: 'public',
      member_count: 643,
      admin_name: 'Rajesh Kumar',
      created_at: '2024-01-08T09:15:00Z',
      status: 'approved',
      verified: false,
      trust_score: 4.2,
      cover_image_url: undefined
    },
    {
      id: 'COMM-BANG-EMO-004',
      name: 'Women Empowerment Circle',
      description: 'A safe space for women to share experiences, seek support, and access resources for personal and professional growth. We provide mentorship, skill development, and emotional support.',
      category: 'Emotional',
      location_name: 'Bangalore, Karnataka',
      location_coordinates: [12.9716, 77.5946],
      privacy_type: 'private',
      member_count: 324,
      admin_name: 'Sneha Patel',
      created_at: '2024-01-12T16:45:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.9,
      cover_image_url: undefined
    },
    {
      id: 'COMM-CHEN-EDU-005',
      name: 'Youth Mentorship Program',
      description: 'Connecting experienced professionals with young individuals seeking career guidance and life skills development. Our mentors come from diverse industries and backgrounds.',
      category: 'Educational',
      location_name: 'Chennai, Tamil Nadu',
      location_coordinates: [13.0827, 80.2707],
      privacy_type: 'invite-only',
      member_count: 189,
      admin_name: 'Career Guidance Foundation',
      created_at: '2024-01-18T11:30:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.7,
      cover_image_url: undefined
    },
    {
      id: 'COMM-HYD-MED-006',
      name: 'Hyderabad Mental Health Support',
      description: 'Providing mental health awareness, counseling support, and crisis intervention services. Our licensed counselors and peer support groups help individuals navigate mental health challenges.',
      category: 'Medical',
      location_name: 'Hyderabad, Telangana',
      location_coordinates: [17.3850, 78.4867],
      privacy_type: 'public',
      member_count: 432,
      admin_name: 'Dr. Arjun Reddy',
      created_at: '2024-01-20T08:00:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.7,
      cover_image_url: undefined
    },
    {
      id: 'COMM-KOL-FOOD-007',
      name: 'Kolkata Food Security Initiative',
      description: 'Fighting hunger and malnutrition through food distribution, community kitchens, and nutrition education programs. We partner with local restaurants and volunteers to provide meals.',
      category: 'Food',
      location_name: 'Kolkata, West Bengal',
      location_coordinates: [22.5726, 88.3639],
      privacy_type: 'public',
      member_count: 1089,
      admin_name: 'Food For All Foundation',
      created_at: '2024-01-05T12:00:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.5,
      cover_image_url: undefined
    },
    {
      id: 'COMM-AHMD-FIN-008',
      name: 'Ahmedabad Entrepreneur Support Network',
      description: 'Supporting aspiring entrepreneurs and small business owners with funding guidance, mentorship, and networking opportunities. Connect with successful business leaders and investors.',
      category: 'Financial',
      location_name: 'Ahmedabad, Gujarat',
      location_coordinates: [23.0225, 72.5714],
      privacy_type: 'invite-only',
      member_count: 267,
      admin_name: 'Business Incubator Hub',
      created_at: '2024-01-22T14:30:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.4,
      cover_image_url: undefined
    },
    {
      id: 'COMM-JAIPUR-EMO-009',
      name: 'Jaipur Senior Citizens Care',
      description: 'Providing companionship, health monitoring, and assistance services for elderly community members. Our volunteers help with daily activities and provide emotional support.',
      category: 'Emotional',
      location_name: 'Jaipur, Rajasthan',
      location_coordinates: [26.9124, 75.7873],
      privacy_type: 'public',
      member_count: 378,
      admin_name: 'Golden Years Foundation',
      created_at: '2024-01-25T10:15:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.6,
      cover_image_url: undefined
    },
    {
      id: 'COMM-COIMBATORE-EDU-010',
      name: 'Coimbatore Tech Skills Development',
      description: 'Bridging the digital divide by teaching programming, digital literacy, and technical skills to underserved youth. Free coding bootcamps and computer training programs.',
      category: 'Educational',
      location_name: 'Coimbatore, Tamil Nadu',
      location_coordinates: [11.0168, 76.9558],
      privacy_type: 'public',
      member_count: 523,
      admin_name: 'Tech For Change Initiative',
      created_at: '2024-01-28T16:20:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.3,
      cover_image_url: undefined
    },
    {
      id: 'COMM-LUCKNOW-MED-011',
      name: 'Lucknow Healthcare Volunteers',
      description: 'Volunteer healthcare professionals providing free medical checkups, health awareness campaigns, and emergency medical support in underserved areas of Lucknow.',
      category: 'Medical',
      location_name: 'Lucknow, Uttar Pradesh',
      location_coordinates: [26.8467, 80.9462],
      privacy_type: 'public',
      member_count: 156,
      admin_name: 'Dr. Kavita Singh',
      created_at: '2024-02-01T09:00:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.5,
      cover_image_url: undefined
    },
    {
      id: 'COMM-BHOPAL-NGO-012',
      name: 'Bhopal Environmental Action Group',
      description: 'Working towards environmental conservation, clean water initiatives, and sustainable living practices. Join us for tree plantation drives, clean-up campaigns, and eco-awareness programs.',
      category: 'NGO',
      location_name: 'Bhopal, Madhya Pradesh',
      location_coordinates: [23.2599, 77.4126],
      privacy_type: 'public',
      member_count: 734,
      admin_name: 'Green Earth Foundation',
      created_at: '2024-02-03T11:45:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.4,
      cover_image_url: undefined
    },
    {
      id: 'COMM-DELHI-FOOD-013',
      name: 'Delhi Food Distribution Network',
      description: 'Providing daily meals to underprivileged families, homeless individuals, and students. Our volunteers distribute nutritious food across Delhi NCR with focus on zero waste and dignity.',
      category: 'Food',
      location_name: 'Delhi NCR',
      location_coordinates: [28.6139, 77.2090],
      privacy_type: 'public',
      member_count: 892,
      admin_name: 'Hunger Relief Society',
      created_at: '2024-01-28T15:20:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.6,
      cover_image_url: undefined
    },
    {
      id: 'COMM-HYDERABAD-FOOD-014',
      name: 'Hyderabad Community Kitchen',
      description: 'Operating community kitchens in slum areas and providing food assistance during emergencies. We also run nutrition programs for pregnant mothers and children.',
      category: 'Food',
      location_name: 'Hyderabad, Telangana',
      location_coordinates: [17.3850, 78.4867],
      privacy_type: 'public',
      member_count: 567,
      admin_name: 'Annapurna Foundation',
      created_at: '2024-02-01T12:30:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.7,
      cover_image_url: undefined
    },
    {
      id: 'COMM-CHEN-FOOD-015',
      name: 'Chennai Meal Sharing Circle',
      description: 'Connecting surplus food from events, restaurants, and homes with people in need. Our volunteers ensure fresh, quality food reaches the right beneficiaries quickly.',
      category: 'Food',
      location_name: 'Chennai, Tamil Nadu',
      location_coordinates: [13.0827, 80.2707],
      privacy_type: 'public',
      member_count: 423,
      admin_name: 'Share Food Initiative',
      created_at: '2024-02-05T09:45:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.5,
      cover_image_url: undefined
    },
    {
      id: 'COMM-PUNE-FOOD-016',
      name: 'Pune Zero Hunger Network',
      description: 'Working towards eliminating hunger in Pune through sustainable food systems, urban farming, and community fridges. Volunteers can contribute meals, money, or time.',
      category: 'Food',
      location_name: 'Pune, Maharashtra',
      location_coordinates: [18.5204, 73.8567],
      privacy_type: 'public',
      member_count: 678,
      admin_name: 'Zero Hunger Collective',
      created_at: '2024-02-08T14:15:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.4,
      cover_image_url: undefined
    },
    {
      id: 'COMM-BANG-MED-017',
      name: 'Bangalore Emergency Medical Support',
      description: 'Round-the-clock emergency medical assistance, ambulance coordination, and first aid training. Our network includes doctors, paramedics, and trained volunteers.',
      category: 'Medical',
      location_name: 'Bangalore, Karnataka',
      location_coordinates: [12.9716, 77.5946],
      privacy_type: 'public',
      member_count: 789,
      admin_name: 'Dr. Suresh Menon',
      created_at: '2024-02-10T08:30:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.8,
      cover_image_url: undefined
    },
    {
      id: 'COMM-GURGAON-EDU-018',
      name: 'Gurgaon Skill Development Hub',
      description: 'Empowering youth and adults with digital skills, vocational training, and job placement assistance. Free courses in coding, digital marketing, and entrepreneurship.',
      category: 'Educational',
      location_name: 'Gurgaon, Haryana',
      location_coordinates: [28.4595, 77.0266],
      privacy_type: 'public',
      member_count: 445,
      admin_name: 'Skill India Initiative',
      created_at: '2024-02-12T16:00:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.3,
      cover_image_url: undefined
    },
    {
      id: 'COMM-KANPUR-FIN-019',
      name: 'Kanpur Microfinance Support Group',
      description: 'Providing microloans, financial literacy, and business mentorship to small entrepreneurs and women self-help groups in Kanpur and surrounding areas.',
      category: 'Financial',
      location_name: 'Kanpur, Uttar Pradesh',
      location_coordinates: [26.4499, 80.3319],
      privacy_type: 'public',
      member_count: 234,
      admin_name: 'Economic Empowerment Trust',
      created_at: '2024-02-15T10:20:00Z',
      status: 'approved',
      verified: true,
      trust_score: 4.2,
      cover_image_url: undefined
    }
];

export function CommunityList({ userRole, setCurrentPage, userProfile, selectedCommunityId, setSelectedCommunityId }: CommunityListProps) {
  const [communities, setCommunities] = useState<Community[]>(mockCommunities); // Initialize with mock data
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start with false since we have mock data
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [privacyFilter, setPrivacyFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [canCreateCommunity, setCanCreateCommunity] = useState(false);

  // Initialize filtered communities with mock data on mount
  useEffect(() => {
    console.log('Component mounted with communities:', mockCommunities.length);
    setFilteredCommunities(mockCommunities);
  }, []);

  // Determine if user can create community
  useEffect(() => {
    const checkCreatePermissions = () => {
      if (!userProfile) {
        setCanCreateCommunity(false);
        return;
      }

      // NGOs can always create communities (they're considered verified)
      if (userRole === 'ngo') {
        setCanCreateCommunity(true);
        return;
      }

      // For individual users, check if they're verified or trusted
      // This would normally check against user's verification status and trust score
      // For demo purposes, we'll allow users with profile data to request creation
      const isVerified = userProfile.verified || userProfile.trust_score >= 4.0;
      setCanCreateCommunity(isVerified);
    };

    checkCreatePermissions();
  }, [userRole, userProfile]);

  // Fetch communities data
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setError(null);

        // Try to fetch from API with timeout, fallback to existing mock data
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('API timeout')), 3000);
        });

        try {
          const response = await Promise.race([
            communitiesApi.browse(),
            timeoutPromise
          ]);
          console.log('API response:', response);
          if (response.communities && response.communities.length > 0) {
            setCommunities(response.communities);
          }
          // If no communities from API, keep using mock data
        } catch (apiError) {
          console.warn('API call failed, keeping mock data:', apiError);
          setError('Using demo communities. Real-time data unavailable.');
          // Keep existing mock communities
        }
      } catch (error) {
        console.error('Error fetching communities:', error);
        setError('Using demo communities. Real-time data unavailable.');
        // Keep existing mock communities
      }
    };

    fetchCommunities();
  }, []);

  // Filter and sort communities
  useEffect(() => {
    console.log('Filtering communities. Total communities:', communities.length);
    console.log('Filter criteria:', { searchTerm, categoryFilter, privacyFilter, locationFilter, sortBy });
    
    let filtered = [...communities];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(community => 
        community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.location_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(community => community.category === categoryFilter);
    }

    // Privacy filter
    if (privacyFilter !== 'all') {
      filtered = filtered.filter(community => community.privacy_type === privacyFilter);
    }

    // Location filter (simplified - would be more sophisticated in real app)
    if (locationFilter !== 'all') {
      filtered = filtered.filter(community => 
        community.location_name.toLowerCase().includes(locationFilter.toLowerCase())
      );
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
        filtered.sort((a, b) => b.member_count - a.member_count);
        break;
      case 'trust_score':
        filtered.sort((a, b) => b.trust_score - a.trust_score);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    console.log('Filtered communities count:', filtered.length);
    setFilteredCommunities(filtered);
  }, [communities, searchTerm, categoryFilter, privacyFilter, locationFilter, sortBy]);

  const handleJoinCommunity = async (community: Community) => {
    try {
      // This would normally call the join API
      console.log(`Joining community: ${community.name}`);
      // await communitiesApi.join(community.id);
      
      // For demo, just show success message
      alert(`Successfully joined ${community.name}!`);
    } catch (error) {
      console.error('Error joining community:', error);
      alert('Failed to join community. Please try again.');
    }
  };

  const handleViewCommunity = (community: Community) => {
    setSelectedCommunity(community);
    // Navigate to community details page
    setSelectedCommunityId?.(community.id);
    setCurrentPage('community-details');
    console.log('Viewing community:', community.name);
  };

  const handleCreateCommunity = () => {
    if (canCreateCommunity) {
      setCurrentPage('create-community');
    } else {
      setCurrentPage('request-community-creation');
    }
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
              <span>{canCreateCommunity ? 'Create Community' : 'Request to Create'}</span>
            </Button>
          </div>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <MessageCircle className="h-5 w-5 mt-0.5 text-yellow-500" />
                <div>
                  <p className="text-sm text-yellow-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Welcome Info Banner */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-900 mb-1">Welcome to Sahaaya Communities</h3>
                <p className="text-sm text-green-700 mb-2">
                  Explore 19 pre-designed communities across India, from Mumbai's Medical Support Network with 1,247+ members to specialized groups for food distribution, education, financial literacy, women empowerment, and environmental action.
                </p>
                <div className="flex items-center space-x-6 text-xs text-green-600">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Medical Support</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Educational</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Financial</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Food Support</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span>Emotional Support</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>NGO Services</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 shadow-sm border-0">
          <CardContent className="p-6">
            <div className="grid lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 gap-4">
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
                  <SelectItem value="Medical">Medical</SelectItem>
                  <SelectItem value="Educational">Educational</SelectItem>
                  <SelectItem value="Financial">Financial</SelectItem>
                  <SelectItem value="Food">Food Support</SelectItem>
                  <SelectItem value="NGO">NGO Services</SelectItem>
                  <SelectItem value="Emotional">Emotional Support</SelectItem>
                </SelectContent>
              </Select>

              {/* Privacy Filter */}
              <Select value={privacyFilter} onValueChange={setPrivacyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Privacy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="invite-only">Invite Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="members">Most Members</SelectItem>
                  <SelectItem value="trust_score">Highest Rated</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Communities Content - Grid View */}
        {filteredCommunities.length > 0 ? (
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCommunities.map((community) => {
              const CategoryIcon = categoryConfig[community.category as keyof typeof categoryConfig]?.icon || Users;
              const privacySettings = privacyConfig[community.privacy_type];
              
              return (
                <Card key={community.id} className="shadow-sm border-0 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: categoryConfig[community.category as keyof typeof categoryConfig]?.bgColor || '#e8f5f0' }}
                        >
                          <CategoryIcon className="h-5 w-5" style={{ color: '#41695e' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <CardTitle className="truncate" style={{ color: '#033b4a' }}>
                              {community.name}
                            </CardTitle>
                            {community.verified && (
                              <Shield className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={categoryConfig[community.category as keyof typeof categoryConfig]?.color || 'bg-gray-100 text-gray-800'}>
                              {community.category}
                            </Badge>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <privacySettings.icon className="h-3 w-3" />
                              <span>{privacySettings.label}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {community.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{community.member_count.toLocaleString()} members</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{community.location_name}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{community.trust_score}</span>
                        <span className="text-xs text-gray-500">({community.member_count} reviews)</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Admin: {community.admin_name}
                      </span>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button 
                        onClick={() => handleViewCommunity(community)}
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      <Button 
                        onClick={() => handleJoinCommunity(community)}
                        size="sm"
                        className="flex-1"
                        style={{ backgroundColor: '#41695e' }}
                      >
                        {community.privacy_type === 'private' || community.privacy_type === 'invite-only' 
                          ? 'Request to Join' 
                          : 'Join Community'
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No communities found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || categoryFilter !== 'all' || privacyFilter !== 'all' 
                ? 'Try adjusting your search filters to find more communities.'
                : 'Be the first to create a community in your area!'
              }
            </p>
            <Button 
              onClick={handleCreateCommunity}
              style={{ backgroundColor: '#41695e' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {canCreateCommunity ? 'Create Community' : 'Request to Create'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}