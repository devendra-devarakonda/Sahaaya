import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from "sonner@2.0.3";
import { 
  ArrowLeft,
  Users,
  MapPin,
  Calendar,
  Shield,
  Star,
  Globe,
  Lock,
  Eye,
  Settings,
  UserPlus,
  MessageCircle,
  Flag,
  MoreHorizontal,
  Crown,
  CheckCircle,
  Heart,
  Stethoscope,
  GraduationCap,
  Wallet,
  Building2,
  Plus,
  UtensilsCrossed
} from 'lucide-react';
import { communitiesApi } from '../../utils/api';

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
  location_name: string;
  privacy_type: 'public' | 'private' | 'invite-only';
  member_count: number;
  verified: boolean;
  trust_score: number;
  admin_name: string;
  created_at: string;
  created_by: string;
  members?: CommunityMember[];
  help_requests_count?: number;
  active_help_requests?: number;
  resolved_help_requests?: number;
}

interface CommunityMember {
  id: string;
  user_name: string;
  role: 'admin' | 'moderator' | 'member';
  status: 'active' | 'pending' | 'banned';
  joined_at: string;
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
  'public': { icon: Globe, label: 'Public', color: 'text-green-600', bgColor: 'bg-green-100' },
  'private': { icon: Lock, label: 'Private', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'invite-only': { icon: Eye, label: 'Invite Only', color: 'text-blue-600', bgColor: 'bg-blue-100' }
};

export function CommunityDetails({ communityId, setCurrentPage, userRole, userProfile }: CommunityDetailsProps) {
  // Mock community data for demonstration
  const getMockCommunity = (id: string): Community => {
    const communityMap: { [key: string]: Community } = {
      'COMM-MUMBAI-MED-001': {
        id: 'COMM-MUMBAI-MED-001',
        name: 'Mumbai Medical Support Network',
        description: 'Connecting patients, doctors, and volunteers to provide emergency medical assistance and support in Mumbai region. Our network includes verified medical professionals, ambulance services, and blood donors.',
        category: 'Medical',
        location_name: 'Mumbai, Maharashtra',
        privacy_type: 'public',
        member_count: 1247,
        verified: true,
        trust_score: 4.8,
        admin_name: 'Dr. Priya Sharma',
        created_at: '2024-01-15T10:30:00Z',
        created_by: 'admin-user-123',
        help_requests_count: 142,
        active_help_requests: 23,
        resolved_help_requests: 119,
        members: [
          { id: 'member-1', user_name: 'Dr. Priya Sharma', role: 'admin', status: 'active', joined_at: '2024-01-15T10:30:00Z' },
          { id: 'member-2', user_name: 'Nurse Amit Patel', role: 'moderator', status: 'active', joined_at: '2024-01-16T14:20:00Z' },
          { id: 'member-3', user_name: 'Volunteer Sunita', role: 'member', status: 'active', joined_at: '2024-01-18T09:15:00Z' },
          { id: 'member-4', user_name: 'Dr. Rajesh Kumar', role: 'member', status: 'active', joined_at: '2024-01-20T16:45:00Z' },
          { id: 'member-5', user_name: 'Social Worker Maya', role: 'member', status: 'active', joined_at: '2024-01-22T11:30:00Z' }
        ]
      },
      'COMM-PUNE-EDU-002': {
        id: 'COMM-PUNE-EDU-002',
        name: 'Rural Education Initiative',
        description: 'Supporting education in rural areas through volunteer teachers, learning materials, and infrastructure development. We focus on providing quality education to underprivileged children in remote villages.',
        category: 'Educational',
        location_name: 'Pune District, Maharashtra',
        privacy_type: 'public',
        member_count: 856,
        verified: true,
        trust_score: 4.6,
        admin_name: 'Helping Hands NGO',
        created_at: '2024-01-10T14:20:00Z',
        created_by: 'ngo-user-456',
        help_requests_count: 87,
        active_help_requests: 15,
        resolved_help_requests: 72,
        members: [
          { id: 'member-1', user_name: 'Helping Hands NGO', role: 'admin', status: 'active', joined_at: '2024-01-10T14:20:00Z' },
          { id: 'member-2', user_name: 'Teacher Kavya', role: 'moderator', status: 'active', joined_at: '2024-01-11T10:00:00Z' },
          { id: 'member-3', user_name: 'Student Volunteer Raj', role: 'member', status: 'active', joined_at: '2024-01-12T16:30:00Z' },
          { id: 'member-4', user_name: 'Books Donor Meera', role: 'member', status: 'active', joined_at: '2024-01-14T08:45:00Z' }
        ]
      },
      'COMM-DELHI-FIN-003': {
        id: 'COMM-DELHI-FIN-003',
        name: 'Financial Literacy & Support',
        description: 'Providing financial education, microfinance opportunities, and emergency financial assistance to underserved communities. Learn budgeting, savings, and investment strategies.',
        category: 'Financial',
        location_name: 'Delhi NCR',
        privacy_type: 'public',
        member_count: 643,
        verified: false,
        trust_score: 4.2,
        admin_name: 'Rajesh Kumar',
        created_at: '2024-01-08T09:15:00Z',
        created_by: 'individual-user-456',
        help_requests_count: 45,
        active_help_requests: 8,
        resolved_help_requests: 37,
        members: [
          { id: 'member-1', user_name: 'Rajesh Kumar', role: 'admin', status: 'active', joined_at: '2024-01-08T09:15:00Z' },
          { id: 'member-2', user_name: 'Finance Expert Priti', role: 'moderator', status: 'active', joined_at: '2024-01-09T14:30:00Z' },
          { id: 'member-3', user_name: 'Entrepreneur Vikash', role: 'member', status: 'active', joined_at: '2024-01-11T10:20:00Z' }
        ]
      },
      'COMM-BANG-EMO-004': {
        id: 'COMM-BANG-EMO-004',
        name: 'Women Empowerment Circle',
        description: 'A safe space for women to share experiences, seek support, and access resources for personal and professional growth. We provide mentorship, skill development, and emotional support.',
        category: 'Emotional',
        location_name: 'Bangalore, Karnataka',
        privacy_type: 'private',
        member_count: 324,
        verified: true,
        trust_score: 4.9,
        admin_name: 'Sneha Patel',
        created_at: '2024-01-12T16:45:00Z',
        created_by: 'individual-user-789',
        help_requests_count: 56,
        active_help_requests: 8,
        resolved_help_requests: 48,
        members: [
          { id: 'member-1', user_name: 'Sneha Patel', role: 'admin', status: 'active', joined_at: '2024-01-12T16:45:00Z' },
          { id: 'member-2', user_name: 'Career Coach Priya', role: 'moderator', status: 'active', joined_at: '2024-01-13T09:20:00Z' },
          { id: 'member-3', user_name: 'Entrepreneur Aditi', role: 'member', status: 'active', joined_at: '2024-01-15T14:15:00Z' },
          { id: 'member-4', user_name: 'Tech Professional Riya', role: 'member', status: 'active', joined_at: '2024-01-17T11:30:00Z' }
        ]
      },
      'COMM-CHEN-EDU-005': {
        id: 'COMM-CHEN-EDU-005',
        name: 'Youth Mentorship Program',
        description: 'Connecting experienced professionals with young individuals seeking career guidance and life skills development. Our mentors come from diverse industries and backgrounds.',
        category: 'Educational',
        location_name: 'Chennai, Tamil Nadu',
        privacy_type: 'invite-only',
        member_count: 189,
        verified: true,
        trust_score: 4.7,
        admin_name: 'Career Guidance Foundation',
        created_at: '2024-01-18T11:30:00Z',
        created_by: 'ngo-user-567',
        help_requests_count: 32,
        active_help_requests: 6,
        resolved_help_requests: 26,
        members: [
          { id: 'member-1', user_name: 'Career Guidance Foundation', role: 'admin', status: 'active', joined_at: '2024-01-18T11:30:00Z' },
          { id: 'member-2', user_name: 'Senior Mentor Arvind', role: 'moderator', status: 'active', joined_at: '2024-01-19T09:45:00Z' },
          { id: 'member-3', user_name: 'HR Professional Deepa', role: 'member', status: 'active', joined_at: '2024-01-21T15:20:00Z' }
        ]
      },
      'COMM-HYD-MED-006': {
        id: 'COMM-HYD-MED-006',
        name: 'Hyderabad Mental Health Support',
        description: 'Providing mental health awareness, counseling support, and crisis intervention services. Our licensed counselors and peer support groups help individuals navigate mental health challenges.',
        category: 'Medical',
        location_name: 'Hyderabad, Telangana',
        privacy_type: 'public',
        member_count: 432,
        verified: true,
        trust_score: 4.7,
        admin_name: 'Dr. Arjun Reddy',
        created_at: '2024-01-20T08:00:00Z',
        created_by: 'ngo-user-321',
        help_requests_count: 78,
        active_help_requests: 12,
        resolved_help_requests: 66,
        members: [
          { id: 'member-1', user_name: 'Dr. Arjun Reddy', role: 'admin', status: 'active', joined_at: '2024-01-20T08:00:00Z' },
          { id: 'member-2', user_name: 'Counselor Lakshmi', role: 'moderator', status: 'active', joined_at: '2024-01-21T10:15:00Z' },
          { id: 'member-3', user_name: 'Peer Support Kiran', role: 'member', status: 'active', joined_at: '2024-01-23T15:45:00Z' },
          { id: 'member-4', user_name: 'Therapist Vikram', role: 'member', status: 'active', joined_at: '2024-01-25T12:20:00Z' }
        ]
      },
      'COMM-KOL-FOOD-007': {
        id: 'COMM-KOL-FOOD-007',
        name: 'Kolkata Food Security Initiative',
        description: 'Fighting hunger and malnutrition through food distribution, community kitchens, and nutrition education programs. We partner with local restaurants and volunteers to provide meals.',
        category: 'Food',
        location_name: 'Kolkata, West Bengal',
        privacy_type: 'public',
        member_count: 1089,
        verified: true,
        trust_score: 4.5,
        admin_name: 'Food For All Foundation',
        created_at: '2024-01-05T12:00:00Z',
        created_by: 'ngo-user-654',
        help_requests_count: 203,
        active_help_requests: 31,
        resolved_help_requests: 172,
        members: [
          { id: 'member-1', user_name: 'Food For All Foundation', role: 'admin', status: 'active', joined_at: '2024-01-05T12:00:00Z' },
          { id: 'member-2', user_name: 'Chef Volunteer Binoy', role: 'moderator', status: 'active', joined_at: '2024-01-06T14:30:00Z' },
          { id: 'member-3', user_name: 'Distribution Team Lead Anita', role: 'member', status: 'active', joined_at: '2024-01-08T09:45:00Z' },
          { id: 'member-4', user_name: 'Nutrition Expert Dipali', role: 'member', status: 'active', joined_at: '2024-01-10T16:20:00Z' }
        ]
      },
      'COMM-AHMD-FIN-008': {
        id: 'COMM-AHMD-FIN-008',
        name: 'Ahmedabad Entrepreneur Support Network',
        description: 'Supporting aspiring entrepreneurs and small business owners with funding guidance, mentorship, and networking opportunities. Connect with successful business leaders and investors.',
        category: 'Financial',
        location_name: 'Ahmedabad, Gujarat',
        privacy_type: 'invite-only',
        member_count: 267,
        verified: true,
        trust_score: 4.4,
        admin_name: 'Business Incubator Hub',
        created_at: '2024-01-22T14:30:00Z',
        created_by: 'ngo-user-890',
        help_requests_count: 38,
        active_help_requests: 7,
        resolved_help_requests: 31,
        members: [
          { id: 'member-1', user_name: 'Business Incubator Hub', role: 'admin', status: 'active', joined_at: '2024-01-22T14:30:00Z' },
          { id: 'member-2', user_name: 'Startup Mentor Ravi', role: 'moderator', status: 'active', joined_at: '2024-01-23T11:15:00Z' },
          { id: 'member-3', user_name: 'Investor Neha', role: 'member', status: 'active', joined_at: '2024-01-25T16:30:00Z' }
        ]
      },
      'COMM-JAIPUR-EMO-009': {
        id: 'COMM-JAIPUR-EMO-009',
        name: 'Jaipur Senior Citizens Care',
        description: 'Providing companionship, health monitoring, and assistance services for elderly community members. Our volunteers help with daily activities and provide emotional support.',
        category: 'Emotional',
        location_name: 'Jaipur, Rajasthan',
        privacy_type: 'public',
        member_count: 378,
        verified: true,
        trust_score: 4.6,
        admin_name: 'Golden Years Foundation',
        created_at: '2024-01-25T10:15:00Z',
        created_by: 'ngo-user-123',
        help_requests_count: 62,
        active_help_requests: 9,
        resolved_help_requests: 53,
        members: [
          { id: 'member-1', user_name: 'Golden Years Foundation', role: 'admin', status: 'active', joined_at: '2024-01-25T10:15:00Z' },
          { id: 'member-2', user_name: 'Volunteer Coordinator Meera', role: 'moderator', status: 'active', joined_at: '2024-01-26T14:00:00Z' },
          { id: 'member-3', user_name: 'Caregiver Sunita', role: 'member', status: 'active', joined_at: '2024-01-28T09:30:00Z' }
        ]
      },
      'COMM-COIMBATORE-EDU-010': {
        id: 'COMM-COIMBATORE-EDU-010',
        name: 'Coimbatore Tech Skills Development',
        description: 'Bridging the digital divide by teaching programming, digital literacy, and technical skills to underserved youth. Free coding bootcamps and computer training programs.',
        category: 'Educational',
        location_name: 'Coimbatore, Tamil Nadu',
        privacy_type: 'public',
        member_count: 523,
        verified: true,
        trust_score: 4.3,
        admin_name: 'Tech For Change Initiative',
        created_at: '2024-01-28T16:20:00Z',
        created_by: 'ngo-user-456',
        help_requests_count: 71,
        active_help_requests: 11,
        resolved_help_requests: 60,
        members: [
          { id: 'member-1', user_name: 'Tech For Change Initiative', role: 'admin', status: 'active', joined_at: '2024-01-28T16:20:00Z' },
          { id: 'member-2', user_name: 'Software Engineer Arun', role: 'moderator', status: 'active', joined_at: '2024-01-29T10:45:00Z' },
          { id: 'member-3', user_name: 'UI/UX Designer Kavitha', role: 'member', status: 'active', joined_at: '2024-01-31T15:20:00Z' }
        ]
      },
      'COMM-LUCKNOW-MED-011': {
        id: 'COMM-LUCKNOW-MED-011',
        name: 'Lucknow Healthcare Volunteers',
        description: 'Volunteer healthcare professionals providing free medical checkups, health awareness campaigns, and emergency medical support in underserved areas of Lucknow.',
        category: 'Medical',
        location_name: 'Lucknow, Uttar Pradesh',
        privacy_type: 'public',
        member_count: 156,
        verified: true,
        trust_score: 4.5,
        admin_name: 'Dr. Kavita Singh',
        created_at: '2024-02-01T09:00:00Z',
        created_by: 'individual-user-789',
        help_requests_count: 28,
        active_help_requests: 4,
        resolved_help_requests: 24,
        members: [
          { id: 'member-1', user_name: 'Dr. Kavita Singh', role: 'admin', status: 'active', joined_at: '2024-02-01T09:00:00Z' },
          { id: 'member-2', user_name: 'Nurse Coordinator Pooja', role: 'moderator', status: 'active', joined_at: '2024-02-02T11:30:00Z' },
          { id: 'member-3', user_name: 'Health Worker Amit', role: 'member', status: 'active', joined_at: '2024-02-04T14:45:00Z' }
        ]
      },
      'COMM-BHOPAL-NGO-012': {
        id: 'COMM-BHOPAL-NGO-012',
        name: 'Bhopal Environmental Action Group',
        description: 'Working towards environmental conservation, clean water initiatives, and sustainable living practices. Join us for tree plantation drives, clean-up campaigns, and eco-awareness programs.',
        category: 'NGO',
        location_name: 'Bhopal, Madhya Pradesh',
        privacy_type: 'public',
        member_count: 734,
        verified: true,
        trust_score: 4.4,
        admin_name: 'Green Earth Foundation',
        created_at: '2024-02-03T11:45:00Z',
        created_by: 'ngo-user-567',
        help_requests_count: 95,
        active_help_requests: 16,
        resolved_help_requests: 79,
        members: [
          { id: 'member-1', user_name: 'Green Earth Foundation', role: 'admin', status: 'active', joined_at: '2024-02-03T11:45:00Z' },
          { id: 'member-2', user_name: 'Environmental Scientist Dr. Sharma', role: 'moderator', status: 'active', joined_at: '2024-02-04T09:20:00Z' },
          { id: 'member-3', user_name: 'Tree Plantation Lead Rahul', role: 'member', status: 'active', joined_at: '2024-02-06T16:15:00Z' }
        ]
      },
      'COMM-DELHI-FOOD-013': {
        id: 'COMM-DELHI-FOOD-013',
        name: 'Delhi Food Distribution Network',
        description: 'Providing daily meals to underprivileged families, homeless individuals, and students. Our volunteers distribute nutritious food across Delhi NCR with focus on zero waste and dignity.',
        category: 'Food',
        location_name: 'Delhi NCR',
        privacy_type: 'public',
        member_count: 892,
        verified: true,
        trust_score: 4.6,
        admin_name: 'Hunger Relief Society',
        created_at: '2024-01-28T15:20:00Z',
        created_by: 'ngo-user-789',
        help_requests_count: 156,
        active_help_requests: 24,
        resolved_help_requests: 132,
        members: [
          { id: 'member-1', user_name: 'Hunger Relief Society', role: 'admin', status: 'active', joined_at: '2024-01-28T15:20:00Z' },
          { id: 'member-2', user_name: 'Food Coordinator Rahul', role: 'moderator', status: 'active', joined_at: '2024-01-29T10:00:00Z' },
          { id: 'member-3', user_name: 'Volunteer Preeti', role: 'member', status: 'active', joined_at: '2024-01-30T14:30:00Z' },
          { id: 'member-4', user_name: 'Driver Vikash', role: 'member', status: 'active', joined_at: '2024-02-01T09:15:00Z' }
        ]
      },
      'COMM-HYDERABAD-FOOD-014': {
        id: 'COMM-HYDERABAD-FOOD-014',
        name: 'Hyderabad Community Kitchen',
        description: 'Operating community kitchens in slum areas and providing food assistance during emergencies. We also run nutrition programs for pregnant mothers and children.',
        category: 'Food',
        location_name: 'Hyderabad, Telangana',
        privacy_type: 'public',
        member_count: 567,
        verified: true,
        trust_score: 4.7,
        admin_name: 'Annapurna Foundation',
        created_at: '2024-02-01T12:30:00Z',
        created_by: 'ngo-user-234',
        help_requests_count: 89,
        active_help_requests: 14,
        resolved_help_requests: 75,
        members: [
          { id: 'member-1', user_name: 'Annapurna Foundation', role: 'admin', status: 'active', joined_at: '2024-02-01T12:30:00Z' },
          { id: 'member-2', user_name: 'Kitchen Manager Sita', role: 'moderator', status: 'active', joined_at: '2024-02-02T08:45:00Z' },
          { id: 'member-3', user_name: 'Nutritionist Dr. Reddy', role: 'member', status: 'active', joined_at: '2024-02-03T16:20:00Z' },
          { id: 'member-4', user_name: 'Cook Volunteer Lakshmi', role: 'member', status: 'active', joined_at: '2024-02-04T11:00:00Z' }
        ]
      },
      'COMM-CHEN-FOOD-015': {
        id: 'COMM-CHEN-FOOD-015',
        name: 'Chennai Meal Sharing Circle',
        description: 'Connecting surplus food from events, restaurants, and homes with people in need. Our volunteers ensure fresh, quality food reaches the right beneficiaries quickly.',
        category: 'Food',
        location_name: 'Chennai, Tamil Nadu',
        privacy_type: 'public',
        member_count: 423,
        verified: true,
        trust_score: 4.5,
        admin_name: 'Share Food Initiative',
        created_at: '2024-02-05T09:45:00Z',
        created_by: 'ngo-user-345',
        help_requests_count: 67,
        active_help_requests: 10,
        resolved_help_requests: 57,
        members: [
          { id: 'member-1', user_name: 'Share Food Initiative', role: 'admin', status: 'active', joined_at: '2024-02-05T09:45:00Z' },
          { id: 'member-2', user_name: 'Food Rescue Coordinator Priya', role: 'moderator', status: 'active', joined_at: '2024-02-06T13:20:00Z' },
          { id: 'member-3', user_name: 'Restaurant Partner Manager Karthik', role: 'member', status: 'active', joined_at: '2024-02-08T11:00:00Z' }
        ]
      },
      'COMM-PUNE-FOOD-016': {
        id: 'COMM-PUNE-FOOD-016',
        name: 'Pune Zero Hunger Network',
        description: 'Working towards eliminating hunger in Pune through sustainable food systems, urban farming, and community fridges. Volunteers can contribute meals, money, or time.',
        category: 'Food',
        location_name: 'Pune, Maharashtra',
        privacy_type: 'public',
        member_count: 678,
        verified: true,
        trust_score: 4.4,
        admin_name: 'Zero Hunger Collective',
        created_at: '2024-02-08T14:15:00Z',
        created_by: 'ngo-user-678',
        help_requests_count: 84,
        active_help_requests: 13,
        resolved_help_requests: 71,
        members: [
          { id: 'member-1', user_name: 'Zero Hunger Collective', role: 'admin', status: 'active', joined_at: '2024-02-08T14:15:00Z' },
          { id: 'member-2', user_name: 'Community Fridge Manager Anita', role: 'moderator', status: 'active', joined_at: '2024-02-09T10:30:00Z' },
          { id: 'member-3', user_name: 'Urban Farming Expert Rajesh', role: 'member', status: 'active', joined_at: '2024-02-11T15:45:00Z' }
        ]
      },
      'COMM-BANG-MED-017': {
        id: 'COMM-BANG-MED-017',
        name: 'Bangalore Emergency Medical Support',
        description: 'Round-the-clock emergency medical assistance, ambulance coordination, and first aid training. Our network includes doctors, paramedics, and trained volunteers.',
        category: 'Medical',
        location_name: 'Bangalore, Karnataka',
        privacy_type: 'public',
        member_count: 789,
        verified: true,
        trust_score: 4.8,
        admin_name: 'Dr. Suresh Menon',
        created_at: '2024-02-10T08:30:00Z',
        created_by: 'individual-user-901',
        help_requests_count: 123,
        active_help_requests: 19,
        resolved_help_requests: 104,
        members: [
          { id: 'member-1', user_name: 'Dr. Suresh Menon', role: 'admin', status: 'active', joined_at: '2024-02-10T08:30:00Z' },
          { id: 'member-2', user_name: 'Paramedic Chief Lakshmi', role: 'moderator', status: 'active', joined_at: '2024-02-11T12:15:00Z' },
          { id: 'member-3', user_name: 'First Aid Trainer Vivek', role: 'member', status: 'active', joined_at: '2024-02-13T09:20:00Z' }
        ]
      },
      'COMM-GURGAON-EDU-018': {
        id: 'COMM-GURGAON-EDU-018',
        name: 'Gurgaon Skill Development Hub',
        description: 'Empowering youth and adults with digital skills, vocational training, and job placement assistance. Free courses in coding, digital marketing, and entrepreneurship.',
        category: 'Educational',
        location_name: 'Gurgaon, Haryana',
        privacy_type: 'public',
        member_count: 445,
        verified: true,
        trust_score: 4.3,
        admin_name: 'Skill India Initiative',
        created_at: '2024-02-12T16:00:00Z',
        created_by: 'ngo-user-012',
        help_requests_count: 58,
        active_help_requests: 9,
        resolved_help_requests: 49,
        members: [
          { id: 'member-1', user_name: 'Skill India Initiative', role: 'admin', status: 'active', joined_at: '2024-02-12T16:00:00Z' },
          { id: 'member-2', user_name: 'Digital Marketing Expert Neha', role: 'moderator', status: 'active', joined_at: '2024-02-13T11:45:00Z' },
          { id: 'member-3', user_name: 'Coding Instructor Arjun', role: 'member', status: 'active', joined_at: '2024-02-15T14:30:00Z' }
        ]
      },
      'COMM-KANPUR-FIN-019': {
        id: 'COMM-KANPUR-FIN-019',
        name: 'Kanpur Microfinance Support Group',
        description: 'Providing microloans, financial literacy, and business mentorship to small entrepreneurs and women self-help groups in Kanpur and surrounding areas.',
        category: 'Financial',
        location_name: 'Kanpur, Uttar Pradesh',
        privacy_type: 'public',
        member_count: 234,
        verified: true,
        trust_score: 4.2,
        admin_name: 'Economic Empowerment Trust',
        created_at: '2024-02-15T10:20:00Z',
        created_by: 'ngo-user-345',
        help_requests_count: 41,
        active_help_requests: 6,
        resolved_help_requests: 35,
        members: [
          { id: 'member-1', user_name: 'Economic Empowerment Trust', role: 'admin', status: 'active', joined_at: '2024-02-15T10:20:00Z' },
          { id: 'member-2', user_name: 'Microfinance Officer Priya', role: 'moderator', status: 'active', joined_at: '2024-02-16T09:30:00Z' },
          { id: 'member-3', user_name: 'Business Mentor Ramesh', role: 'member', status: 'active', joined_at: '2024-02-18T13:15:00Z' }
        ]
      }
    };

    return communityMap[id] || {
      id: id,
      name: 'Community Details',
      description: 'This is a community that helps people connect and support each other.',
      category: 'Medical',
      location_name: 'India',
      privacy_type: 'public',
      member_count: 100,
      verified: false,
      trust_score: 4.0,
      admin_name: 'Community Admin',
      created_at: '2024-01-01T00:00:00Z',
      created_by: 'admin-user',
      help_requests_count: 25,
      active_help_requests: 5,
      resolved_help_requests: 20,
      members: [
        { id: 'member-1', user_name: 'Community Admin', role: 'admin', status: 'active', joined_at: '2024-01-01T00:00:00Z' }
      ]
    };
  };

  const mockCommunity = getMockCommunity(communityId);
  const [community, setCommunity] = useState<Community | null>(mockCommunity);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userMembership, setUserMembership] = useState<CommunityMember | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const currentMockCommunity = getMockCommunity(communityId);
    
    // Set mock data immediately
    setCommunity(currentMockCommunity);
    
    // Check if user is a member in mock data
    const userMember = currentMockCommunity.members?.find(
      (member: CommunityMember) => member.user_name === userProfile?.name
    );
    setUserMembership(userMember || null);

    // Try to fetch from API in background
    const fetchCommunityDetails = async () => {
      try {
        setError(null);

        const response = await communitiesApi.getDetails(communityId);
        if (response.community) {
          setCommunity(response.community);
          
          // Check if user is a member
          const apiUserMember = response.community.members?.find(
            (member: CommunityMember) => member.user_name === userProfile?.name
          );
          setUserMembership(apiUserMember || null);
        }
      } catch (apiError) {
        console.log('API not available, using mock community data:', communityId);
        // Don't set error when we have valid mock data - this allows demo features to work
        setError(null);
        // Keep existing mock data
      }
    };

    fetchCommunityDetails();
  }, [communityId, userProfile]);

  const handleJoinCommunity = async () => {
    if (!community) return;

    setIsJoining(true);
    
    try {
      // Try to call API, but always fallback to mock behavior gracefully
      try {
        await communitiesApi.join(community.id);
        // If API succeeds, show success message
        toast.success(`Successfully ${community.privacy_type === 'public' ? 'joined' : 'requested to join'} ${community.name}!`);
      } catch (apiError) {
        // API failed (expected in demo mode), simulate successful join
        console.log('API not available, simulating community join for demo');
        toast.success(`Successfully ${community.privacy_type === 'public' ? 'joined' : 'requested to join'} ${community.name}!`, {
          description: 'Demo Mode - Your membership has been simulated'
        });
      }
      
      // Always update local state for demo purposes
      if (community.privacy_type === 'public') {
        setUserMembership({
          id: 'new-member',
          user_name: userProfile?.name || 'You',
          role: 'member',
          status: 'active',
          joined_at: new Date().toISOString()
        });
        setCommunity(prev => prev ? { ...prev, member_count: prev.member_count + 1 } : null);
      } else {
        // For private/invite-only communities, show pending status
        setUserMembership({
          id: 'pending-member',
          user_name: userProfile?.name || 'You',
          role: 'member',
          status: 'pending',
          joined_at: new Date().toISOString()
        });
      }
    } catch (error) {
      // This should only catch unexpected errors, not API failures
      console.error('Unexpected error in community join:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!community || !userMembership) return;

    if (confirm(`Are you sure you want to leave ${community.name}?`)) {
      try {
        // Try API call, fallback to demo behavior
        try {
          await communitiesApi.leave(community.id);
          toast.success(`You have left ${community.name}`);
        } catch (apiError) {
          console.log('API not available, simulating community leave for demo');
          toast.success(`You have left ${community.name}`, {
            description: 'Demo Mode - Action has been simulated'
          });
        }
        
        // Always update local state for demo
        setUserMembership(null);
        setCommunity(prev => prev ? { ...prev, member_count: Math.max(0, prev.member_count - 1) } : null);
      } catch (error) {
        console.error('Unexpected error leaving community:', error);
        toast.error('An unexpected error occurred. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f9fefa' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg" 
                 style={{ backgroundColor: '#41695e' }}>
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600">Loading community details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f9fefa' }}>
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage('communities')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Communities
          </Button>
          
          <Card className="text-center py-12">
            <CardContent>
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg text-gray-900 mb-2">Community not found</h3>
              <p className="text-gray-600 mb-4">
                {error || 'The community you\'re looking for doesn\'t exist or you don\'t have access to it.'}
              </p>
              <Button onClick={() => setCurrentPage('communities')}>
                Browse Communities
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const CategoryIcon = categoryConfig[community.category as keyof typeof categoryConfig]?.icon || Users;
  const privacySettings = privacyConfig[community.privacy_type];
  const isMember = !!userMembership;
  const isAdmin = userMembership?.role === 'admin';

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f9fefa' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage('communities')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Communities
          </Button>
          
          {/* Demo Data Indicator */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Demo Mode:</span> Displaying sample community data. 
                  This demonstrates how community details work with rich member profiles, help request statistics, and interactive features.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Community Header */}
        <Card className="mb-8 shadow-sm border-0">
          <CardHeader className="pb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-start space-x-4 flex-1">
                <div 
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: categoryConfig[community.category as keyof typeof categoryConfig]?.bgColor || '#e8f5f0' }}
                >
                  <CategoryIcon className="h-8 w-8" style={{ color: '#41695e' }} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <CardTitle className="text-2xl" style={{ color: '#033b4a' }}>
                      {community.name}
                    </CardTitle>
                    {community.verified && (
                      <Shield className="h-6 w-6 text-blue-500" />
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge className={categoryConfig[community.category as keyof typeof categoryConfig]?.color || 'bg-gray-100 text-gray-800'}>
                      {community.category}
                    </Badge>
                    <div className={`flex items-center space-x-1 px-3 py-1 rounded-lg ${privacySettings.bgColor}`}>
                      <privacySettings.icon className="h-4 w-4" />
                      <span className={`text-sm font-medium ${privacySettings.color}`}>
                        {privacySettings.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{community.trust_score}</span>
                      <span>({community.member_count} reviews)</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {community.description}
                  </p>
                  
                  {/* Demo Data Showcase */}
                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium text-blue-700">✨ Demo Features:</span> This community showcases 
                        real-time member management, help request tracking ({community.help_requests_count} total), 
                        role-based permissions ({community.members?.filter(m => m.role === 'admin').length} admin, {community.members?.filter(m => m.role === 'moderator').length} moderator, {community.members?.filter(m => m.role === 'member').length} members), 
                        and community analytics with {Math.round(((community.resolved_help_requests || 0) / (community.help_requests_count || 1)) * 100)}% help success rate.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{community.location_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{community.member_count} members</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col space-y-3 lg:w-48">
                {!isMember ? (
                  <Button 
                    onClick={handleJoinCommunity}
                    disabled={isJoining}
                    className="w-full"
                    style={{ backgroundColor: '#41695e' }}
                  >
                    {isJoining ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    {community.privacy_type === 'public' ? 'Join Community' : 'Request to Join'}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Badge className="w-full justify-center py-2 bg-green-100 text-green-800">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {userMembership.role === 'admin' ? 'Admin' : 
                       userMembership.role === 'moderator' ? 'Moderator' : 'Member'}
                    </Badge>
                    {isAdmin && (
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleLeaveCommunity}
                      className="w-full text-red-600 hover:text-red-700"
                    >
                      Leave Community
                    </Button>
                  </div>
                )}
                
                <Button variant="outline" size="sm" className="w-full">
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Community Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Community Stats */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle style={{ color: '#033b4a' }}>Community Stats</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      Live Data (Demo)
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg shadow-sm border-l-4 border-l-green-500" style={{ backgroundColor: '#f9fefa' }}>
                      <div className="text-2xl font-bold" style={{ color: '#41695e' }}>
                        {community.member_count.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Members</div>
                      <div className="text-xs text-green-600 mt-1">↗ +12 this week</div>
                    </div>
                    <div className="text-center p-4 rounded-lg shadow-sm border-l-4 border-l-blue-500" style={{ backgroundColor: '#f9fefa' }}>
                      <div className="text-2xl font-bold" style={{ color: '#41695e' }}>
                        {community.help_requests_count || 0}
                      </div>
                      <div className="text-sm text-gray-600">Help Requests</div>
                      <div className="text-xs text-blue-600 mt-1">Total handled</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                      <div className="text-xl font-bold text-green-600">
                        {community.active_help_requests || 0}
                      </div>
                      <div className="text-sm text-gray-600">Currently Active</div>
                      <div className="w-full bg-green-200 rounded-full h-1.5 mt-2">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-xl font-bold text-blue-600">
                        {community.resolved_help_requests || 0}
                      </div>
                      <div className="text-sm text-gray-600">Successfully Resolved</div>
                      <div className="text-xs text-blue-600 mt-1">
                        {Math.round(((community.resolved_help_requests || 0) / (community.help_requests_count || 1)) * 100)}% success rate
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Community Health</span>
                      <span className="font-medium text-green-600">Excellent</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Activity Level</span>
                      <span className="font-medium text-blue-600">High</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Response Time</span>
                      <span className="font-medium text-green-600">&lt; 2 hours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle style={{ color: '#033b4a' }}>Recent Activity</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      Live Updates
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2 animate-pulse"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium text-green-600">✓ Help request fulfilled:</span> Emergency {community.category.toLowerCase()} aid
                        </p>
                        <p className="text-xs text-gray-500">by {community.members?.[1]?.user_name || 'Volunteer'} • 2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium text-blue-600">📝 New help request:</span> {community.category} support needed
                        </p>
                        <p className="text-xs text-gray-500">Priority: Medium • 5 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium text-orange-600">👥 Community growth:</span> 3 new members joined
                        </p>
                        <p className="text-xs text-gray-500">Total: {community.member_count} members • 8 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium text-purple-600">📋 Admin update:</span> {community.admin_name} posted guidelines
                        </p>
                        <p className="text-xs text-gray-500">Community governance • 1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium text-green-600">✅ Success story:</span> Volunteer support completed
                        </p>
                        <p className="text-xs text-gray-500">Impact score +5 • 2 days ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <Button variant="ghost" size="sm" className="w-full text-sm text-gray-600">
                      View All Activity ({Math.floor(community.member_count / 10)} more updates)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <Card className="shadow-sm border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle style={{ color: '#033b4a' }}>
                    Community Members ({community.members?.length || 0})
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {community.members?.filter(m => m.status === 'active').length || 0} Active
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Sample Profiles
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  These are sample member profiles showing different roles and membership statuses in our community system.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {community.members?.map((member, index) => (
                    <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: '#f9fefa' }}>
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback 
                            style={{ 
                              backgroundColor: member.role === 'admin' ? '#41695e' : 
                                             member.role === 'moderator' ? '#2563eb' : '#6b7280',
                              color: 'white' 
                            }}
                          >
                            {member.user_name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium" style={{ color: '#033b4a' }}>
                              {member.user_name}
                            </p>
                            {member.role === 'admin' && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                            {member.role === 'moderator' && (
                              <Shield className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <Badge 
                              className={
                                member.role === 'admin' ? 'bg-green-100 text-green-800' :
                                member.role === 'moderator' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {member.role}
                            </Badge>
                            <span>•</span>
                            <span>Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="text-green-600">
                              {Math.floor(Math.random() * 20) + 1} contributions
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        <Badge 
                          className={
                            member.status === 'active' ? 'bg-green-100 text-green-800' :
                            member.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }
                        >
                          {member.status}
                        </Badge>
                        <div className="text-xs text-gray-500">
                          Last active: {Math.floor(Math.random() * 7) + 1}d ago
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show "load more" hint for demo */}
                  <div className="text-center py-6 border-t border-gray-200">
                    <p className="text-sm text-gray-500 mb-2">
                      Showing {community.members?.length || 0} of {community.member_count} total members
                    </p>
                    <Button variant="outline" size="sm" disabled>
                      Load More Members
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle style={{ color: '#033b4a' }}>Community Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Activity feed will be available soon.</p>
                  <p className="text-sm mt-2">This will show help requests, events, and community discussions.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle style={{ color: '#033b4a' }}>About This Community</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2" style={{ color: '#033b4a' }}>Description</h4>
                  <p className="text-gray-700 leading-relaxed">{community.description}</p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2" style={{ color: '#033b4a' }}>Community Guidelines</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Be respectful and supportive to all members</li>
                    <li>• Keep posts relevant to the community's purpose</li>
                    <li>• No spam, promotional content, or inappropriate material</li>
                    <li>• Protect member privacy and confidentiality</li>
                    <li>• Report any concerns to community moderators</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2" style={{ color: '#033b4a' }}>Contact Information</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Community Admin: {community.admin_name}</p>
                    <p>Category: {community.category}</p>
                    <p>Location: {community.location_name}</p>
                    <p>Created: {new Date(community.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Community Action Navigation - Only visible for members */}
        {isMember && (
          <div className="mt-8">
            <Card className="shadow-sm border-0" style={{ backgroundColor: '#e8f5f0' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium" style={{ color: '#033b4a' }}>Community Actions</h3>
                    <p className="text-sm text-gray-600">Post requests or manage your community help requests</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {community.active_help_requests} active • {community.resolved_help_requests} resolved
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => {
                      // Navigate to community-specific help request form
                      setCurrentPage('request-help');
                    }}
                    className="w-full h-12 flex items-center justify-center space-x-3"
                    style={{ backgroundColor: '#41695e' }}
                  >
                    <Plus className="h-5 w-5" />
                    <span>Post Help Request in Community</span>
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      // Navigate to manage community help requests
                      setCurrentPage('tracking');
                    }}
                    variant="outline"
                    className="w-full h-12 flex items-center justify-center space-x-3"
                    style={{ borderColor: '#41695e', color: '#41695e' }}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Manage Your Requests</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}