-- ========================================================================
-- SAHAAYA PLATFORM - COMMUNITY ACTIVITY FEED
-- ========================================================================
-- This script creates a live activity feed for communities that automatically
-- logs when users:
-- 1. Request help in a community
-- 2. Offer help on a request
-- ========================================================================

-- ========================================================================
-- STEP 1: CREATE activity_feed TABLE
-- ========================================================================

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.activity_feed CASCADE;

-- Create activity_feed table
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('request_help', 'offer_help')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_activity_feed_community_id ON public.activity_feed(community_id);
CREATE INDEX idx_activity_feed_actor_id ON public.activity_feed(actor_id);
CREATE INDEX idx_activity_feed_created_at ON public.activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_action_type ON public.activity_feed(action_type);

-- Add comments
COMMENT ON TABLE public.activity_feed IS
'Stores activity feed entries for communities. Automatically populated by triggers when users request or offer help.';

COMMENT ON COLUMN public.activity_feed.actor_id IS
'User who performed the action (requester or helper)';

COMMENT ON COLUMN public.activity_feed.target_id IS
'User affected by the action (e.g., requester when someone offers help)';

COMMENT ON COLUMN public.activity_feed.action_type IS
'Type of action: request_help or offer_help';

COMMENT ON COLUMN public.activity_feed.message IS
'Human-readable activity message displayed in the feed';

COMMENT ON COLUMN public.activity_feed.metadata IS
'Additional data (request_id, offer_id, request_title, etc.)';

SELECT '✅ activity_feed table created with indexes' AS status;

-- ========================================================================
-- STEP 2: CREATE RLS POLICIES FOR activity_feed
-- ========================================================================

-- Enable RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Policy: Community members can view activities in their communities
CREATE POLICY select_activity_feed
ON public.activity_feed
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.community_members cm
    WHERE cm.user_id = auth.uid()
      AND cm.community_id = activity_feed.community_id
  )
);

-- Policy: System can insert activities (triggers use SECURITY DEFINER)
-- No explicit INSERT policy needed since triggers use SECURITY DEFINER

COMMENT ON POLICY select_activity_feed ON public.activity_feed IS
'Allow community members to view activities in communities they belong to';

SELECT '✅ RLS policies created for activity_feed' AS status;

-- ========================================================================
-- STEP 3: GRANT PERMISSIONS
-- ========================================================================

-- Grant SELECT to authenticated users (controlled by RLS)
GRANT SELECT ON public.activity_feed TO authenticated;

SELECT '✅ Permissions granted on activity_feed' AS status;

-- ========================================================================
-- STEP 4: CREATE TRIGGER FOR HELP REQUEST ACTIVITY
-- ========================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trg_log_activity_on_help_request ON public.community_help_requests;
DROP FUNCTION IF EXISTS log_activity_on_help_request();

-- Create function to log help request activity
CREATE OR REPLACE FUNCTION log_activity_on_help_request()
RETURNS TRIGGER AS $$
DECLARE
  actor_name TEXT;
  community_name TEXT;
  activity_message TEXT;
BEGIN
  -- Log that trigger fired
  RAISE NOTICE '📋 Activity log trigger fired for help request ID: %', NEW.id;

  -- Get actor (requester) name
  SELECT COALESCE(full_name, email, 'A community member')
  INTO actor_name
  FROM public.user_profiles
  WHERE id = NEW.user_id;

  -- Get community name
  SELECT name
  INTO community_name
  FROM public.communities
  WHERE id = NEW.community_id;

  -- Build activity message
  activity_message := actor_name || ' requested help in "' || community_name || '"';

  RAISE NOTICE '✅ Activity message: %', activity_message;

  -- Insert activity entry
  INSERT INTO public.activity_feed (
    community_id,
    actor_id,
    target_id,
    action_type,
    message,
    metadata,
    created_at
  )
  VALUES (
    NEW.community_id,
    NEW.user_id,
    NULL, -- No target for help requests
    'request_help',
    activity_message,
    jsonb_build_object(
      'request_id', NEW.id,
      'request_title', NEW.title,
      'category', NEW.category,
      'urgency', NEW.urgency,
      'amount_needed', NEW.amount_needed
    ),
    NOW()
  );

  RAISE NOTICE '✅ Activity logged successfully for request ID: %', NEW.id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the request creation
    RAISE WARNING '❌ Failed to log activity for help request: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_activity_on_help_request() IS
'Automatically logs activity when a user requests help in a community.
Format: "{actor_name} requested help in {community_name}"
Uses SECURITY DEFINER to bypass RLS.';

-- Create trigger
CREATE TRIGGER trg_log_activity_on_help_request
AFTER INSERT ON public.community_help_requests
FOR EACH ROW
EXECUTE FUNCTION log_activity_on_help_request();

COMMENT ON TRIGGER trg_log_activity_on_help_request ON public.community_help_requests IS
'Triggers activity logging when a help request is created in a community';

SELECT '✅ Help request activity trigger created' AS status;

-- ========================================================================
-- STEP 5: CREATE TRIGGER FOR OFFER HELP ACTIVITY
-- ========================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trg_log_activity_on_help_offer ON public.community_help_offers;
DROP FUNCTION IF EXISTS log_activity_on_help_offer();

-- Create function to log offer help activity
CREATE OR REPLACE FUNCTION log_activity_on_help_offer()
RETURNS TRIGGER AS $$
DECLARE
  helper_name TEXT;
  requester_name TEXT;
  requester_id_var UUID;
  community_id_var UUID;
  community_name TEXT;
  request_title TEXT;
  activity_message TEXT;
BEGIN
  -- Log that trigger fired
  RAISE NOTICE '🤝 Activity log trigger fired for help offer ID: %', NEW.id;

  -- Get helper name
  SELECT COALESCE(full_name, email, 'A community member')
  INTO helper_name
  FROM public.user_profiles
  WHERE id = NEW.helper_id;

  -- Get requester info, community info, and request details
  SELECT 
    chr.user_id,
    chr.community_id,
    chr.title,
    c.name,
    COALESCE(up.full_name, up.email, 'A community member')
  INTO 
    requester_id_var,
    community_id_var,
    request_title,
    community_name,
    requester_name
  FROM public.community_help_requests chr
  JOIN public.communities c ON c.id = chr.community_id
  LEFT JOIN public.user_profiles up ON up.id = chr.user_id
  WHERE chr.id = NEW.help_request_id;

  IF requester_id_var IS NULL THEN
    RAISE WARNING '⚠️ Could not find requester for help request ID: %', NEW.help_request_id;
    RETURN NEW;
  END IF;

  -- Build activity message
  activity_message := helper_name || ' offered help to ' || requester_name || ' in "' || community_name || '"';

  RAISE NOTICE '✅ Activity message: %', activity_message;

  -- Insert activity entry
  INSERT INTO public.activity_feed (
    community_id,
    actor_id,
    target_id,
    action_type,
    message,
    metadata,
    created_at
  )
  VALUES (
    community_id_var,
    NEW.helper_id,
    requester_id_var,
    'offer_help',
    activity_message,
    jsonb_build_object(
      'offer_id', NEW.id,
      'request_id', NEW.help_request_id,
      'request_title', request_title,
      'helper_id', NEW.helper_id,
      'requester_id', requester_id_var
    ),
    NOW()
  );

  RAISE NOTICE '✅ Activity logged successfully for offer ID: %', NEW.id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the offer creation
    RAISE WARNING '❌ Failed to log activity for help offer: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_activity_on_help_offer() IS
'Automatically logs activity when a user offers help on a request.
Format: "{helper_name} offered help to {requester_name} in {community_name}"
Uses SECURITY DEFINER to bypass RLS.';

-- Create trigger
CREATE TRIGGER trg_log_activity_on_help_offer
AFTER INSERT ON public.community_help_offers
FOR EACH ROW
EXECUTE FUNCTION log_activity_on_help_offer();

COMMENT ON TRIGGER trg_log_activity_on_help_offer ON public.community_help_offers IS
'Triggers activity logging when a user offers help on a request';

SELECT '✅ Offer help activity trigger created' AS status;

-- ========================================================================
-- STEP 6: REFRESH POSTGREST SCHEMA CACHE
-- ========================================================================

NOTIFY pgrst, 'reload schema';

SELECT '✅ PostgREST schema cache refreshed' AS status;

-- ========================================================================
-- STEP 7: TEST DATA (OPTIONAL - UNCOMMENT TO RUN)
-- ========================================================================

/*
-- Create some test activity entries
DO $$
DECLARE
  test_community_id UUID;
  test_user1_id UUID;
  test_user2_id UUID;
BEGIN
  -- Get a test community
  SELECT id INTO test_community_id
  FROM public.communities
  LIMIT 1;

  -- Get two test users
  SELECT id INTO test_user1_id
  FROM auth.users
  LIMIT 1;

  SELECT id INTO test_user2_id
  FROM auth.users
  WHERE id != test_user1_id
  LIMIT 1;

  IF test_community_id IS NOT NULL AND test_user1_id IS NOT NULL THEN
    -- Insert test activity
    INSERT INTO public.activity_feed (
      community_id,
      actor_id,
      action_type,
      message,
      created_at
    )
    VALUES (
      test_community_id,
      test_user1_id,
      'request_help',
      'Test User requested help in "Test Community"',
      NOW() - INTERVAL '2 hours'
    );

    IF test_user2_id IS NOT NULL THEN
      INSERT INTO public.activity_feed (
        community_id,
        actor_id,
        target_id,
        action_type,
        message,
        created_at
      )
      VALUES (
        test_community_id,
        test_user2_id,
        test_user1_id,
        'offer_help',
        'Test Helper offered help to Test User in "Test Community"',
        NOW() - INTERVAL '1 hour'
      );
    END IF;

    RAISE NOTICE '✅ Test activity entries created';
  END IF;
END $$;
*/

-- ========================================================================
-- STEP 8: VERIFICATION QUERIES
-- ========================================================================

SELECT '=== VERIFICATION SUMMARY ===' AS status;

-- 1. Check table exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'activity_feed'
    )
    THEN '✅ activity_feed table exists'
    ELSE '❌ activity_feed table missing'
  END AS table_check;

-- 2. Check RLS is enabled
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = 'activity_feed'
        AND rowsecurity = true
    )
    THEN '✅ RLS enabled on activity_feed'
    ELSE '❌ RLS not enabled'
  END AS rls_check;

-- 3. Check help request trigger exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE event_object_table = 'community_help_requests'
        AND trigger_name = 'trg_log_activity_on_help_request'
    )
    THEN '✅ Help request activity trigger exists'
    ELSE '❌ Help request trigger missing'
  END AS request_trigger_check;

-- 4. Check help offer trigger exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE event_object_table = 'community_help_offers'
        AND trigger_name = 'trg_log_activity_on_help_offer'
    )
    THEN '✅ Help offer activity trigger exists'
    ELSE '❌ Help offer trigger missing'
  END AS offer_trigger_check;

-- 5. Check indexes
SELECT
  COUNT(*) AS index_count,
  ARRAY_AGG(indexname) AS indexes
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'activity_feed';

-- 6. Count existing activities
SELECT
  COUNT(*) AS total_activities,
  COUNT(CASE WHEN action_type = 'request_help' THEN 1 END) AS request_activities,
  COUNT(CASE WHEN action_type = 'offer_help' THEN 1 END) AS offer_activities
FROM public.activity_feed;

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================

SELECT
  '✅ COMMUNITY ACTIVITY FEED COMPLETE' AS status,
  'Activities will be logged automatically when users request or offer help' AS message,
  'Frontend can now fetch and display activities with real-time updates' AS next_step;

-- ========================================================================
-- USAGE EXAMPLES
-- ========================================================================

/*
FETCH ACTIVITIES FOR A COMMUNITY:

SELECT
  af.id,
  af.action_type,
  af.message,
  af.created_at,
  af.metadata,
  up.full_name AS actor_name,
  up.email AS actor_email
FROM activity_feed af
LEFT JOIN user_profiles up ON up.id = af.actor_id
WHERE af.community_id = '<your_community_id>'
ORDER BY af.created_at DESC
LIMIT 50;

SUBSCRIBE TO REAL-TIME UPDATES:

const channel = supabase
  .channel('activity_feed')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'activity_feed',
    filter: `community_id=eq.${communityId}`
  }, (payload) => {
    console.log('New activity:', payload.new);
    // Add to activity feed
  })
  .subscribe();

FETCH ACTIVITY WITH ACTOR DETAILS:

const { data } = await supabase
  .from('activity_feed')
  .select(`
    id,
    action_type,
    message,
    created_at,
    metadata,
    user_profiles!actor_id (
      full_name,
      email
    )
  `)
  .eq('community_id', communityId)
  .order('created_at', { ascending: false })
  .limit(50);
*/

-- ========================================================================
-- ROLLBACK INSTRUCTIONS (IF NEEDED)
-- ========================================================================

/*
IF YOU NEED TO ROLLBACK:

-- Drop triggers
DROP TRIGGER IF EXISTS trg_log_activity_on_help_offer ON public.community_help_offers;
DROP TRIGGER IF EXISTS trg_log_activity_on_help_request ON public.community_help_requests;

-- Drop functions
DROP FUNCTION IF EXISTS log_activity_on_help_offer();
DROP FUNCTION IF EXISTS log_activity_on_help_request();

-- Drop table
DROP TABLE IF EXISTS public.activity_feed CASCADE;

-- Refresh PostgREST
NOTIFY pgrst, 'reload schema';
*/

SELECT '📋 Script execution complete. Activity feed is ready!' AS final_status;
