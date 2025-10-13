import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Helper function to verify user authentication and get user data
async function authenticateUser(c: any) {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return { error: 'Authorization token required', status: 401 };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) {
    console.error('Auth error:', authError);
    return { error: 'Invalid or expired token', status: 401 };
  }

  return { user };
}

// Helper function to check if user can create communities
function canCreateCommunity(user: any): boolean {
  const userRole = user.user_metadata?.role;
  
  // NGOs can always create communities
  if (userRole === 'ngo') {
    return true;
  }
  
  // Individual users need to be verified or have high trust score
  const isVerified = user.user_metadata?.verified || false;
  const trustScore = user.user_metadata?.trust_score || 0;
  
  return isVerified || trustScore >= 4.0;
}

// Create a new community
app.post("/communities", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    const communityData = await c.req.json();
    const canCreate = canCreateCommunity(auth.user);
    const communityId = `COMM-${Date.now()}`;
    
    const community = {
      id: communityId,
      name: communityData.name,
      description: communityData.description,
      category: communityData.category,
      location_name: communityData.location_name,
      location_coordinates: communityData.location_coordinates || null,
      privacy_type: communityData.privacy_type,
      rules_accepted: communityData.rules_accepted,
      cover_image_url: communityData.cover_image_url || null,
      admin_contact: communityData.admin_contact,
      created_by: auth.user.id,
      created_by_name: auth.user.user_metadata?.name || auth.user.email,
      created_by_role: auth.user.user_metadata?.role,
      status: canCreate ? 'approved' : 'pending', // Auto-approve for verified users
      verified: canCreate,
      member_count: 1, // Creator is first member
      trust_score: 0, // Will be calculated based on member feedback
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      approved_at: canCreate ? new Date().toISOString() : null,
      approved_by: canCreate ? 'auto-approved' : null
    };

    // Store community
    await kv.set(`community:${communityId}`, community);
    
    // Add creator as admin member
    const membershipId = `MEMBER-${Date.now()}`;
    const membership = {
      id: membershipId,
      community_id: communityId,
      user_id: auth.user.id,
      user_name: auth.user.user_metadata?.name || auth.user.email,
      user_email: auth.user.email,
      role: 'admin',
      status: 'active',
      joined_at: new Date().toISOString(),
      invited_by: null
    };
    
    await kv.set(`community_member:${communityId}:${auth.user.id}`, membership);
    await kv.set(`user_communities:${auth.user.id}:${communityId}`, communityId);
    
    // If pending approval, create approval request
    if (!canCreate) {
      const approvalId = `APPROVAL-${Date.now()}`;
      const approvalRequest = {
        id: approvalId,
        community_id: communityId,
        requested_by: auth.user.id,
        request_reason: `Community creation request for: ${communityData.name}`,
        status: 'pending',
        created_at: new Date().toISOString(),
        reviewed_at: null,
        reviewed_by: null,
        admin_notes: null
      };
      
      await kv.set(`community_approval:${approvalId}`, approvalRequest);
    }

    console.log(`Community ${canCreate ? 'created' : 'requested'}: ${communityId} by user: ${auth.user.id}`);
    
    return c.json({ 
      message: canCreate 
        ? 'Community created successfully' 
        : 'Community creation request submitted for review',
      community,
      requires_approval: !canCreate
    });

  } catch (error) {
    console.error('Community creation error:', error);
    return c.json({ error: 'Internal server error during community creation' }, 500);
  }
});

// Browse all communities
app.get("/communities/browse", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    // Get all approved communities
    const communityKeys = await kv.getByPrefix('community:');
    const communities = [];

    for (const key of communityKeys) {
      const community = key.value;
      // Only show approved communities
      if (community && community.status === 'approved') {
        // Don't include sensitive admin data in browse results
        const publicCommunity = {
          id: community.id,
          name: community.name,
          description: community.description,
          category: community.category,
          location_name: community.location_name,
          location_coordinates: community.location_coordinates,
          privacy_type: community.privacy_type,
          member_count: community.member_count,
          verified: community.verified,
          trust_score: community.trust_score,
          cover_image_url: community.cover_image_url,
          created_at: community.created_at,
          admin_name: community.created_by_name
        };
        communities.push(publicCommunity);
      }
    }

    return c.json({ 
      communities: communities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) 
    });

  } catch (error) {
    console.error('Browse communities error:', error);
    return c.json({ error: 'Internal server error during communities browse' }, 500);
  }
});

// Get specific community details
app.get("/communities/:id", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    const communityId = c.req.param('id');
    const community = await kv.get(`community:${communityId}`);
    
    if (!community) {
      return c.json({ error: 'Community not found' }, 404);
    }

    // Check if user has access to this community
    const canAccess = community.status === 'approved' && 
                     (community.privacy_type === 'public' || 
                      community.created_by === auth.user.id ||
                      await kv.get(`community_member:${communityId}:${auth.user.id}`));

    if (!canAccess) {
      return c.json({ error: 'Access denied to this community' }, 403);
    }

    // Get community members if user has access
    const memberKeys = await kv.getByPrefix(`community_member:${communityId}:`);
    const members = memberKeys.map(key => ({
      id: key.value.id,
      user_name: key.value.user_name,
      role: key.value.role,
      status: key.value.status,
      joined_at: key.value.joined_at
    }));

    return c.json({ 
      community: {
        ...community,
        members
      }
    });

  } catch (error) {
    console.error('Get community details error:', error);
    return c.json({ error: 'Internal server error during community details fetch' }, 500);
  }
});

// Join a community
app.post("/communities/:id/join", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    const communityId = c.req.param('id');
    const community = await kv.get(`community:${communityId}`);
    
    if (!community || community.status !== 'approved') {
      return c.json({ error: 'Community not found or not available' }, 404);
    }

    // Check if already a member
    const existingMembership = await kv.get(`community_member:${communityId}:${auth.user.id}`);
    if (existingMembership) {
      return c.json({ error: 'Already a member of this community' }, 400);
    }

    const membershipId = `MEMBER-${Date.now()}`;
    const membership = {
      id: membershipId,
      community_id: communityId,
      user_id: auth.user.id,
      user_name: auth.user.user_metadata?.name || auth.user.email,
      user_email: auth.user.email,
      role: 'member',
      status: community.privacy_type === 'public' ? 'active' : 'pending',
      joined_at: new Date().toISOString(),
      invited_by: null
    };
    
    await kv.set(`community_member:${communityId}:${auth.user.id}`, membership);
    await kv.set(`user_communities:${auth.user.id}:${communityId}`, communityId);
    
    // Update member count if approved immediately
    if (membership.status === 'active') {
      community.member_count = (community.member_count || 0) + 1;
      community.updated_at = new Date().toISOString();
      await kv.set(`community:${communityId}`, community);
    }

    console.log(`User ${auth.user.id} ${membership.status === 'active' ? 'joined' : 'requested to join'} community: ${communityId}`);
    
    return c.json({ 
      message: membership.status === 'active' 
        ? 'Successfully joined community' 
        : 'Join request submitted for approval',
      membership,
      requires_approval: membership.status === 'pending'
    });

  } catch (error) {
    console.error('Join community error:', error);
    return c.json({ error: 'Internal server error during community join' }, 500);
  }
});

// Leave a community
app.delete("/communities/:id/leave", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    const communityId = c.req.param('id');
    const membership = await kv.get(`community_member:${communityId}:${auth.user.id}`);
    
    if (!membership) {
      return c.json({ error: 'Not a member of this community' }, 400);
    }

    // Can't leave if you're the only admin
    if (membership.role === 'admin') {
      const allMemberKeys = await kv.getByPrefix(`community_member:${communityId}:`);
      const adminCount = allMemberKeys.filter(key => key.value.role === 'admin' && key.value.status === 'active').length;
      
      if (adminCount <= 1) {
        return c.json({ error: 'Cannot leave community as the only admin. Transfer admin rights first.' }, 400);
      }
    }

    // Remove membership
    await kv.del(`community_member:${communityId}:${auth.user.id}`);
    await kv.del(`user_communities:${auth.user.id}:${communityId}`);
    
    // Update member count
    const community = await kv.get(`community:${communityId}`);
    if (community && membership.status === 'active') {
      community.member_count = Math.max((community.member_count || 1) - 1, 0);
      community.updated_at = new Date().toISOString();
      await kv.set(`community:${communityId}`, community);
    }

    console.log(`User ${auth.user.id} left community: ${communityId}`);
    
    return c.json({ message: 'Successfully left community' });

  } catch (error) {
    console.error('Leave community error:', error);
    return c.json({ error: 'Internal server error during community leave' }, 500);
  }
});

// Get user's communities
app.get("/communities/my-communities", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    // Get all community IDs for this user
    const userCommunityKeys = await kv.getByPrefix(`user_communities:${auth.user.id}:`);
    const communities = [];

    for (const key of userCommunityKeys) {
      const communityId = key.value;
      const community = await kv.get(`community:${communityId}`);
      const membership = await kv.get(`community_member:${communityId}:${auth.user.id}`);
      
      if (community && membership) {
        communities.push({
          ...community,
          my_role: membership.role,
          my_status: membership.status,
          joined_at: membership.joined_at
        });
      }
    }

    return c.json({ 
      communities: communities.sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()) 
    });

  } catch (error) {
    console.error('My communities retrieval error:', error);
    return c.json({ error: 'Internal server error during communities retrieval' }, 500);
  }
});

// Search communities
app.get("/communities/search", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    const query = c.req.query('q')?.toLowerCase() || '';
    const category = c.req.query('category');
    const location = c.req.query('location')?.toLowerCase();
    
    // Get all approved communities
    const communityKeys = await kv.getByPrefix('community:');
    let communities = [];

    for (const key of communityKeys) {
      const community = key.value;
      if (community && community.status === 'approved') {
        communities.push(community);
      }
    }

    // Apply filters
    if (query) {
      communities = communities.filter(community => 
        community.name.toLowerCase().includes(query) ||
        community.description.toLowerCase().includes(query) ||
        community.location_name.toLowerCase().includes(query)
      );
    }

    if (category) {
      communities = communities.filter(community => community.category === category);
    }

    if (location) {
      communities = communities.filter(community => 
        community.location_name.toLowerCase().includes(location)
      );
    }

    // Return public data only
    const publicCommunities = communities.map(community => ({
      id: community.id,
      name: community.name,
      description: community.description,
      category: community.category,
      location_name: community.location_name,
      privacy_type: community.privacy_type,
      member_count: community.member_count,
      verified: community.verified,
      trust_score: community.trust_score,
      created_at: community.created_at,
      admin_name: community.created_by_name
    }));

    return c.json({ 
      communities: publicCommunities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      total: publicCommunities.length
    });

  } catch (error) {
    console.error('Search communities error:', error);
    return c.json({ error: 'Internal server error during community search' }, 500);
  }
});

export default app;