import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { 
  Bell,
  Heart,
  Users,
  HandHeart,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Eye,
  MessageCircle,
  IndianRupee,
  MapPin,
  Calendar
} from 'lucide-react';

interface NotificationsProps {
  userRole?: 'individual' | 'ngo';
  setCurrentPage?: (page: string) => void;
}

interface Notification {
  id: string;
  type: 'match' | 'donation' | 'message' | 'update' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  actionData?: {
    requestId?: string;
    campaignId?: string;
    amount?: number;
    location?: string;
  };
}

export function Notifications({ userRole = 'individual', setCurrentPage }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Mock real-time notifications
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'match',
        title: 'New Match Found!',
        message: 'A volunteer has offered help for your medical assistance request.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        read: false,
        priority: 'high',
        actionData: {
          requestId: 'HR-001',
          location: 'Mumbai, Maharashtra'
        }
      },
      {
        id: '2',
        type: 'donation',
        title: 'New Donation Received',
        message: 'You received ₹5,000 donation for your education campaign.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        read: false,
        priority: 'high',
        actionData: {
          campaignId: 'CMP-001',
          amount: 5000
        }
      },
      {
        id: '3',
        type: 'message',
        title: 'New Message',
        message: 'Priya Sharma sent you a message regarding help request HR-002.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        read: false,
        priority: 'medium',
        actionData: {
          requestId: 'HR-002'
        }
      },
      {
        id: '4',
        type: 'update',
        title: 'Request Status Updated',
        message: 'Your help request "Medical assistance for surgery" is now in progress.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: true,
        priority: 'medium',
        actionData: {
          requestId: 'HR-001'
        }
      },
      {
        id: '5',
        type: 'system',
        title: 'Profile Verification Complete',
        message: 'Your profile has been successfully verified. You can now receive help requests.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        read: true,
        priority: 'low'
      }
    ];

    // Simulate different notifications based on user role
    if (userRole === 'ngo') {
      mockNotifications.push(
        {
          id: '6',
          type: 'donation',
          title: 'Campaign Milestone Reached',
          message: 'Your "Emergency Relief Fund" campaign has reached 75% of its target!',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          read: false,
          priority: 'high',
          actionData: {
            campaignId: 'CMP-003',
            amount: 375000
          }
        },
        {
          id: '7',
          type: 'match',
          title: 'New Volunteer Registered',
          message: '5 new volunteers have registered for your flood relief campaign.',
          timestamp: new Date(Date.now() - 45 * 60 * 1000),
          read: false,
          priority: 'medium',
          actionData: {
            campaignId: 'CMP-003'
          }
        }
      );
    }

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);

    // Simulate real-time updates
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance every 10 seconds
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: Math.random() > 0.5 ? 'match' : 'message',
          title: Math.random() > 0.5 ? 'New Match Available!' : 'New Message Received',
          message: Math.random() > 0.5 
            ? 'Someone nearby is offering help for a request similar to yours.'
            : 'You have received a new message from a helper.',
          timestamp: new Date(),
          read: false,
          priority: 'medium' as const,
          actionData: {
            requestId: `HR-${Math.floor(Math.random() * 1000)}`,
            location: 'Mumbai, Maharashtra'
          }
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [userRole]);

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = priority === 'high' ? 'text-red-500' : 
                     priority === 'medium' ? 'text-orange-500' : 'text-gray-500';
    
    switch (type) {
      case 'match':
        return <Heart className={`h-5 w-5 ${iconClass}`} />;
      case 'donation':
        return <IndianRupee className={`h-5 w-5 ${iconClass}`} />;
      case 'message':
        return <MessageCircle className={`h-5 w-5 ${iconClass}`} />;
      case 'update':
        return <Clock className={`h-5 w-5 ${iconClass}`} />;
      case 'system':
        return <CheckCircle className={`h-5 w-5 ${iconClass}`} />;
      default:
        return <Bell className={`h-5 w-5 ${iconClass}`} />;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleNotificationAction = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.type === 'match' && setCurrentPage) {
      setCurrentPage('matching');
    } else if (notification.type === 'donation' && setCurrentPage) {
      setCurrentPage('dashboard');
    } else if (notification.type === 'message' && setCurrentPage) {
      setCurrentPage('tracking');
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredNotifications = showOnlyUnread 
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#f9fefa' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl mb-2" style={{ color: '#033b4a' }}>
                Notifications
              </h1>
              <p className="text-lg text-gray-600">
                Stay updated with matches, messages, and important updates
              </p>
            </div>
            <div className="relative">
              <Bell className="h-8 w-8" style={{ color: '#41695e' }} />
              {unreadCount > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center p-0 text-xs"
                  style={{ backgroundColor: '#d4183d', color: 'white' }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-6 shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {filteredNotifications.length} notifications
                </span>
                {unreadCount > 0 && (
                  <Badge variant="outline" style={{ borderColor: '#41695e', color: '#41695e' }}>
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                >
                  {showOnlyUnread ? 'Show All' : 'Unread Only'}
                </Button>
                
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark All Read
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card className="text-center p-12 shadow-sm border-0">
                <CardContent className="space-y-4">
                  <Bell className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="text-xl text-gray-600">
                    {showOnlyUnread ? 'No unread notifications' : 'No notifications yet'}
                  </h3>
                  <p className="text-gray-500">
                    {showOnlyUnread 
                      ? 'All caught up! Check back later for new updates.'
                      : 'When you receive matches, messages, or updates, they\'ll appear here.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`shadow-sm border-0 cursor-pointer transition-all hover:shadow-md ${
                    !notification.read ? 'border-l-4' : ''
                  }`}
                  style={!notification.read ? { borderLeftColor: '#41695e' } : {}}
                  onClick={() => handleNotificationAction(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type, notification.priority)}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 
                              className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}
                              style={{ color: '#033b4a' }}
                            >
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2 ml-4">
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#41695e' }}></div>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          
                          {notification.actionData && (
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                              {notification.actionData.amount && (
                                <div className="flex items-center space-x-1">
                                  <IndianRupee className="h-3 w-3" />
                                  <span>₹{notification.actionData.amount.toLocaleString()}</span>
                                </div>
                              )}
                              {notification.actionData.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{notification.actionData.location}</span>
                                </div>
                              )}
                              {(notification.actionData.requestId || notification.actionData.campaignId) && (
                                <div className="flex items-center space-x-1">
                                  <Eye className="h-3 w-3" />
                                  <span>
                                    {notification.actionData.requestId || notification.actionData.campaignId}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <Card className="mt-6 shadow-sm border-0">
          <CardHeader>
            <CardTitle style={{ color: '#033b4a' }}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setCurrentPage && setCurrentPage('matching')}
                className="flex items-center space-x-2"
                style={{ backgroundColor: '#41695e' }}
              >
                <Heart className="h-4 w-4" />
                <span>Browse Requests</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage && setCurrentPage('dashboard')}
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Go to Dashboard</span>
              </Button>
              
              {userRole === 'individual' && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage && setCurrentPage('request-help')}
                  className="flex items-center space-x-2"
                >
                  <HandHeart className="h-4 w-4" />
                  <span>Create Request</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}