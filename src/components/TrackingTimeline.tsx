import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  Bell,
  Eye,
  FileText,
  IndianRupee
} from 'lucide-react';

interface TrackingTimelineProps {
  requestId?: string;
}

export function TrackingTimeline({ requestId = 'HR-001' }: TrackingTimelineProps) {
  const [selectedRequest, setSelectedRequest] = useState(requestId);

  // Mock data - in real app this would come from API
  const mockRequest = {
    id: 'HR-001',
    title: 'Medical assistance for heart surgery',
    description: 'Need financial help for my father\'s heart surgery. He requires urgent medical attention and the family cannot afford the treatment cost.',
    category: 'Medical & Healthcare',
    urgency: 'critical',
    amount: 250000,
    amountRaised: 175000,
    location: 'Mumbai, Maharashtra',
    requester: {
      name: 'Priya Sharma',
      phone: '+91 98765 43210',
      email: 'priya.sharma@email.com',
      verified: true
    },
    status: 'in_progress',
    createdAt: '2024-01-15T10:30:00Z',
    timeline: [
      {
        id: 1,
        type: 'submitted',
        title: 'Request Submitted',
        description: 'Help request submitted for review',
        timestamp: '2024-01-15T10:30:00Z',
        status: 'completed',
        actor: 'Priya Sharma',
        details: 'Request submitted with all required documents'
      },
      {
        id: 2,
        type: 'verification',
        title: 'Document Verification',
        description: 'Documents and identity verified by our team',
        timestamp: '2024-01-15T14:45:00Z',
        status: 'completed',
        actor: 'Sahaaya Verification Team',
        details: 'Medical reports and ID proof verified successfully'
      },
      {
        id: 3,
        type: 'published',
        title: 'Request Published',
        description: 'Request is now visible to potential helpers',
        timestamp: '2024-01-15T16:00:00Z',
        status: 'completed',
        actor: 'System',
        details: 'Request published on platform for donors to see'
      },
      {
        id: 4,
        type: 'first_response',
        title: 'First Response Received',
        description: 'First helper showed interest in your request',
        timestamp: '2024-01-15T18:30:00Z',
        status: 'completed',
        actor: 'Rajesh Kumar',
        details: 'Donor offered ₹25,000 for medical assistance'
      },
      {
        id: 5,
        type: 'matching',
        title: 'Multiple Helpers Matched',
        description: '8 helpers have committed to provide assistance',
        timestamp: '2024-01-16T09:15:00Z',
        status: 'completed',
        actor: 'System',
        details: 'Total commitment received: ₹175,000 from 8 donors'
      },
      {
        id: 6,
        type: 'funding',
        title: 'Funds Being Transferred',
        description: 'Verified donors are transferring committed amounts',
        timestamp: '2024-01-16T14:20:00Z',
        status: 'in_progress',
        actor: 'Multiple Donors',
        details: '₹125,000 received, ₹50,000 pending transfer'
      },
      {
        id: 7,
        type: 'milestone',
        title: 'Target Almost Reached',
        description: 'Only ₹75,000 more needed to reach the target',
        timestamp: '2024-01-17T11:00:00Z',
        status: 'pending',
        actor: 'System',
        details: 'Request gaining traction with more potential donors'
      },
      {
        id: 8,
        type: 'completion',
        title: 'Request Completed',
        description: 'All required funds have been collected',
        timestamp: null,
        status: 'pending',
        actor: 'Pending',
        details: 'Awaiting full fund collection'
      }
    ],
    helpers: [
      {
        name: 'Rajesh Kumar',
        amount: 25000,
        type: 'individual',
        verified: true,
        message: 'Happy to help with medical expenses. Get well soon!'
      },
      {
        name: 'Helping Hands NGO',
        amount: 50000,
        type: 'organization',
        verified: true,
        message: 'Our organization is committed to healthcare support.'
      },
      {
        name: 'Dr. Sarah Medical Fund',
        amount: 75000,
        type: 'organization',
        verified: true,
        message: 'Medical fund specifically for heart surgeries.'
      },
      {
        name: 'Anonymous Donor',
        amount: 25000,
        type: 'individual',
        verified: true,
        message: 'Wishing you and your father all the best.'
      }
    ],
    updates: [
      {
        id: 1,
        message: 'Surgery date has been scheduled for January 25th, 2024. Thank you to all the donors for their support!',
        timestamp: '2024-01-17T15:30:00Z',
        author: 'Priya Sharma'
      },
      {
        id: 2,
        message: 'Additional medical tests completed. Doctors are optimistic about the surgery outcome.',
        timestamp: '2024-01-16T20:15:00Z',
        author: 'Priya Sharma'
      }
    ]
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDate = (timestamp: string | null) => {
    if (!timestamp) return 'Pending';
    return new Date(timestamp).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = () => {
    return Math.round((mockRequest.amountRaised / mockRequest.amount) * 100);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f9fefa' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl mb-4" style={{ color: '#033b4a' }}>
            Request Tracking
          </h1>
          <p className="text-lg text-gray-600">
            Track the status and progress of your help request in real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Timeline */}
          <div className="lg:col-span-2 space-y-8">
            {/* Request Summary */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0">
                  <div className="space-y-2">
                    <CardTitle style={{ color: '#033b4a' }}>{mockRequest.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">#{mockRequest.id}</Badge>
                      <Badge className="bg-red-100 text-red-800">Critical</Badge>
                      <Badge variant="outline">{mockRequest.category}</Badge>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-2xl" style={{ color: '#41695e' }}>
                      ₹{mockRequest.amountRaised.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      of ₹{mockRequest.amount.toLocaleString()} ({getProgressPercentage()}%)
                    </div>
                    <div className="w-32 bg-gray-200 rounded-full h-2 ml-auto">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: '#41695e',
                          width: `${getProgressPercentage()}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{mockRequest.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{mockRequest.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {formatDate(mockRequest.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle style={{ color: '#033b4a' }}>Progress Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockRequest.timeline.map((event, index) => (
                    <div key={event.id} className="flex space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="flex-shrink-0">
                          {getStatusIcon(event.status)}
                        </div>
                        {index < mockRequest.timeline.length - 1 && (
                          <div className={`w-px h-16 mt-2 ${event.status === 'completed' ? 'bg-green-300' : 'bg-gray-300'}`}></div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <h4 style={{ color: '#033b4a' }}>{event.title}</h4>
                          <span className="text-sm text-gray-500">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-600">{event.description}</p>
                        <div className="text-sm text-gray-500">
                          <span>By: {event.actor}</span>
                          {event.details && (
                            <span className="block mt-1">{event.details}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Updates */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle style={{ color: '#033b4a' }}>Recent Updates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRequest.updates.map((update) => (
                  <div key={update.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span className="text-sm" style={{ color: '#033b4a' }}>{update.author}</span>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(update.timestamp)}</span>
                    </div>
                    <p className="text-gray-700">{update.message}</p>
                  </div>
                ))}
                
                <div className="pt-4">
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle style={{ color: '#033b4a' }}>Requester Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#41695e' }}>
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span style={{ color: '#033b4a' }}>{mockRequest.requester.name}</span>
                      {mockRequest.requester.verified && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <span className="text-sm text-gray-600">Verified User</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{mockRequest.requester.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{mockRequest.requester.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{mockRequest.location}</span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Helpers */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle style={{ color: '#033b4a' }}>Current Helpers ({mockRequest.helpers.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRequest.helpers.map((helper, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm" style={{ color: '#033b4a' }}>{helper.name}</span>
                        {helper.verified && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ₹{helper.amount.toLocaleString()}
                      </Badge>
                    </div>
                    {helper.message && (
                      <p className="text-xs text-gray-600 italic">"{helper.message}"</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle style={{ color: '#033b4a' }}>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  Notification Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="h-4 w-4 mr-2" />
                  View Public Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}