import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Activity, 
  User, 
  Heart, 
  Clock, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { 
  getCommunityActivityFeed, 
  subscribeToActivityFeed,
  unsubscribeChannel,
  type ActivityFeedEntry
} from '../../utils/supabaseService';
import { toast } from 'sonner@2.0.3';

interface CommunityActivityProps {
  communityId: string;
  communityName: string;
}

export function CommunityActivity({ communityId, communityName }: CommunityActivityProps) {
  const [activities, setActivities] = useState<ActivityFeedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch activity feed
  const fetchActivities = async (showRefreshToast = false) => {
    if (showRefreshToast) {
      setIsRefreshing(true);
    }

    try {
      const response = await getCommunityActivityFeed(communityId, 50);

      if (response.success && response.data) {
        setActivities(response.data);
        if (showRefreshToast) {
          toast.success('Activity feed refreshed');
        }
      } else {
        console.error('Error fetching activities:', response.error);
        if (!showRefreshToast) {
          toast.error(response.error || 'Failed to load activity feed');
        }
      }
    } catch (error) {
      console.error('Unexpected error fetching activities:', error);
      if (!showRefreshToast) {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchActivities();
  }, [communityId]);

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = subscribeToActivityFeed(
      communityId,
      (newActivity, eventType) => {
        if (eventType === 'INSERT') {
          setActivities(prev => [newActivity, ...prev]);
          // Show toast for new activity
          toast.success('New activity in the community!');
        }
      },
      (error) => {
        console.error('Activity feed subscription error:', error);
      }
    );

    return () => {
      unsubscribeChannel(subscription);
    };
  }, [communityId]);

  // Get icon and color for activity type
  const getActivityStyle = (actionType: string) => {
    switch (actionType) {
      case 'request_help':
        return {
          icon: <User className="h-4 w-4" />,
          bgColor: 'bg-blue-50',
          badgeColor: 'bg-blue-100 text-blue-800',
          label: 'Help Request'
        };
      case 'offer_help':
        return {
          icon: <Heart className="h-4 w-4" />,
          bgColor: 'bg-green-50',
          badgeColor: 'bg-green-100 text-green-800',
          label: 'Help Offered'
        };
      default:
        return {
          icon: <Activity className="h-4 w-4" />,
          bgColor: 'bg-gray-50',
          badgeColor: 'bg-gray-100 text-gray-800',
          label: 'Activity'
        };
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader style={{ backgroundColor: '#f9fefa', borderBottom: '1px solid #e5e7eb' }}>
          <CardTitle className="flex items-center space-x-2" style={{ color: '#033b4a' }}>
            <Activity className="h-5 w-5" />
            <span>Community Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader style={{ backgroundColor: '#f9fefa', borderBottom: '1px solid #e5e7eb' }}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2" style={{ color: '#033b4a' }}>
            <Activity className="h-5 w-5" />
            <span>Community Activity</span>
          </CardTitle>
          <button
            onClick={() => fetchActivities(true)}
            disabled={isRefreshing}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Refresh activity feed"
          >
            <RefreshCw className={`h-4 w-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => {
              const style = getActivityStyle(activity.action_type);
              const actorName = activity.user_profiles?.full_name || 
                               activity.user_profiles?.email || 
                               'A community member';

              return (
                <div
                  key={activity.id}
                  className={`p-4 rounded-lg border border-gray-200 ${style.bgColor} hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="p-2 rounded-full bg-white shadow-sm">
                        {style.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={style.badgeColor}>
                          {style.label}
                        </Badge>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimestamp(activity.created_at!)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {activity.message}
                      </p>
                      {activity.metadata?.request_title && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-600">
                            Request: <span className="font-medium">{activity.metadata.request_title}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg mb-2" style={{ color: '#033b4a' }}>
              No Activity Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Activity will appear here when members request or offer help in this community.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4 text-blue-500" />
                <span>Help requests</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4 text-green-500" />
                <span>Help offers</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
