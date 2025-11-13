import { supabase } from './auth';

/**
 * Supabase Service for Sahaaya Platform
 * Handles all database operations for help requests with proper user filtering
 */

export interface HelpRequest {
  id?: string;
  user_id?: string;
  category: string;
  title: string;
  description: string;
  urgency: string;
  amount_needed?: number;
  name: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  full_location?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  supporters?: number;
  created_at?: string;
  updated_at?: string;
}

export interface HelpOffer {
  id?: string;
  request_id: string;
  helper_id?: string;
  requester_id: string;
  message?: string;
  status?: string;
  helper_name?: string;
  helper_email?: string;
  helper_phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id?: string;
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
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Create a new help request
 * Automatically sets user_id to the logged-in user's auth.uid()
 */
export async function createHelpRequest(requestData: Omit<HelpRequest, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<HelpRequest>> {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated. Please log in to create a request.'
      };
    }

    // Check if user is an individual
    const userRole = user.user_metadata?.role;
    if (userRole !== 'individual') {
      return {
        success: false,
        error: 'Only Individual Users can submit help requests. NGO users should create campaigns instead.'
      };
    }

    // Insert the request with user_id automatically set
    const { data, error } = await supabase
      .from('help_requests')
      .insert([
        {
          ...requestData,
          user_id: user.id,
          status: 'pending',
          supporters: 0
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return {
        success: false,
        error: `Failed to create help request: ${error.message}`
      };
    }

    return {
      success: true,
      data,
      message: 'Help request created successfully'
    };
  } catch (err: any) {
    console.error('Unexpected error creating help request:', err);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Get help requests created by the current user (UNIFIED: Global + Community)
 * Uses the unified dashboard_my_requests VIEW (READ-ONLY)
 * Query: SELECT * FROM dashboard_my_requests WHERE user_id = auth.uid() ORDER BY created_at DESC
 */
export async function getMyRequests(): Promise<ServiceResponse<HelpRequest[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Query unified view (combines global + community requests)
    // Community data is embedded directly in the view (no join needed)
    const { data, error } = await supabase
      .from('dashboard_my_requests')
      .select(`
        id,
        title,
        description,
        category,
        amount,
        urgency,
        status,
        source_type,
        supporters,
        community_id,
        community_name,
        community_category,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false});

    if (error) {
      console.error('Error fetching my requests:', error);
      return {
        success: false,
        error: 'Failed to fetch your requests'
      };
    }

    return {
      success: true,
      data: data || [],
      message: data?.length === 0 ? 'No requests found' : undefined
    };
  } catch (err: any) {
    console.error('Unexpected error fetching my requests:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get all help requests EXCEPT those created by the current user
 * Query: SELECT * FROM help_requests WHERE user_id != auth.uid() ORDER BY created_at DESC
 * This is for the Browse Requests page
 */
export async function getBrowseRequests(): Promise<ServiceResponse<HelpRequest[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Fetch all requests where user_id is NOT equal to current user's id
    const { data, error } = await supabase
      .from('help_requests')
      .select('*')
      .neq('user_id', user.id)
      .in('status', ['pending', 'matched']) // Show both pending AND matched requests (NOT completed)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching browse requests:', error);
      return {
        success: false,
        error: 'Failed to fetch browse requests'
      };
    }

    return {
      success: true,
      data: data || [],
      message: data?.length === 0 ? 'No requests available yet' : undefined
    };
  } catch (err: any) {
    console.error('Unexpected error fetching browse requests:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get a single help request by ID
 */
export async function getRequestById(requestId: string): Promise<ServiceResponse<HelpRequest>> {
  try {
    const { data, error } = await supabase
      .from('help_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Error fetching request:', error);
      return {
        success: false,
        error: 'Failed to fetch request details'
      };
    }

    return {
      success: true,
      data
    };
  } catch (err: any) {
    console.error('Unexpected error fetching request:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Update a help request (only if the user owns it)
 */
export async function updateHelpRequest(requestId: string, updates: Partial<HelpRequest>): Promise<ServiceResponse<HelpRequest>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // First check if the user owns this request
    const { data: existingRequest, error: fetchError } = await supabase
      .from('help_requests')
      .select('user_id')
      .eq('id', requestId)
      .single();

    if (fetchError || !existingRequest) {
      return {
        success: false,
        error: 'Request not found'
      };
    }

    if (existingRequest.user_id !== user.id) {
      return {
        success: false,
        error: 'You can only update your own requests'
      };
    }

    // Update the request
    const { data, error } = await supabase
      .from('help_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Error updating request:', error);
      return {
        success: false,
        error: 'Failed to update request'
      };
    }

    return {
      success: true,
      data,
      message: 'Request updated successfully'
    };
  } catch (err: any) {
    console.error('Unexpected error updating request:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Delete a help request (only if the user owns it)
 */
export async function deleteHelpRequest(requestId: string): Promise<ServiceResponse<void>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // First check if the user owns this request
    const { data: existingRequest, error: fetchError } = await supabase
      .from('help_requests')
      .select('user_id')
      .eq('id', requestId)
      .single();

    if (fetchError || !existingRequest) {
      return {
        success: false,
        error: 'Request not found'
      };
    }

    if (existingRequest.user_id !== user.id) {
      return {
        success: false,
        error: 'You can only delete your own requests'
      };
    }

    // Delete the request
    const { error } = await supabase
      .from('help_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Error deleting request:', error);
      return {
        success: false,
        error: 'Failed to delete request'
      };
    }

    return {
      success: true,
      message: 'Request deleted successfully'
    };
  } catch (err: any) {
    console.error('Unexpected error deleting request:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Subscribe to real-time updates for browse requests
 * This will notify when NEW requests are created by OTHER users
 */
export function subscribeToBrowseRequests(
  callback: (request: HelpRequest) => void,
  onError?: (error: any) => void
) {
  const subscription = supabase
    .channel('browse-requests-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'help_requests'
      },
      async (payload) => {
        // Only notify if the request is not from the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && payload.new.user_id !== user.id) {
          callback(payload.new as HelpRequest);
        }
      }
    )
    .subscribe((status, error) => {
      if (error && onError) {
        onError(error);
      }
      console.log('Browse requests subscription status:', status);
    });

  return subscription;
}

/**
 * Subscribe to real-time updates for user's own requests
 * This will notify when the user's requests are updated
 */
export function subscribeToMyRequests(
  userId: string,
  callback: (request: HelpRequest, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  onError?: (error: any) => void
) {
  const subscription = supabase
    .channel('my-requests-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'help_requests',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as HelpRequest, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
      }
    )
    .subscribe((status, error) => {
      if (error && onError) {
        onError(error);
      }
      console.log('My requests subscription status:', status);
    });

  return subscription;
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribeChannel(subscription: any) {
  if (subscription) {
    await supabase.removeChannel(subscription);
  }
}

// =====================================================
// HELP OFFERS FUNCTIONS
// =====================================================

/**
 * Create a help offer on a request
 * Automatically creates a notification for the requester
 */
export async function createHelpOffer(
  offerData: Omit<HelpOffer, 'id' | 'helper_id' | 'status' | 'created_at' | 'updated_at'>
): Promise<ServiceResponse<HelpOffer>> {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated. Please log in to offer help.'
      };
    }

    // Get user profile data for denormalization
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous';
    const userEmail = user.email;
    const userPhone = user.user_metadata?.phone || '';

    // Check if user has already offered help on this request
    const { data: existingOffer } = await supabase
      .from('help_offers')
      .select('id')
      .eq('request_id', offerData.request_id)
      .eq('helper_id', user.id)
      .single();

    if (existingOffer) {
      return {
        success: false,
        error: 'You have already offered help on this request.'
      };
    }

    // Create the help offer
    const { data, error } = await supabase
      .from('help_offers')
      .insert([
        {
          ...offerData,
          helper_id: user.id,
          helper_name: userName,
          helper_email: userEmail,
          helper_phone: userPhone,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating help offer:', error);
      return {
        success: false,
        error: `Failed to create help offer: ${error.message}`
      };
    }

    // Note: Notification is automatically created by database trigger
    // See CREATE_NOTIFICATIONS_TABLE.sql for the trigger definition

    return {
      success: true,
      data,
      message: 'Help offer sent successfully! The requester will be notified.'
    };
  } catch (err: any) {
    console.error('Unexpected error creating help offer:', err);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Get help offers made by the current user (UNIFIED: Global + Community)
 * Uses the unified dashboard_my_contributions VIEW (READ-ONLY)
 * This is for the "My Contributions" section
 */
export async function getMyContributions(): Promise<ServiceResponse<any[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Query unified view (combines global + community offers)
    // Community data is embedded directly in the view (no join needed)
    const { data, error } = await supabase
      .from('dashboard_my_contributions')
      .select(`
        id,
        request_id,
        request_title,
        category,
        amount,
        request_status,
        source_type,
        contribution_type,
        message,
        status,
        community_id,
        community_name,
        community_category,
        requester_name,
        requester_city,
        requester_state,
        requester_phone,
        urgency,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contributions:', error);
      return {
        success: false,
        error: 'Failed to fetch your contributions'
      };
    }

    // Data already includes all request details from the unified view
    // No need for additional fetching
    return {
      success: true,
      data: data || [],
      message: data?.length === 0 ? 'No contributions yet' : undefined
    };
  } catch (err: any) {
    console.error('Unexpected error fetching contributions:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get help offers received by the current user (as requester)
 */
export async function getMyReceivedOffers(): Promise<ServiceResponse<HelpOffer[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const { data, error } = await supabase
      .from('help_offers')
      .select('*')
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching received offers:', error);
      return {
        success: false,
        error: 'Failed to fetch received offers'
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (err: any) {
    console.error('Unexpected error fetching received offers:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Update help offer status (accept, reject, complete, cancel)
 */
export async function updateOfferStatus(
  offerId: string,
  status: 'accepted' | 'rejected' | 'completed' | 'cancelled'
): Promise<ServiceResponse<HelpOffer>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const { data, error } = await supabase
      .from('help_offers')
      .update({ status })
      .eq('id', offerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating offer status:', error);
      return {
        success: false,
        error: 'Failed to update offer status'
      };
    }

    return {
      success: true,
      data,
      message: `Offer ${status} successfully`
    };
  } catch (err: any) {
    console.error('Unexpected error updating offer status:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Subscribe to real-time updates for help offers (as helper)
 */
export function subscribeToMyContributions(
  userId: string,
  callback: (offer: HelpOffer, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  onError?: (error: any) => void
) {
  const subscription = supabase
    .channel('my-contributions-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'help_offers',
        filter: `helper_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as HelpOffer, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
      }
    )
    .subscribe((status, error) => {
      if (error && onError) {
        onError(error);
      }
      console.log('My contributions subscription status:', status);
    });

  return subscription;
}

/**
 * Complete a help request (mark as completed)
 * This calls the database function which:
 * - Updates status to 'completed'
 * - Sends notifications to all helpers
 * - Only works if user owns the request
 */
export async function completeHelpRequest(
  requestId: string,
  sourceType: 'global' | 'community'
): Promise<ServiceResponse<any>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Call the appropriate database function
    const functionName = sourceType === 'global' 
      ? 'complete_global_help_request'
      : 'complete_community_help_request';

    const { data, error } = await supabase.rpc(functionName, {
      request_id: requestId
    });

    if (error) {
      console.error('Error completing help request:', error);
      return {
        success: false,
        error: 'Failed to complete help request'
      };
    }

    // The function returns a JSON object
    if (data && typeof data === 'object' && !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to complete help request'
      };
    }

    return {
      success: true,
      data,
      message: 'Help request marked as completed successfully!'
    };
  } catch (err: any) {
    console.error('Unexpected error completing help request:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get all helpers (offers) for a specific request
 */
export async function getRequestHelpers(
  requestId: string,
  sourceType: 'global' | 'community'
): Promise<ServiceResponse<any[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Query the appropriate table based on source type
    const tableName = sourceType === 'global' ? 'help_offers' : 'community_help_offers';
    const requestIdColumn = sourceType === 'global' ? 'request_id' : 'help_request_id';

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(requestIdColumn, requestId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching request helpers:', error);
      return {
        success: false,
        error: 'Failed to fetch helpers'
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (err: any) {
    console.error('Unexpected error fetching helpers:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get requests filtered by status
 */
export async function getRequestsByStatus(
  status: 'pending' | 'matched' | 'completed'
): Promise<ServiceResponse<any[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const { data, error } = await supabase
      .from('dashboard_my_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests by status:', error);
      return {
        success: false,
        error: 'Failed to fetch requests'
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (err: any) {
    console.error('Unexpected error fetching requests by status:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

// =====================================================
// NOTIFICATIONS FUNCTIONS
// =====================================================

/**
 * Get notifications for the current user
 */
export async function getNotifications(unreadOnly: boolean = false): Promise<ServiceResponse<Notification[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user.id);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        error: 'Failed to fetch notifications'
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (err: any) {
    console.error('Unexpected error fetching notifications:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<ServiceResponse<number>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
        data: 0
      };
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return {
        success: false,
        error: 'Failed to fetch unread count',
        data: 0
      };
    }

    return {
      success: true,
      data: count || 0
    };
  } catch (err: any) {
    console.error('Unexpected error fetching unread count:', err);
    return {
      success: false,
      error: 'An unexpected error occurred',
      data: 0
    };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<ServiceResponse<Notification>> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: 'Failed to mark notification as read'
      };
    }

    return {
      success: true,
      data
    };
  } catch (err: any) {
    console.error('Unexpected error marking notification as read:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<ServiceResponse<void>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all as read:', error);
      return {
        success: false,
        error: 'Failed to mark all as read'
      };
    }

    return {
      success: true,
      message: 'All notifications marked as read'
    };
  } catch (err: any) {
    console.error('Unexpected error marking all as read:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<ServiceResponse<void>> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        error: 'Failed to delete notification'
      };
    }

    return {
      success: true,
      message: 'Notification deleted successfully'
    };
  } catch (err: any) {
    console.error('Unexpected error deleting notification:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Subscribe to real-time notifications
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Notification, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  onError?: (error: any) => void
) {
  const subscription = supabase
    .channel('notifications-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as Notification, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
      }
    )
    .subscribe((status, error) => {
      if (error && onError) {
        onError(error);
      }
      console.log('Notifications subscription status:', status);
    });

  return subscription;
}

// =====================================================
// COMMUNITIES FUNCTIONS
// =====================================================

export interface Community {
  id?: string;
  name: string;
  description: string;
  category: string;
  location?: string;
  creator_id?: string;
  is_verified?: boolean;
  members_count?: number;
  trust_rating?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CommunityMember {
  id?: string;
  community_id: string;
  user_id: string;
  role?: string;
  joined_at?: string;
}

/**
 * Create a new community
 * Automatically adds the creator as admin via database trigger
 */
export async function createCommunity(
  communityData: Omit<Community, 'id' | 'creator_id' | 'is_verified' | 'members_count' | 'trust_rating' | 'created_at' | 'updated_at'>
): Promise<ServiceResponse<Community>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated. Please log in to create a community.'
      };
    }

    // Create the community
    const { data, error } = await supabase
      .from('communities')
      .insert([
        {
          ...communityData,
          creator_id: user.id,
          is_verified: false,
          members_count: 1,
          trust_rating: 0
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating community:', error);
      return {
        success: false,
        error: `Failed to create community: ${error.message}`
      };
    }

    // Note: Creator is automatically added as admin via database trigger
    // See CREATE_COMMUNITIES_TABLES.sql for the trigger definition

    return {
      success: true,
      data,
      message: 'Community created successfully! You have been added as admin.'
    };
  } catch (err: any) {
    console.error('Unexpected error creating community:', err);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Get communities that the current user has joined (My Communities)
 */
export async function getMyCommunities(): Promise<ServiceResponse<Community[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Get communities the user is a member of
    const { data, error } = await supabase
      .from('communities')
      .select(`
        *,
        community_members!inner(user_id)
      `)
      .eq('community_members.user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my communities:', error);
      return {
        success: false,
        error: 'Failed to fetch your communities'
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (err: any) {
    console.error('Unexpected error fetching my communities:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get communities that the current user has NOT joined (Explore Communities)
 */
export async function getExploreCommunities(): Promise<ServiceResponse<Community[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Step 1: Fetch IDs of communities the user has already joined
    const { data: joinedCommunities, error: joinedError } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id);

    if (joinedError) {
      console.error('Error fetching joined communities:', joinedError);
      return {
        success: false,
        error: 'Failed to fetch joined communities'
      };
    }

    // Step 2: Extract joined community IDs into an array
    const joinedIds = joinedCommunities?.map((j) => j.community_id) || [];

    // Step 3: Fetch all communities first
    const { data: allCommunities, error: communitiesError } = await supabase
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false });

    if (communitiesError) {
      console.error('Error fetching all communities:', communitiesError);
      return {
        success: false,
        error: 'Failed to fetch communities'
      };
    }

    // Step 4: Filter out joined communities on the client side
    // This is more reliable than trying to use complex SQL in PostgREST
    const data = allCommunities?.filter(
      community => !joinedIds.includes(community.id)
    ) || [];

    return {
      success: true,
      data: data
    };
  } catch (err: any) {
    console.error('Unexpected error fetching explore communities:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get all communities (for browsing)
 */
export async function getAllCommunities(): Promise<ServiceResponse<Community[]>> {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all communities:', error);
      return {
        success: false,
        error: 'Failed to fetch communities'
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (err: any) {
    console.error('Unexpected error fetching communities:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get a single community by ID
 */
export async function getCommunityById(communityId: string): Promise<ServiceResponse<Community>> {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .single();

    if (error) {
      console.error('Error fetching community:', error);
      return {
        success: false,
        error: 'Failed to fetch community details'
      };
    }

    return {
      success: true,
      data
    };
  } catch (err: any) {
    console.error('Unexpected error fetching community:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get members of a community with user details
 */
export async function getCommunityMembers(communityId: string): Promise<ServiceResponse<any[]>> {
  try {
    // Fetch community members
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select('id, community_id, user_id, role, joined_at')
      .eq('community_id', communityId)
      .order('joined_at', { ascending: false });

    if (membersError) {
      console.error('Error fetching community members:', membersError);
      return {
        success: false,
        error: 'Failed to fetch community members'
      };
    }

    if (!members || members.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // Get user IDs
    const userIds = members.map(m => m.user_id);

    // Fetch user details from auth.users via RPC or direct query
    // Using user_profiles view (created in SQL fix script)
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', userIds);

    if (usersError) {
      console.warn('Could not fetch user details, returning members without names:', usersError);
      // Return members without user details if view doesn't exist
      return {
        success: true,
        data: members.map(m => ({
          ...m,
          user: { id: m.user_id, email: 'Unknown', full_name: null }
        }))
      };
    }

    // Merge member data with user data
    const membersWithUserData = members.map(member => {
      const user = users?.find(u => u.id === member.user_id);
      return {
        ...member,
        user: user || { id: member.user_id, email: 'Unknown', full_name: null }
      };
    });

    return {
      success: true,
      data: membersWithUserData
    };
  } catch (err: any) {
    console.error('Unexpected error fetching community members:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Join a community
 */
export async function joinCommunity(communityId: string): Promise<ServiceResponse<CommunityMember>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated. Please log in to join a community.'
      };
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .single();

    if (existingMember) {
      return {
        success: false,
        error: 'You are already a member of this community.'
      };
    }

    // Join the community
    const { data, error } = await supabase
      .from('community_members')
      .insert([
        {
          community_id: communityId,
          user_id: user.id,
          role: 'member'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error joining community:', error);
      return {
        success: false,
        error: `Failed to join community: ${error.message}`
      };
    }

    // Note: members_count is automatically incremented via database trigger

    return {
      success: true,
      data,
      message: 'Successfully joined the community!'
    };
  } catch (err: any) {
    console.error('Unexpected error joining community:', err);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

/**
 * Leave a community
 */
export async function leaveCommunity(communityId: string): Promise<ServiceResponse<void>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Check if user is the creator/admin
    const { data: community } = await supabase
      .from('communities')
      .select('creator_id')
      .eq('id', communityId)
      .single();

    if (community && community.creator_id === user.id) {
      return {
        success: false,
        error: 'Community creators cannot leave their own community. Please delete the community instead.'
      };
    }

    // Leave the community
    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error leaving community:', error);
      return {
        success: false,
        error: 'Failed to leave community'
      };
    }

    // Note: members_count is automatically decremented via database trigger

    return {
      success: true,
      message: 'Successfully left the community'
    };
  } catch (err: any) {
    console.error('Unexpected error leaving community:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Check if user is a member of a community
 */
export async function isUserMemberOfCommunity(communityId: string): Promise<ServiceResponse<boolean>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: true,
        data: false
      };
    }

    const { data, error } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking membership:', error);
      return {
        success: false,
        error: 'Failed to check membership status'
      };
    }

    return {
      success: true,
      data: !!data
    };
  } catch (err: any) {
    console.error('Unexpected error checking membership:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Update a community (only creator can update)
 */
export async function updateCommunity(
  communityId: string,
  updates: Partial<Community>
): Promise<ServiceResponse<Community>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Check if user is the creator
    const { data: community, error: fetchError } = await supabase
      .from('communities')
      .select('creator_id')
      .eq('id', communityId)
      .single();

    if (fetchError || !community) {
      return {
        success: false,
        error: 'Community not found'
      };
    }

    if (community.creator_id !== user.id) {
      return {
        success: false,
        error: 'Only the community creator can update this community'
      };
    }

    // Update the community
    const { data, error } = await supabase
      .from('communities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', communityId)
      .select()
      .single();

    if (error) {
      console.error('Error updating community:', error);
      return {
        success: false,
        error: 'Failed to update community'
      };
    }

    return {
      success: true,
      data,
      message: 'Community updated successfully'
    };
  } catch (err: any) {
    console.error('Unexpected error updating community:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Delete a community (only creator can delete)
 */
export async function deleteCommunity(communityId: string): Promise<ServiceResponse<void>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Check if user is the creator
    const { data: community, error: fetchError } = await supabase
      .from('communities')
      .select('creator_id')
      .eq('id', communityId)
      .single();

    if (fetchError || !community) {
      return {
        success: false,
        error: 'Community not found'
      };
    }

    if (community.creator_id !== user.id) {
      return {
        success: false,
        error: 'Only the community creator can delete this community'
      };
    }

    // Delete the community (members will be deleted via CASCADE)
    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', communityId);

    if (error) {
      console.error('Error deleting community:', error);
      return {
        success: false,
        error: 'Failed to delete community'
      };
    }

    return {
      success: true,
      message: 'Community deleted successfully'
    };
  } catch (err: any) {
    console.error('Unexpected error deleting community:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Subscribe to real-time updates for communities
 */
export function subscribeToCommunities(
  callback: (community: Community, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  onError?: (error: any) => void
) {
  const subscription = supabase
    .channel('communities-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'communities'
      },
      (payload) => {
        callback(payload.new as Community, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
      }
    )
    .subscribe((status, error) => {
      if (error && onError) {
        onError(error);
      }
      console.log('Communities subscription status:', status);
    });

  return subscription;
}

/**
 * Subscribe to real-time updates for community members
 */
export function subscribeToCommunityMembers(
  communityId: string,
  callback: (member: CommunityMember, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  onError?: (error: any) => void
) {
  const subscription = supabase
    .channel(`community-members-${communityId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_members',
        filter: `community_id=eq.${communityId}`
      },
      (payload) => {
        callback(payload.new as CommunityMember, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
      }
    )
    .subscribe((status, error) => {
      if (error && onError) {
        onError(error);
      }
      console.log('Community members subscription status:', status);
    });

  return subscription;
}

// =====================================================
// COMMUNITY HELP REQUESTS FUNCTIONS
// =====================================================

export interface CommunityHelpRequest {
  id?: string;
  community_id: string;
  user_id?: string;
  title: string;
  description: string;
  category?: string; // Optional now - auto-filled by trigger
  urgency?: string;
  amount_needed?: number;
  status?: string;
  supporters?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CommunityHelpOffer {
  id?: string;
  help_request_id: string;
  helper_id?: string;
  requester_id: string;
  community_id: string;
  message?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Create a community help request
 * Automatically sets user_id to the logged-in user's auth.uid()
 */
export async function createCommunityHelpRequest(
  requestData: Omit<CommunityHelpRequest, 'id' | 'user_id' | 'status' | 'supporters' | 'created_at' | 'updated_at'>
): Promise<ServiceResponse<CommunityHelpRequest>> {
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated. Please log in to create a request.'
      };
    }

    // Check if user is a member of the community
    const { data: memberData, error: memberError } = await supabase
      .from('community_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('community_id', requestData.community_id)
      .maybeSingle();

    if (memberError) {
      console.error('Error checking community membership:', memberError);
      return {
        success: false,
        error: 'Unable to verify community membership. Please try again.'
      };
    }

    if (!memberData) {
      return {
        success: false,
        error: 'You must be a member of this community to create a help request.'
      };
    }

    // Ensure amount_needed is a whole integer to avoid precision issues
    const finalRequestData = {
      ...requestData,
      amount_needed: requestData.amount_needed 
        ? Math.round(requestData.amount_needed)
        : requestData.amount_needed
    };

    // Insert the request
    const { data, error } = await supabase
      .from('community_help_requests')
      .insert([
        {
          ...finalRequestData,
          user_id: user.id,
          status: 'pending',
          supporters: 0
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating community help request:', error);
      return {
        success: false,
        error: 'Failed to create help request'
      };
    }

    return {
      success: true,
      data,
      message: 'Help request created successfully'
    };
  } catch (err: any) {
    console.error('Unexpected error creating community help request:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get all help requests for a specific community
 */
export async function getCommunityHelpRequests(communityId: string): Promise<ServiceResponse<any[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // No need to manually check membership - RLS policies handle this
    // RLS will automatically show requests based on:
    // 1. User is a member of the community
    // 2. Community is public and request is not completed
    // 3. User created the request
    
    // Get all help requests for the community with user profile data
    // Using explicit relationship alias to avoid PGRST201 error
    // Exclude current user's own requests (they should only see others' requests in browse view)
    const { data, error } = await supabase
      .from('community_help_requests')
      .select(`
        *,
        user_profiles!fk_community_help_requests_user (
          full_name,
          email,
          phone
        )
      `)
      .eq('community_id', communityId)
      .neq('user_id', user.id) // Exclude user's own requests from browse view
      .neq('status', 'completed') // Exclude completed requests from browse view
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching community help requests:', error);
      return {
        success: false,
        error: 'Failed to fetch help requests'
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (err: any) {
    console.error('Unexpected error fetching community help requests:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get help requests created by the current user in a specific community
 */
export async function getMyCommunityHelpRequests(communityId: string): Promise<ServiceResponse<CommunityHelpRequest[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const { data, error } = await supabase
      .from('community_help_requests')
      .select('*')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my community help requests:', error);
      return {
        success: false,
        error: 'Failed to fetch your help requests'
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (err: any) {
    console.error('Unexpected error fetching my community help requests:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Create a help offer on a community help request
 * Automatically creates a notification for the requester
 */
export async function createCommunityHelpOffer(
  offerData: Omit<CommunityHelpOffer, 'id' | 'helper_id' | 'status' | 'created_at' | 'updated_at'>
): Promise<ServiceResponse<CommunityHelpOffer>> {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated. Please log in to offer help.'
      };
    }

    // Check if user is a member of the community
    const { data: memberData, error: memberError } = await supabase
      .from('community_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('community_id', offerData.community_id)
      .maybeSingle();

    if (memberError) {
      console.error('Error checking community membership:', memberError);
      return {
        success: false,
        error: 'Unable to verify community membership. Please try again.'
      };
    }

    if (!memberData) {
      return {
        success: false,
        error: 'You must be a member of this community to offer help.'
      };
    }

    // Check if user has already offered help on this request
    const { data: existingOffer } = await supabase
      .from('community_help_offers')
      .select('id')
      .eq('help_request_id', offerData.help_request_id)
      .eq('helper_id', user.id)
      .single();

    if (existingOffer) {
      return {
        success: false,
        error: 'You have already offered help on this request.'
      };
    }

    // Get user profile data for the notification
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous';

    // Get request details for the notification
    const { data: requestData } = await supabase
      .from('community_help_requests')
      .select('title, community_id')
      .eq('id', offerData.help_request_id)
      .single();

    // Create the help offer
    // Note: Database trigger will automatically create notification
    const { data, error } = await supabase
      .from('community_help_offers')
      .insert([
        {
          ...offerData,
          helper_id: user.id,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating community help offer:', error);
      return {
        success: false,
        error: 'Failed to create help offer'
      };
    }

    // Notification is automatically created by database trigger
    // Format: "{helper_name} from community "{community_name}" is willing to help you."

    // Update supporters count
    await supabase.rpc('increment_community_request_supporters', {
      request_id: offerData.help_request_id
    });

    return {
      success: true,
      data,
      message: 'Help offer created successfully'
    };
  } catch (err: any) {
    console.error('Unexpected error creating community help offer:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get help offers made by the current user in a specific community
 */
export async function getMyCommunityContributions(communityId: string): Promise<ServiceResponse<any[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const { data, error } = await supabase
      .from('community_help_offers')
      .select(`
        *,
        community_help_requests (
          title,
          description,
          category,
          amount_needed,
          status
        )
      `)
      .eq('community_id', communityId)
      .eq('helper_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching community contributions:', error);
      return {
        success: false,
        error: 'Failed to fetch your contributions'
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (err: any) {
    console.error('Unexpected error fetching community contributions:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Subscribe to real-time updates for community help requests
 */
export function subscribeToCommunityHelpRequests(
  communityId: string,
  callback: (request: CommunityHelpRequest, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  onError?: (error: any) => void
) {
  const subscription = supabase
    .channel(`community-help-requests-${communityId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_help_requests',
        filter: `community_id=eq.${communityId}`
      },
      (payload) => {
        callback(payload.new as CommunityHelpRequest, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
      }
    )
    .subscribe((status, error) => {
      if (error && onError) {
        onError(error);
      }
      console.log('Community help requests subscription status:', status);
    });

  return subscription;
}

/**
 * Subscribe to real-time updates for community help offers
 */
export function subscribeToCommunityHelpOffers(
  communityId: string,
  callback: (offer: CommunityHelpOffer, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  onError?: (error: any) => void
) {
  const subscription = supabase
    .channel(`community-help-offers-${communityId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_help_offers',
        filter: `community_id=eq.${communityId}`
      },
      (payload) => {
        callback(payload.new as CommunityHelpOffer, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
      }
    )
    .subscribe((status, error) => {
      if (error && onError) {
        onError(error);
      }
      console.log('Community help offers subscription status:', status);
    });

  return subscription;
}

// =====================================================
// COMMUNITY ACTIVITY FEED FUNCTIONS
// =====================================================

export interface ActivityFeedEntry {
  id?: string;
  community_id: string;
  actor_id: string;
  target_id?: string;
  action_type: 'request_help' | 'offer_help';
  message: string;
  metadata?: any;
  created_at?: string;
  user_profiles?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

/**
 * Get activity feed for a specific community
 */
export async function getCommunityActivityFeed(
  communityId: string,
  limit: number = 50
): Promise<ServiceResponse<ActivityFeedEntry[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Check if user is a member of the community
    const { data: memberData, error: memberError } = await supabase
      .from('community_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('community_id', communityId)
      .maybeSingle();

    if (memberError) {
      console.error('Error checking community membership:', memberError);
      return {
        success: false,
        error: 'Unable to verify community membership. Please try again.'
      };
    }

    if (!memberData) {
      return {
        success: false,
        error: 'You must be a member of this community to view activities.'
      };
    }

    // Fetch activity feed with actor details
    const { data, error } = await supabase
      .from('activity_feed')
      .select(`
        id,
        community_id,
        actor_id,
        target_id,
        action_type,
        message,
        metadata,
        created_at,
        user_profiles!actor_id (
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activity feed:', error);
      return {
        success: false,
        error: 'Failed to fetch activity feed'
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (err: any) {
    console.error('Unexpected error fetching activity feed:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Subscribe to real-time activity feed updates for a community
 */
export function subscribeToActivityFeed(
  communityId: string,
  callback: (activity: ActivityFeedEntry, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void,
  onError?: (error: any) => void
) {
  const subscription = supabase
    .channel(`activity-feed-${communityId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'activity_feed',
        filter: `community_id=eq.${communityId}`
      },
      async (payload) => {
        // Fetch actor details for new activity
        if (payload.eventType === 'INSERT' && payload.new) {
          const { data: actorData } = await supabase
            .from('user_profiles')
            .select('full_name, email, avatar_url')
            .eq('id', (payload.new as any).actor_id)
            .single();

          const activityWithActor = {
            ...payload.new as ActivityFeedEntry,
            user_profiles: actorData || undefined
          };

          callback(activityWithActor, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
        } else {
          callback(payload.new as ActivityFeedEntry, payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE');
        }
      }
    )
    .subscribe((status, error) => {
      if (error && onError) {
        onError(error);
      }
      console.log('Activity feed subscription status:', status);
    });

  return subscription;
}

// =====================================================
// DASHBOARD SYNC FUNCTIONS (Community + Global)
// =====================================================

export interface DashboardRequest {
  id: string;
  user_id: string;
  source_type: 'global' | 'community';
  source_id: string;
  community_id?: string;
  title: string;
  description?: string;
  category?: string;
  amount?: number;
  urgency?: string;
  status: string;
  supporters?: number;
  created_at: string;
  updated_at?: string;
  communities?: {
    name: string;
    category: string;
  };
}

export interface DashboardContribution {
  id: string;
  user_id: string;
  source_type: 'global' | 'community';
  source_id: string;
  community_id?: string;
  request_id?: string;
  contribution_type: string;
  amount?: number;
  message?: string;
  status: string;
  created_at: string;
  communities?: {
    name: string;
    category: string;
  };
}

/**
 * Get all requests for the user (global + community)
 */
export async function getUserDashboardRequests(): Promise<ServiceResponse<DashboardRequest[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const { data, error } = await supabase
      .from('dashboard_my_requests')
      .select(`
        id,
        user_id,
        source_type,
        community_id,
        title,
        description,
        category,
        amount,
        urgency,
        status,
        supporters,
        created_at,
        updated_at,
        communities (
          name,
          category
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching dashboard requests:', error);
      return {
        success: false,
        error: 'Failed to fetch your requests'
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (err: any) {
    console.error('Unexpected error fetching dashboard requests:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Get all contributions for the user (global + community)
 */
export async function getUserDashboardContributions(): Promise<ServiceResponse<DashboardContribution[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const { data, error } = await supabase
      .from('dashboard_my_contributions')
      .select(`
        id,
        user_id,
        source_type,
        community_id,
        request_id,
        contribution_type,
        amount,
        message,
        status,
        created_at,
        communities (
          name,
          category
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching dashboard contributions:', error);
      return {
        success: false,
        error: 'Failed to fetch your contributions'
      };
    }

    return {
      success: true,
      data: data || []
    };
  } catch (err: any) {
    console.error('Unexpected error fetching dashboard contributions:', err);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Subscribe to real-time dashboard requests updates
 * Monitors both global help_requests and community_help_requests tables
 */
export function subscribeToDashboardRequests(
  userId: string,
  callback: () => void,
  onError?: (error: any) => void
) {
  const subscription = supabase
    .channel(`dashboard-requests-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'help_requests',
        filter: `user_id=eq.${userId}`
      },
      () => callback()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_help_requests',
        filter: `user_id=eq.${userId}`
      },
      () => callback()
    )
    .subscribe((status, error) => {
      if (error && onError) {
        onError(error);
      }
      console.log('Dashboard requests subscription status:', status);
    });

  return subscription;
}

/**
 * Subscribe to real-time dashboard contributions updates
 * Monitors both global help_offers and community_help_offers tables
 */
export function subscribeToDashboardContributions(
  userId: string,
  callback: () => void,
  onError?: (error: any) => void
) {
  const subscription = supabase
    .channel(`dashboard-contributions-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'help_offers',
        filter: `helper_id=eq.${userId}`
      },
      () => callback()
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'community_help_offers',
        filter: `helper_id=eq.${userId}`
      },
      () => callback()
    )
    .subscribe((status, error) => {
      if (error && onError) {
        onError(error);
      }
      console.log('Dashboard contributions subscription status:', status);
    });

  return subscription;
}