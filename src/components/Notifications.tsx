import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner@2.0.3';
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
  Calendar,
  Phone,
  Mail
} from 'lucide-react';
import { 
  getNotifications, 
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToNotifications,
  unsubscribeChannel
} from '../utils/supabaseService';
import { supabase } from '../utils/auth';

interface NotificationsProps {
  userRole?: 'individual' | 'ngo';
  setCurrentPage?: (page: string) => void;
}

interface Notification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  type: string;
  title: string;
  content: string;
  is_read?: boolean;
  priority?: string;
  request_id?: string;
  offer_id?: string;
  sender_name?: string;
  sender_email?: string;
  sender_phone?: string;
  metadata?: any;
  created_at?: string;
  read_at?: string;
  // Computed fields for display
  message?: string;
  read?: boolean;
  timestamp?: Date;
  helper_name?: string;
  helper_phone?: string;
  helper_email?: string;
  seeker_name?: string;
  seeker_phone?: string;
  seeker_email?: string;
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
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notifications from Supabase
  const fetchNotifications = async () => {
    setIsLoading(true);
    
    try {
      const response = await getNotifications(false); // Get all notifications
      
      if (response.success && response.data) {
        // Transform Supabase notifications to match component interface
        const transformedNotifications = response.data.map(notif => ({
          ...notif,
          message: notif.content,
          read: notif.is_read || false,
          timestamp: notif.created_at ? new Date(notif.created_at) : new Date(),
          priority: notif.priority || 'medium',
          // Map sender details to helper/seeker fields based on notification type
          helper_name: notif.sender_name,
          helper_phone: notif.sender_phone,
          helper_email: notif.sender_email,
          seeker_name: notif.sender_name,
          seeker_phone: notif.sender_phone,
          seeker_email: notif.sender_email,
          actionData: notif.metadata
        }));
        
        setNotifications(transformedNotifications);
        
        // Get unread count
        const countResponse = await getUnreadNotificationCount();
        if (countResponse.success && countResponse.data !== undefined) {
          setUnreadCount(countResponse.data);
        }
      } else if (response.error) {
        console.error('Error loading notifications:', response.error);
        toast.error(response.error);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Load notifications and set up real-time subscriptions
  useEffect(() => {
    let subscription: any = null;

    const initNotifications = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch initial notifications
      await fetchNotifications();

      // Set up real-time subscription for new notifications
      subscription = subscribeToNotifications(
        user.id,
        (newNotification, eventType) => {
          console.log('Real-time notification event:', eventType, newNotification);
          
          if (eventType === 'INSERT') {
            // Transform and add new notification to the top of the list
            const transformedNotif = {
              ...newNotification,
              message: newNotification.content,
              read: newNotification.is_read || false,
              timestamp: newNotification.created_at ? new Date(newNotification.created_at) : new Date(),
              priority: newNotification.priority || 'medium',
              helper_name: newNotification.sender_name,
              helper_phone: newNotification.sender_phone,
              helper_email: newNotification.sender_email,
              seeker_name: newNotification.sender_name,
              seeker_phone: newNotification.sender_phone,
              seeker_email: newNotification.sender_email,
              actionData: newNotification.metadata
            };
            
            setNotifications(prev => [transformedNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show toast notification
            toast.success(newNotification.title, {
              description: newNotification.content,
              duration: 5000
            });
          } else if (eventType === 'UPDATE') {
            // Update existing notification
            setNotifications(prev => 
              prev.map(n => 
                n.id === newNotification.id 
                  ? {
                      ...n,
                      ...newNotification,
                      message: newNotification.content,
                      read: newNotification.is_read || false,
                      timestamp: n.timestamp // Keep original timestamp
                    }
                  : n
              )
            );
            
            // Update unread count
            if (newNotification.is_read) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          } else if (eventType === 'DELETE') {
            // Remove deleted notification
            setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
          }
        },
        (error) => {
          console.error('Real-time subscription error:', error);
        }
      );
    };

    initNotifications();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        unsubscribeChannel(subscription);
      }
    };
  }, []);

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = priority === 'high' ? 'text-red-500' : 
                     priority === 'medium' ? 'text-orange-500' : 'text-gray-500';
    

    switch (type) {
      case 'help_offer':
        return <Heart className={`h-5 w-5 ${iconClass}`} />;
      case 'help_accepted':
        return <CheckCircle className={`h-5 w-5 ${iconClass}`} />;
      case 'help_completed':
        return <HandHeart className={`h-5 w-5 ${iconClass}`} />;
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

  const markAsRead = async (id: string) => {
    try {
      const response = await markNotificationAsRead(id);
      
      if (response.success) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === id ? { ...n, read: true, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        console.error('Failed to mark notification as read:', response.error);
        toast.error('Failed to mark as read');
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await markAllNotificationsAsRead();
      
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true, is_read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      } else {
        console.error('Failed to mark all as read:', response.error);
        toast.error('Failed to mark all as read');
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotif = async (id: string) => {
    try {
      const notification = notifications.find(n => n.id === id);
      const response = await deleteNotification(id);
      
      if (response.success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        toast.success('Notification deleted');
      } else {
        console.error('Failed to delete notification:', response.error);
        toast.error('Failed to delete notification');
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
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
    } else if (notification.type === 'help_offer' && setCurrentPage) {
      // Navigate to dashboard to see help offers
      setCurrentPage('dashboard');
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

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-[#41695e] rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          </div>
        ) : (
          <>
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
                              {getNotificationIcon(notification.type, notification.priority || 'medium')}
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
                                    {formatTimestamp(notification.timestamp!)}
                                  </span>
                                  {!notification.read && (
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#41695e' }}></div>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-sm text-gray-600">{notification.message}</p>
                              
                              {/* Helper Contact Details (for help seekers) */}
                              {notification.type === 'help_offer' && notification.helper_name && (
                                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                  <h5 className="text-xs font-semibold text-green-900 mb-2">Helper Contact Details:</h5>
                                  <div className="space-y-1 text-xs text-green-800">
                                    {notification.helper_name && (
                                      <div className="flex items-center space-x-2">
                                        <Users className="h-3 w-3" />
                                        <span><strong>Name:</strong> {notification.helper_name}</span>
                                      </div>
                                    )}
                                    {notification.helper_phone && (
                                      <div className="flex items-center space-x-2">
                                        <Phone className="h-3 w-3" />
                                        <span><strong>Phone:</strong> {notification.helper_phone}</span>
                                      </div>
                                    )}
                                    {notification.helper_email && (
                                      <div className="flex items-center space-x-2">
                                        <Mail className="h-3 w-3" />
                                        <span><strong>Email:</strong> {notification.helper_email}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Seeker Contact Details (for helpers) */}
                              {notification.type === 'help_accepted' && notification.seeker_name && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <h5 className="text-xs font-semibold text-blue-900 mb-2">Seeker Contact Details:</h5>
                                  <div className="space-y-1 text-xs text-blue-800">
                                    {notification.seeker_name && (
                                      <div className="flex items-center space-x-2">
                                        <Users className="h-3 w-3" />
                                        <span><strong>Name:</strong> {notification.seeker_name}</span>
                                      </div>
                                    )}
                                    {notification.seeker_phone && (
                                      <div className="flex items-center space-x-2">
                                        <Phone className="h-3 w-3" />
                                        <span><strong>Phone:</strong> {notification.seeker_phone}</span>
                                      </div>
                                    )}
                                    {notification.seeker_email && (
                                      <div className="flex items-center space-x-2">
                                        <Mail className="h-3 w-3" />
                                        <span><strong>Email:</strong> {notification.seeker_email}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
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
                                deleteNotif(notification.id);
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
          </>
        )}

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
