import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import communityRoutes from "./communities.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-d76561a1/health", (c) => {
  console.log('Health check endpoint called');
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Sahaaya server is running"
  });
});

// Debug endpoint to check user authentication and role
app.get("/make-server-d76561a1/debug/user", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    return c.json({
      user: {
        id: auth.user.id,
        email: auth.user.email,
        role: auth.user.user_metadata?.role,
        metadata: auth.user.user_metadata,
        app_metadata: auth.user.app_metadata
      }
    });
  } catch (error) {
    console.error('Debug user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

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

  // Debug log to see what we're getting
  console.log('User authenticated:', {
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role,
    metadata: user.user_metadata
  });

  return { user };
}

// User profile endpoint - for updating user profiles after registration
app.post("/make-server-d76561a1/profile", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    const { name, phone } = await c.req.json();
    
    console.log('Profile update requested for user:', auth.user.id);
    return c.json({ 
      message: 'Profile updated successfully',
      user: {
        id: auth.user.id,
        email: auth.user.email,
        name: name,
        phone: phone
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return c.json({ error: 'Internal server error during profile update' }, 500);
  }
});

// Help Requests Endpoints - Individual Users Only

// Create a new help request (Individual users only)
app.post("/make-server-d76561a1/help-requests", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    const userRole = auth.user.user_metadata?.role;
    if (userRole !== 'individual') {
      return c.json({ error: 'Only individual users can create help requests' }, 403);
    }

    const requestData = await c.req.json();
    const requestId = `HR-${Date.now()}`;
    
    // Store help request in KV store with user ID for access control
    const helpRequest = {
      id: requestId,
      userId: auth.user.id,
      userEmail: auth.user.email,
      title: requestData.title,
      description: requestData.description,
      category: requestData.category,
      amount: requestData.amount,
      urgency: requestData.urgency,
      location: requestData.location,
      contactInfo: requestData.contactInfo,
      status: 'pending',
      responses: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`help_request:${requestId}`, helpRequest);
    await kv.set(`user_requests:${auth.user.id}:${requestId}`, requestId);

    console.log(`Help request created: ${requestId} by user: ${auth.user.id}`);
    return c.json({ message: 'Help request created successfully', request: helpRequest });

  } catch (error) {
    console.error('Help request creation error:', error);
    return c.json({ error: 'Internal server error during help request creation' }, 500);
  }
});

// Get user's own help requests (Individual users only)
app.get("/make-server-d76561a1/help-requests/my-requests", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    const userRole = auth.user.user_metadata?.role;
    if (userRole !== 'individual') {
      return c.json({ error: 'Only individual users can access this endpoint' }, 403);
    }

    // Get all request IDs for this user
    const userRequestKeys = await kv.getByPrefix(`user_requests:${auth.user.id}:`);
    const requests = [];

    for (const key of userRequestKeys) {
      const requestId = key.value;
      const request = await kv.get(`help_request:${requestId}`);
      if (request) {
        requests.push(request);
      }
    }

    return c.json({ requests: requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });

  } catch (error) {
    console.error('My requests retrieval error:', error);
    return c.json({ error: 'Internal server error during requests retrieval' }, 500);
  }
});

// Browse all help requests (Available to both roles)
app.get("/make-server-d76561a1/help-requests/browse", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    // Get all help requests
    const requestKeys = await kv.getByPrefix('help_request:');
    const requests = [];

    for (const key of requestKeys) {
      // Don't show user's own requests when browsing (for individual users)
      if (auth.user.user_metadata?.role === 'individual' && key.value.userId === auth.user.id) {
        continue;
      }
      requests.push(key.value);
    }

    return c.json({ 
      requests: requests
        .filter(r => r.status === 'pending') // Only show pending requests
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) 
    });

  } catch (error) {
    console.error('Browse requests error:', error);
    return c.json({ error: 'Internal server error during browse requests' }, 500);
  }
});

// Campaigns Endpoints - NGO Users Only

// Create a new campaign (NGO users only)
app.post("/make-server-d76561a1/campaigns", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    const userRole = auth.user.user_metadata?.role;
    if (userRole !== 'ngo') {
      return c.json({ error: 'Only NGO users can create campaigns' }, 403);
    }

    const campaignData = await c.req.json();
    const campaignId = `NG-${Date.now()}`;
    
    const campaign = {
      id: campaignId,
      ngoId: auth.user.id,
      ngoEmail: auth.user.email,
      ngoName: auth.user.user_metadata?.ngo_name || 'NGO',
      title: campaignData.title,
      description: campaignData.description,
      category: campaignData.category,
      targetAmount: campaignData.targetAmount,
      raisedAmount: 0,
      beneficiaries: campaignData.beneficiaries,
      deadline: campaignData.deadline,
      location: campaignData.location,
      status: 'active',
      donors: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`campaign:${campaignId}`, campaign);
    await kv.set(`ngo_campaigns:${auth.user.id}:${campaignId}`, campaignId);

    console.log(`Campaign created: ${campaignId} by NGO: ${auth.user.id}`);
    return c.json({ message: 'Campaign created successfully', campaign });

  } catch (error) {
    console.error('Campaign creation error:', error);
    return c.json({ error: 'Internal server error during campaign creation' }, 500);
  }
});

// Get NGO's own campaigns (NGO users only)
app.get("/make-server-d76561a1/campaigns/my-campaigns", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    const userRole = auth.user.user_metadata?.role;
    if (userRole !== 'ngo') {
      return c.json({ error: 'Only NGO users can access this endpoint' }, 403);
    }

    // Get all campaign IDs for this NGO
    const ngoCampaignKeys = await kv.getByPrefix(`ngo_campaigns:${auth.user.id}:`);
    const campaigns = [];

    for (const key of ngoCampaignKeys) {
      const campaignId = key.value;
      const campaign = await kv.get(`campaign:${campaignId}`);
      if (campaign) {
        campaigns.push(campaign);
      }
    }

    return c.json({ campaigns: campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });

  } catch (error) {
    console.error('My campaigns retrieval error:', error);
    return c.json({ error: 'Internal server error during campaigns retrieval' }, 500);
  }
});

// Browse all campaigns (Available to both roles)
app.get("/make-server-d76561a1/campaigns/browse", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    // Get all campaigns
    const campaignKeys = await kv.getByPrefix('campaign:');
    const campaigns = [];

    for (const key of campaignKeys) {
      campaigns.push(key.value);
    }

    return c.json({ 
      campaigns: campaigns
        .filter(c => c.status === 'active') // Only show active campaigns
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) 
    });

  } catch (error) {
    console.error('Browse campaigns error:', error);
    return c.json({ error: 'Internal server error during browse campaigns' }, 500);
  }
});

// User Contributions/Donations Tracking

// Record a contribution/donation
app.post("/make-server-d76561a1/contributions", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    const contributionData = await c.req.json();
    const contributionId = `CN-${Date.now()}`;
    
    const contribution = {
      id: contributionId,
      donorId: auth.user.id,
      donorEmail: auth.user.email,
      donorName: auth.user.user_metadata?.name || 'Anonymous',
      targetId: contributionData.targetId, // help request or campaign ID
      targetType: contributionData.targetType, // 'help_request' or 'campaign'
      amount: contributionData.amount,
      message: contributionData.message,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    await kv.set(`contribution:${contributionId}`, contribution);
    await kv.set(`user_contributions:${auth.user.id}:${contributionId}`, contributionId);

    console.log(`Contribution recorded: ${contributionId} by user: ${auth.user.id}`);
    return c.json({ message: 'Contribution recorded successfully', contribution });

  } catch (error) {
    console.error('Contribution recording error:', error);
    return c.json({ error: 'Internal server error during contribution recording' }, 500);
  }
});

// Get user's contributions
app.get("/make-server-d76561a1/contributions/my-contributions", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    // Get all contribution IDs for this user
    const userContributionKeys = await kv.getByPrefix(`user_contributions:${auth.user.id}:`);
    const contributions = [];

    for (const key of userContributionKeys) {
      const contributionId = key.value;
      const contribution = await kv.get(`contribution:${contributionId}`);
      if (contribution) {
        contributions.push(contribution);
      }
    }

    return c.json({ contributions: contributions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });

  } catch (error) {
    console.error('My contributions retrieval error:', error);
    return c.json({ error: 'Internal server error during contributions retrieval' }, 500);
  }
});

// Analytics endpoint for NGOs
app.get("/make-server-d76561a1/analytics/ngo-stats", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    const userRole = auth.user.user_metadata?.role;
    if (userRole !== 'ngo') {
      return c.json({ error: 'Only NGO users can access analytics' }, 403);
    }

    // Get NGO's campaigns
    const ngoCampaignKeys = await kv.getByPrefix(`ngo_campaigns:${auth.user.id}:`);
    let totalCampaigns = 0;
    let activeCampaigns = 0;
    let totalRaised = 0;
    let totalBeneficiaries = 0;

    for (const key of ngoCampaignKeys) {
      const campaignId = key.value;
      const campaign = await kv.get(`campaign:${campaignId}`);
      if (campaign) {
        totalCampaigns++;
        if (campaign.status === 'active') activeCampaigns++;
        totalRaised += campaign.raisedAmount || 0;
        totalBeneficiaries += campaign.beneficiaries || 0;
      }
    }

    const stats = {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns: totalCampaigns - activeCampaigns,
      totalBeneficiaries,
      fundsRaised: totalRaised,
      partneredDonors: 0, // Could be calculated from contributions
      impactScore: Math.floor(totalBeneficiaries * 2 + totalRaised / 1000)
    };

    return c.json({ stats });

  } catch (error) {
    console.error('NGO analytics error:', error);
    return c.json({ error: 'Internal server error during analytics retrieval' }, 500);
  }
});

// Analytics endpoint for Individual users
app.get("/make-server-d76561a1/analytics/individual-stats", async (c) => {
  try {
    const auth = await authenticateUser(c);
    if (auth.error) {
      return c.json({ error: auth.error }, auth.status);
    }

    const userRole = auth.user.user_metadata?.role;
    if (userRole !== 'individual') {
      return c.json({ error: 'Only individual users can access this analytics' }, 403);
    }

    // Get user's requests
    const userRequestKeys = await kv.getByPrefix(`user_requests:${auth.user.id}:`);
    let totalRequests = 0;
    let activeRequests = 0;
    let amountReceived = 0;

    for (const key of userRequestKeys) {
      const requestId = key.value;
      const request = await kv.get(`help_request:${requestId}`);
      if (request) {
        totalRequests++;
        if (request.status === 'pending') activeRequests++;
        if (request.status === 'completed') amountReceived += request.amount || 0;
      }
    }

    // Get user's contributions
    const userContributionKeys = await kv.getByPrefix(`user_contributions:${auth.user.id}:`);
    let totalDonated = 0;
    let totalHelped = 0;

    for (const key of userContributionKeys) {
      const contributionId = key.value;
      const contribution = await kv.get(`contribution:${contributionId}`);
      if (contribution) {
        totalDonated += contribution.amount || 0;
        totalHelped++;
      }
    }

    const stats = {
      totalRequests,
      activeRequests,
      completedRequests: totalRequests - activeRequests,
      totalHelped,
      totalDonated,
      amountReceived,
      impactScore: Math.floor(totalHelped * 10 + totalDonated / 100)
    };

    return c.json({ stats });

  } catch (error) {
    console.error('Individual analytics error:', error);
    return c.json({ error: 'Internal server error during analytics retrieval' }, 500);
  }
});

// Mount community routes
app.route('/make-server-d76561a1', communityRoutes);

// Seed pre-designed communities on server startup
async function seedPreDesignedCommunities() {
  try {
    console.log('Seeding pre-designed communities...');
    
    const preDesignedCommunities = [
      {
        id: 'COMM-MUMBAI-MED-001',
        name: 'Mumbai Medical Support Network',
        description: 'Connecting patients, doctors, and volunteers to provide emergency medical assistance and support in Mumbai region. Our network includes verified medical professionals, ambulance services, and blood donors.',
        category: 'Medical',
        location_name: 'Mumbai, Maharashtra',
        location_coordinates: [19.0760, 72.8777],
        privacy_type: 'public',
        rules_accepted: true,
        cover_image_url: null,
        admin_contact: 'contact@mumbaimedical.org',
        created_by: 'SYSTEM',
        created_by_name: 'Dr. Priya Sharma',
        created_by_role: 'ngo',
        status: 'approved',
        verified: true,
        member_count: 1247,
        trust_score: 4.8,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        approved_at: '2024-01-15T10:30:00Z',
        approved_by: 'admin'
      },
      {
        id: 'COMM-PUNE-EDU-002',
        name: 'Rural Education Initiative',
        description: 'Supporting education in rural areas through volunteer teachers, learning materials, and infrastructure development. We focus on providing quality education to underprivileged children in remote villages.',
        category: 'Educational',
        location_name: 'Pune District, Maharashtra',
        location_coordinates: [18.5204, 73.8567],
        privacy_type: 'public',
        rules_accepted: true,
        cover_image_url: null,
        admin_contact: 'info@ruraleducation.org',
        created_by: 'SYSTEM',
        created_by_name: 'Helping Hands NGO',
        created_by_role: 'ngo',
        status: 'approved',
        verified: true,
        member_count: 856,
        trust_score: 4.6,
        created_at: '2024-01-10T14:20:00Z',
        updated_at: '2024-01-10T14:20:00Z',
        approved_at: '2024-01-10T14:20:00Z',
        approved_by: 'admin'
      },
      {
        id: 'COMM-DELHI-FIN-003',
        name: 'Financial Literacy & Support',
        description: 'Providing financial education, microfinance opportunities, and emergency financial assistance to underserved communities. Learn budgeting, savings, and investment strategies.',
        category: 'Financial',
        location_name: 'Delhi NCR',
        location_coordinates: [28.6139, 77.2090],
        privacy_type: 'public',
        rules_accepted: true,
        cover_image_url: null,
        admin_contact: 'support@finliteracy.org',
        created_by: 'SYSTEM',
        created_by_name: 'Rajesh Kumar',
        created_by_role: 'individual',
        status: 'approved',
        verified: false,
        member_count: 643,
        trust_score: 4.2,
        created_at: '2024-01-08T09:15:00Z',
        updated_at: '2024-01-08T09:15:00Z',
        approved_at: '2024-01-08T09:15:00Z',
        approved_by: 'admin'
      },
      {
        id: 'COMM-BANG-EMO-004',
        name: 'Women Empowerment Circle',
        description: 'A safe space for women to share experiences, seek support, and access resources for personal and professional growth. We provide mentorship, skill development, and emotional support.',
        category: 'Emotional',
        location_name: 'Bangalore, Karnataka',
        location_coordinates: [12.9716, 77.5946],
        privacy_type: 'private',
        rules_accepted: true,
        cover_image_url: null,
        admin_contact: 'sneha@womenempowerment.org',
        created_by: 'SYSTEM',
        created_by_name: 'Sneha Patel',
        created_by_role: 'individual',
        status: 'approved',
        verified: true,
        member_count: 324,
        trust_score: 4.9,
        created_at: '2024-01-12T16:45:00Z',
        updated_at: '2024-01-12T16:45:00Z',
        approved_at: '2024-01-12T16:45:00Z',
        approved_by: 'admin'
      },
      {
        id: 'COMM-CHEN-EDU-005',
        name: 'Youth Mentorship Program',
        description: 'Connecting experienced professionals with young individuals seeking career guidance and life skills development. Our mentors come from diverse industries and backgrounds.',
        category: 'Educational',
        location_name: 'Chennai, Tamil Nadu',
        location_coordinates: [13.0827, 80.2707],
        privacy_type: 'invite-only',
        rules_accepted: true,
        cover_image_url: null,
        admin_contact: 'mentors@youthguidance.org',
        created_by: 'SYSTEM',
        created_by_name: 'Career Guidance Foundation',
        created_by_role: 'ngo',
        status: 'approved',
        verified: true,
        member_count: 189,
        trust_score: 4.7,
        created_at: '2024-01-18T11:30:00Z',
        updated_at: '2024-01-18T11:30:00Z',
        approved_at: '2024-01-18T11:30:00Z',
        approved_by: 'admin'
      },
      {
        id: 'COMM-HYD-MED-006',
        name: 'Hyderabad Mental Health Support',
        description: 'Providing mental health awareness, counseling support, and crisis intervention services. Our licensed counselors and peer support groups help individuals navigate mental health challenges.',
        category: 'Medical',
        location_name: 'Hyderabad, Telangana',
        location_coordinates: [17.3850, 78.4867],
        privacy_type: 'public',
        rules_accepted: true,
        cover_image_url: null,
        admin_contact: 'help@hydmentalhealth.org',
        created_by: 'SYSTEM',
        created_by_name: 'Dr. Arjun Reddy',
        created_by_role: 'ngo',
        status: 'approved',
        verified: true,
        member_count: 432,
        trust_score: 4.7,
        created_at: '2024-01-20T08:00:00Z',
        updated_at: '2024-01-20T08:00:00Z',
        approved_at: '2024-01-20T08:00:00Z',
        approved_by: 'admin'
      },
      {
        id: 'COMM-KOL-NGO-007',
        name: 'Kolkata Food Security Initiative',
        description: 'Fighting hunger and malnutrition through food distribution, community kitchens, and nutrition education programs. We partner with local restaurants and volunteers to provide meals.',
        category: 'NGO',
        location_name: 'Kolkata, West Bengal',
        location_coordinates: [22.5726, 88.3639],
        privacy_type: 'public',
        rules_accepted: true,
        cover_image_url: null,
        admin_contact: 'meals@kolkatafood.org',
        created_by: 'SYSTEM',
        created_by_name: 'Food For All Foundation',
        created_by_role: 'ngo',
        status: 'approved',
        verified: true,
        member_count: 1089,
        trust_score: 4.5,
        created_at: '2024-01-05T12:00:00Z',
        updated_at: '2024-01-05T12:00:00Z',
        approved_at: '2024-01-05T12:00:00Z',
        approved_by: 'admin'
      },
      {
        id: 'COMM-AHMD-FIN-008',
        name: 'Ahmedabad Entrepreneur Support Network',
        description: 'Supporting aspiring entrepreneurs and small business owners with funding guidance, mentorship, and networking opportunities. Connect with successful business leaders and investors.',
        category: 'Financial',
        location_name: 'Ahmedabad, Gujarat',
        location_coordinates: [23.0225, 72.5714],
        privacy_type: 'invite-only',
        rules_accepted: true,
        cover_image_url: null,
        admin_contact: 'support@ahmedabadentrepreneurs.org',
        created_by: 'SYSTEM',
        created_by_name: 'Business Incubator Hub',
        created_by_role: 'ngo',
        status: 'approved',
        verified: true,
        member_count: 267,
        trust_score: 4.4,
        created_at: '2024-01-22T14:30:00Z',
        updated_at: '2024-01-22T14:30:00Z',
        approved_at: '2024-01-22T14:30:00Z',
        approved_by: 'admin'
      },
      {
        id: 'COMM-JAIPUR-EMO-009',
        name: 'Jaipur Senior Citizens Care',
        description: 'Providing companionship, health monitoring, and assistance services for elderly community members. Our volunteers help with daily activities and provide emotional support.',
        category: 'Emotional',
        location_name: 'Jaipur, Rajasthan',
        location_coordinates: [26.9124, 75.7873],
        privacy_type: 'public',
        rules_accepted: true,
        cover_image_url: null,
        admin_contact: 'care@jaipurseniors.org',
        created_by: 'SYSTEM',
        created_by_name: 'Golden Years Foundation',
        created_by_role: 'ngo',
        status: 'approved',
        verified: true,
        member_count: 378,
        trust_score: 4.6,
        created_at: '2024-01-25T10:15:00Z',
        updated_at: '2024-01-25T10:15:00Z',
        approved_at: '2024-01-25T10:15:00Z',
        approved_by: 'admin'
      },
      {
        id: 'COMM-COIMBATORE-EDU-010',
        name: 'Coimbatore Tech Skills Development',
        description: 'Bridging the digital divide by teaching programming, digital literacy, and technical skills to underserved youth. Free coding bootcamps and computer training programs.',
        category: 'Educational',
        location_name: 'Coimbatore, Tamil Nadu',
        location_coordinates: [11.0168, 76.9558],
        privacy_type: 'public',
        rules_accepted: true,
        cover_image_url: null,
        admin_contact: 'learn@coimbatoretech.org',
        created_by: 'SYSTEM',
        created_by_name: 'Tech For Change Initiative',
        created_by_role: 'ngo',
        status: 'approved',
        verified: true,
        member_count: 523,
        trust_score: 4.3,
        created_at: '2024-01-28T16:20:00Z',
        updated_at: '2024-01-28T16:20:00Z',
        approved_at: '2024-01-28T16:20:00Z',
        approved_by: 'admin'
      },
      {
        id: 'COMM-LUCKNOW-MED-011',
        name: 'Lucknow Healthcare Volunteers',
        description: 'Volunteer healthcare professionals providing free medical checkups, health awareness campaigns, and emergency medical support in underserved areas of Lucknow.',
        category: 'Medical',
        location_name: 'Lucknow, Uttar Pradesh',
        location_coordinates: [26.8467, 80.9462],
        privacy_type: 'public',
        rules_accepted: true,
        cover_image_url: null,
        admin_contact: 'volunteers@lucknowhealth.org',
        created_by: 'SYSTEM',
        created_by_name: 'Dr. Kavita Singh',
        created_by_role: 'individual',
        status: 'approved',
        verified: true,
        member_count: 156,
        trust_score: 4.5,
        created_at: '2024-02-01T09:00:00Z',
        updated_at: '2024-02-01T09:00:00Z',
        approved_at: '2024-02-01T09:00:00Z',
        approved_by: 'admin'
      },
      {
        id: 'COMM-BHOPAL-NGO-012',
        name: 'Bhopal Environmental Action Group',
        description: 'Working towards environmental conservation, clean water initiatives, and sustainable living practices. Join us for tree plantation drives, clean-up campaigns, and eco-awareness programs.',
        category: 'NGO',
        location_name: 'Bhopal, Madhya Pradesh',
        location_coordinates: [23.2599, 77.4126],
        privacy_type: 'public',
        rules_accepted: true,
        cover_image_url: null,
        admin_contact: 'green@bhopalenvironment.org',
        created_by: 'SYSTEM',
        created_by_name: 'Green Earth Foundation',
        created_by_role: 'ngo',
        status: 'approved',
        verified: true,
        member_count: 734,
        trust_score: 4.4,
        created_at: '2024-02-03T11:45:00Z',
        updated_at: '2024-02-03T11:45:00Z',
        approved_at: '2024-02-03T11:45:00Z',
        approved_by: 'admin'
      }
    ];

    // Check if communities already exist to avoid duplicates
    for (const community of preDesignedCommunities) {
      const existingCommunity = await kv.get(`community:${community.id}`);
      if (!existingCommunity) {
        await kv.set(`community:${community.id}`, community);
        console.log(`Seeded community: ${community.name}`);
      }
    }

    console.log('Pre-designed communities seeding completed.');
  } catch (error) {
    console.error('Error seeding pre-designed communities:', error);
  }
}

// Call seeding function on startup
seedPreDesignedCommunities();

Deno.serve(app.fetch);