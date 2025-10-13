import { supabase } from './supabase/client';
import { projectId, publicAnonKey } from './supabase/info';
import { validateUserRole, getRoleErrorMessage, RoleValidationError } from './roleValidation';

// Base API configuration
const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d76561a1`;

console.log('API Configuration:', {
  projectId,
  API_BASE_URL,
  publicAnonKey: publicAnonKey ? `${publicAnonKey.substring(0, 20)}...` : 'Not found'
});

// Helper function to get auth headers
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('User not authenticated');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  };
}

// Helper function to make authenticated API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  try {
    const headers = await getAuthHeaders();
    
    console.log(`Making API call to: ${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    console.log(`API response status: ${response.status} for ${endpoint}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      
      // Reduce console noise for expected community API errors in demo mode
      if (endpoint.startsWith('/communities/')) {
        console.log(`Community API (demo mode): ${errorData.error || 'Not found'}`);
      } else {
        console.error(`API error for ${endpoint}:`, errorData);
      }
      
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`API success for ${endpoint}:`, data);
    return data;
  } catch (error) {
    // Reduce console noise for expected community API errors in demo mode
    if (endpoint.startsWith('/communities/')) {
      console.log(`Community API (demo mode): ${error.message}`);
    } else {
      console.error(`API call failed for ${endpoint}:`, error);
    }
    
    // If it's a network error, provide a more helpful message
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Network error detected - this could be due to:');
      console.error('1. Server not running or not accessible');
      console.error('2. CORS configuration issues');
      console.error('3. Network connectivity problems');
      console.error(`Attempted URL: ${API_BASE_URL}${endpoint}`);
      
      // Add a retry mechanism for network failures
      if (!options.retried) {
        console.log('Retrying API call once...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return apiCall(endpoint, { ...options, retried: true });
      }
    }
    
    throw error;
  }
}

// Help Requests API (Individual Users)
export const helpRequestsApi = {
  // Create a new help request
  async create(requestData: {
    title: string;
    description: string;
    category: string;
    amount: number;
    urgency: 'low' | 'medium' | 'critical';
    location: string;
    contactInfo: string;
  }) {
    try {
      await validateUserRole('individual');
      return apiCall('/help-requests', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
    } catch (error) {
      const message = getRoleErrorMessage(error as Error, 'create help requests');
      throw new Error(message);
    }
  },

  // Get user's own help requests
  async getMyRequests() {
    try {
      await validateUserRole('individual');
      return apiCall('/help-requests/my-requests');
    } catch (error) {
      const message = getRoleErrorMessage(error as Error, 'view your requests');
      throw new Error(message);
    }
  },

  // Browse all available help requests (available to both roles)
  async browse() {
    return apiCall('/help-requests/browse');
  }
};

// Campaigns API (NGO Users)
export const campaignsApi = {
  // Create a new campaign
  async create(campaignData: {
    title: string;
    description: string;
    category: string;
    targetAmount: number;
    beneficiaries: number;
    deadline: string;
    location: string;
  }) {
    try {
      await validateUserRole('ngo');
      return apiCall('/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData)
      });
    } catch (error) {
      const message = getRoleErrorMessage(error as Error, 'create campaigns');
      throw new Error(message);
    }
  },

  // Get NGO's own campaigns
  async getMyCampaigns() {
    try {
      await validateUserRole('ngo');
      return apiCall('/campaigns/my-campaigns');
    } catch (error) {
      const message = getRoleErrorMessage(error as Error, 'view your campaigns');
      throw new Error(message);
    }
  },

  // Browse all available campaigns (available to both roles)
  async browse() {
    return apiCall('/campaigns/browse');
  }
};

// Contributions API (Both Roles)
export const contributionsApi = {
  // Record a contribution/donation (available to both roles)
  async create(contributionData: {
    targetId: string;
    targetType: 'help_request' | 'campaign';
    amount: number;
    message?: string;
  }) {
    return apiCall('/contributions', {
      method: 'POST',
      body: JSON.stringify(contributionData)
    });
  },

  // Get user's contributions (available to both roles - no role validation needed)
  async getMyContributions() {
    try {
      return apiCall('/contributions/my-contributions');
    } catch (error) {
      console.error('Error fetching contributions:', error);
      throw error;
    }
  }
};

// Analytics API
export const analyticsApi = {
  // Get NGO statistics
  async getNGOStats() {
    try {
      await validateUserRole('ngo');
      return apiCall('/analytics/ngo-stats');
    } catch (error) {
      console.error('NGO Stats API Error:', error);
      
      // Check if it's a role validation error or network error
      if (error instanceof RoleValidationError) {
        const message = getRoleErrorMessage(error as Error, 'view NGO analytics');
        throw new Error(message);
      }
      
      // For network errors, provide a fallback
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.warn('Network error in getNGOStats, falling back to empty stats');
        return {
          stats: {
            totalCampaigns: 0,
            activeCampaigns: 0,
            completedCampaigns: 0,
            totalBeneficiaries: 0,
            fundsRaised: 0,
            partneredDonors: 0,
            impactScore: 0
          }
        };
      }
      
      throw error;
    }
  },

  // Get Individual user statistics
  async getIndividualStats() {
    try {
      await validateUserRole('individual');
      return apiCall('/analytics/individual-stats');
    } catch (error) {
      console.error('Individual Stats API Error:', error);
      
      // Check if it's a role validation error or network error
      if (error instanceof RoleValidationError) {
        const message = getRoleErrorMessage(error as Error, 'view individual analytics');
        throw new Error(message);
      }
      
      // For network errors, provide a fallback
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.warn('Network error in getIndividualStats, falling back to empty stats');
        return {
          stats: {
            totalRequests: 0,
            activeRequests: 0,
            completedRequests: 0,
            totalHelped: 0,
            totalDonated: 0,
            amountReceived: 0,
            impactScore: 0
          }
        };
      }
      
      throw error;
    }
  }
};

// Profile API
export const profileApi = {
  // Update user profile
  async update(profileData: {
    name: string;
    phone: string;
  }) {
    return apiCall('/profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    });
  }
};

// Health check
export const healthApi = {
  async check() {
    try {
      console.log(`Health check URL: ${API_BASE_URL}/health`);
      
      // Try without authentication first
      let response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Health check response status: ${response.status}`);
      
      // If 401, try with authentication
      if (response.status === 401) {
        console.log('Health check got 401, trying with authentication...');
        try {
          const authHeaders = await getAuthHeaders();
          response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: {
              ...authHeaders
            }
          });
          console.log(`Authenticated health check response status: ${response.status}`);
        } catch (authError) {
          console.warn('Could not get auth headers for health check:', authError);
          // Continue with original response
        }
      }
      
      if (!response.ok) {
        // For health checks, don't throw on 401 - treat as server unavailable
        if (response.status === 401) {
          console.warn('Health check failed due to authentication - server may not be configured correctly');
          throw new Error('Server authentication not configured properly');
        }
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Health check result:', result);
      return result;
    } catch (error) {
      console.error('Health check failed:', error);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network connectivity issue detected during health check');
        console.error(`Health check URL: ${API_BASE_URL}/health`);
        console.error('This could indicate:');
        console.error('1. The Supabase Edge Functions are not deployed');
        console.error('2. The function name or URL is incorrect');
        console.error('3. Network connectivity issues');
        console.error('4. CORS configuration problems');
      } else if (error.message.includes('authentication')) {
        console.error('Authentication issue with health check');
        console.error('The server may require authentication even for health checks');
        console.error('This suggests the Edge Function security settings need adjustment');
      }
      
      throw error;
    }
  },

  // Simple connectivity test that doesn't require the Edge Function to be working
  async testConnectivity() {
    try {
      console.log('Testing basic Supabase connectivity...');
      const supabaseUrl = `https://${projectId}.supabase.co`;
      const response = await fetch(supabaseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Supabase base URL response: ${response.status}`);
      return response.status < 500; // Accept any non-server-error status
    } catch (error) {
      console.error('Basic connectivity test failed:', error);
      return false;
    }
  }
};

// Debug API for troubleshooting authentication issues
export const debugApi = {
  async checkUser() {
    try {
      return await apiCall('/debug/user');
    } catch (error) {
      console.error('Debug user check failed:', error);
      throw error;
    }
  }
};

// Communities API
export const communitiesApi = {
  // Create a new community
  async create(communityData: {
    name: string;
    description: string;
    category: string;
    location_name: string;
    location_coordinates?: [number, number];
    privacy_type: 'public' | 'private' | 'invite-only';
    rules_accepted: boolean;
    cover_image_url?: string;
    admin_contact: {
      name: string;
      email: string;
      phone: string;
    };
  }) {
    return apiCall('/communities', {
      method: 'POST',
      body: JSON.stringify(communityData)
    });
  },

  // Browse all communities
  async browse() {
    return apiCall('/communities/browse');
  },

  // Get specific community details
  async getDetails(communityId: string) {
    return apiCall(`/communities/${communityId}`);
  },

  // Join a community
  async join(communityId: string) {
    return apiCall(`/communities/${communityId}/join`, {
      method: 'POST'
    });
  },

  // Leave a community
  async leave(communityId: string) {
    return apiCall(`/communities/${communityId}/leave`, {
      method: 'DELETE'
    });
  },

  // Get user's communities
  async getMyCommunities() {
    return apiCall('/communities/my-communities');
  },

  // Search communities
  async search(params: {
    q?: string;
    category?: string;
    location?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append('q', params.q);
    if (params.category) searchParams.append('category', params.category);
    if (params.location) searchParams.append('location', params.location);
    
    return apiCall(`/communities/search?${searchParams.toString()}`);
  }
};