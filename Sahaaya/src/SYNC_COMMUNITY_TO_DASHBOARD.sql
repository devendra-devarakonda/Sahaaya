-- ========================================================================
-- SAHAAYA PLATFORM - SYNC COMMUNITY ACTIVITIES TO DASHBOARD
-- ========================================================================
-- This script synchronizes community help requests and offers with
-- the user's dashboard tabs ("My Requests" and "My Contributions")
-- ========================================================================

-- ========================================================================
-- STEP 1: CREATE DASHBOARD TRACKING TABLES
-- ========================================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.user_dashboard_contributions CASCADE;
DROP TABLE IF EXISTS public.user_dashboard_requests CASCADE;

-- Create user_dashboard_requests table
CREATE TABLE public.user_dashboard_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('global', 'community')),
  source_id UUID NOT NULL, -- either help_requests.id or community_help_requests.id
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  amount NUMERIC(12,2),
  urgency TEXT,
  status TEXT DEFAULT 'pending',
  supporters INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_type, source_id) -- Prevent duplicates
);

-- Create user_dashboard_contributions table
CREATE TABLE public.user_dashboard_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('global', 'community')),
  source_id UUID NOT NULL, -- either help_offers.id or community_help_offers.id
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  request_id UUID, -- Reference to the help request (global or community)
  contribution_type TEXT DEFAULT 'help_offer',
  amount NUMERIC(12,2),
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_type, source_id) -- Prevent duplicates
);

-- Create indexes for performance
CREATE INDEX idx_dashboard_requests_user_id ON public.user_dashboard_requests(user_id);
CREATE INDEX idx_dashboard_requests_created_at ON public.user_dashboard_requests(created_at DESC);
CREATE INDEX idx_dashboard_requests_source ON public.user_dashboard_requests(source_type, source_id);
CREATE INDEX idx_dashboard_requests_community ON public.user_dashboard_requests(community_id);

CREATE INDEX idx_dashboard_contributions_user_id ON public.user_dashboard_contributions(user_id);
CREATE INDEX idx_dashboard_contributions_created_at ON public.user_dashboard_contributions(created_at DESC);
CREATE INDEX idx_dashboard_contributions_source ON public.user_dashboard_contributions(source_type, source_id);
CREATE INDEX idx_dashboard_contributions_community ON public.user_dashboard_contributions(community_id);

-- Add comments
COMMENT ON TABLE public.user_dashboard_requests IS
'Aggregated view of all help requests (global + community) for user dashboard';

COMMENT ON TABLE public.user_dashboard_contributions IS
'Aggregated view of all contributions (global + community) for user dashboard';

COMMENT ON COLUMN public.user_dashboard_requests.source_type IS
'Origin of request: global or community';

COMMENT ON COLUMN public.user_dashboard_requests.source_id IS
'ID of the original request in help_requests or community_help_requests';

COMMENT ON COLUMN public.user_dashboard_contributions.source_type IS
'Origin of contribution: global or community';

COMMENT ON COLUMN public.user_dashboard_contributions.source_id IS
'ID of the original offer in help_offers or community_help_offers';

SELECT '✅ Dashboard tracking tables created with indexes' AS status;

-- ========================================================================
-- STEP 2: CREATE RLS POLICIES
-- ========================================================================

-- Enable RLS on both tables
ALTER TABLE public.user_dashboard_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dashboard_contributions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own dashboard requests
CREATE POLICY select_own_dashboard_requests
ON public.user_dashboard_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can view their own dashboard contributions
CREATE POLICY select_own_dashboard_contributions
ON public.user_dashboard_contributions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

COMMENT ON POLICY select_own_dashboard_requests ON public.user_dashboard_requests IS
'Allow users to view only their own dashboard requests';

COMMENT ON POLICY select_own_dashboard_contributions ON public.user_dashboard_contributions IS
'Allow users to view only their own dashboard contributions';

-- Grant permissions
GRANT SELECT ON public.user_dashboard_requests TO authenticated;
GRANT SELECT ON public.user_dashboard_contributions TO authenticated;

SELECT '✅ RLS policies and permissions configured' AS status;

-- ========================================================================
-- STEP 3: TRIGGER FOR COMMUNITY HELP REQUEST → MY REQUESTS
-- ========================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trg_sync_request_to_dashboard ON public.community_help_requests;
DROP FUNCTION IF EXISTS sync_request_to_dashboard();

-- Create function to sync community request to dashboard
CREATE OR REPLACE FUNCTION sync_request_to_dashboard()
RETURNS TRIGGER AS $$
DECLARE
  community_name TEXT;
BEGIN
  -- Log trigger execution
  RAISE NOTICE '📋 Syncing community help request to dashboard: request_id=%, user_id=%', NEW.id, NEW.user_id;

  -- Get community name
  SELECT name INTO community_name
  FROM public.communities
  WHERE id = NEW.community_id;

  -- Insert into dashboard requests (or update if exists)
  INSERT INTO public.user_dashboard_requests (
    user_id,
    source_type,
    source_id,
    community_id,
    title,
    description,
    category,
    amount,
    urgency,
    status,
    supporters,
    created_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    'community',
    NEW.id,
    NEW.community_id,
    NEW.title,
    NEW.description,
    NEW.category,
    NEW.amount_needed,
    NEW.urgency,
    NEW.status,
    COALESCE(NEW.supporters, 0),
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (source_type, source_id)
  DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    amount = EXCLUDED.amount,
    urgency = EXCLUDED.urgency,
    status = EXCLUDED.status,
    supporters = EXCLUDED.supporters,
    updated_at = EXCLUDED.updated_at;

  RAISE NOTICE '✅ Successfully synced community request to dashboard for user %', NEW.user_id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Failed to sync request to dashboard: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_request_to_dashboard() IS
'Automatically syncs community help requests to user dashboard.
Triggers on INSERT and UPDATE of community_help_requests.';

-- Create trigger for INSERT
CREATE TRIGGER trg_sync_request_to_dashboard
AFTER INSERT ON public.community_help_requests
FOR EACH ROW
EXECUTE FUNCTION sync_request_to_dashboard();

COMMENT ON TRIGGER trg_sync_request_to_dashboard ON public.community_help_requests IS
'Syncs new community help requests to user dashboard';

-- Create trigger for UPDATE (to sync status changes)
CREATE TRIGGER trg_sync_request_update_to_dashboard
AFTER UPDATE ON public.community_help_requests
FOR EACH ROW
WHEN (
  OLD.status IS DISTINCT FROM NEW.status OR
  OLD.supporters IS DISTINCT FROM NEW.supporters OR
  OLD.title IS DISTINCT FROM NEW.title
)
EXECUTE FUNCTION sync_request_to_dashboard();

COMMENT ON TRIGGER trg_sync_request_update_to_dashboard ON public.community_help_requests IS
'Syncs community help request updates to user dashboard';

SELECT '✅ Community request → Dashboard sync triggers created' AS status;

-- ========================================================================
-- STEP 4: TRIGGER FOR COMMUNITY HELP OFFER → MY CONTRIBUTIONS
-- ========================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trg_sync_offer_to_dashboard ON public.community_help_offers;
DROP FUNCTION IF EXISTS sync_offer_to_dashboard();

-- Create function to sync community offer to dashboard
CREATE OR REPLACE FUNCTION sync_offer_to_dashboard()
RETURNS TRIGGER AS $$
DECLARE
  community_id_var UUID;
  community_name TEXT;
BEGIN
  -- Log trigger execution
  RAISE NOTICE '🤝 Syncing community help offer to dashboard: offer_id=%, helper_id=%', NEW.id, NEW.helper_id;

  -- Get community_id from the help request
  SELECT community_id INTO community_id_var
  FROM public.community_help_requests
  WHERE id = NEW.help_request_id;

  IF community_id_var IS NULL THEN
    RAISE WARNING '⚠️ Could not find community for help request %', NEW.help_request_id;
    RETURN NEW;
  END IF;

  -- Get community name
  SELECT name INTO community_name
  FROM public.communities
  WHERE id = community_id_var;

  -- Insert into dashboard contributions (or update if exists)
  INSERT INTO public.user_dashboard_contributions (
    user_id,
    source_type,
    source_id,
    community_id,
    request_id,
    contribution_type,
    message,
    status,
    created_at
  )
  VALUES (
    NEW.helper_id,
    'community',
    NEW.id,
    community_id_var,
    NEW.help_request_id,
    'help_offer',
    NEW.message,
    NEW.status,
    NEW.created_at
  )
  ON CONFLICT (source_type, source_id)
  DO UPDATE SET
    status = EXCLUDED.status,
    message = EXCLUDED.message;

  RAISE NOTICE '✅ Successfully synced community offer to dashboard for user %', NEW.helper_id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Failed to sync offer to dashboard: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_offer_to_dashboard() IS
'Automatically syncs community help offers to user dashboard.
Triggers on INSERT and UPDATE of community_help_offers.';

-- Create trigger for INSERT
CREATE TRIGGER trg_sync_offer_to_dashboard
AFTER INSERT ON public.community_help_offers
FOR EACH ROW
EXECUTE FUNCTION sync_offer_to_dashboard();

COMMENT ON TRIGGER trg_sync_offer_to_dashboard ON public.community_help_offers IS
'Syncs new community help offers to user dashboard';

-- Create trigger for UPDATE (to sync status changes)
CREATE TRIGGER trg_sync_offer_update_to_dashboard
AFTER UPDATE ON public.community_help_offers
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION sync_offer_to_dashboard();

COMMENT ON TRIGGER trg_sync_offer_update_to_dashboard ON public.community_help_offers IS
'Syncs community help offer updates to user dashboard';

SELECT '✅ Community offer → Dashboard sync triggers created' AS status;

-- ========================================================================
-- STEP 5: BACKFILL EXISTING DATA (OPTIONAL)
-- ========================================================================

-- Backfill existing community help requests
INSERT INTO public.user_dashboard_requests (
  user_id,
  source_type,
  source_id,
  community_id,
  title,
  description,
  category,
  amount,
  urgency,
  status,
  supporters,
  created_at,
  updated_at
)
SELECT
  chr.user_id,
  'community'::TEXT,
  chr.id,
  chr.community_id,
  chr.title,
  chr.description,
  chr.category,
  chr.amount_needed,
  chr.urgency,
  chr.status,
  COALESCE(chr.supporters, 0),
  chr.created_at,
  chr.updated_at
FROM public.community_help_requests chr
ON CONFLICT (source_type, source_id) DO NOTHING;

-- Backfill existing community help offers
INSERT INTO public.user_dashboard_contributions (
  user_id,
  source_type,
  source_id,
  community_id,
  request_id,
  contribution_type,
  message,
  status,
  created_at
)
SELECT
  cho.helper_id,
  'community'::TEXT,
  cho.id,
  chr.community_id,
  cho.help_request_id,
  'help_offer',
  cho.message,
  cho.status,
  cho.created_at
FROM public.community_help_offers cho
JOIN public.community_help_requests chr ON chr.id = cho.help_request_id
ON CONFLICT (source_type, source_id) DO NOTHING;

SELECT '✅ Backfilled existing community data to dashboard tables' AS status;

-- ========================================================================
-- STEP 6: REFRESH POSTGREST SCHEMA CACHE
-- ========================================================================

NOTIFY pgrst, 'reload schema';

SELECT '✅ PostgREST schema cache refreshed' AS status;

-- ========================================================================
-- STEP 7: VERIFICATION QUERIES
-- ========================================================================

SELECT '=== VERIFICATION SUMMARY ===' AS status;

-- 1. Check tables exist
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'user_dashboard_requests'
    )
    THEN '✅ user_dashboard_requests table exists'
    ELSE '❌ user_dashboard_requests table missing'
  END AS requests_table_check;

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'user_dashboard_contributions'
    )
    THEN '✅ user_dashboard_contributions table exists'
    ELSE '❌ user_dashboard_contributions table missing'
  END AS contributions_table_check;

-- 2. Check RLS enabled
SELECT
  tablename,
  CASE
    WHEN rowsecurity = true THEN '✅ RLS enabled'
    ELSE '❌ RLS not enabled'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_dashboard_requests', 'user_dashboard_contributions');

-- 3. Check triggers exist
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('community_help_requests', 'community_help_offers')
  AND trigger_name LIKE '%dashboard%'
ORDER BY event_object_table, trigger_name;

-- 4. Count dashboard entries
SELECT
  COUNT(*) AS total_requests,
  COUNT(CASE WHEN source_type = 'community' THEN 1 END) AS community_requests,
  COUNT(CASE WHEN source_type = 'global' THEN 1 END) AS global_requests
FROM public.user_dashboard_requests;

SELECT
  COUNT(*) AS total_contributions,
  COUNT(CASE WHEN source_type = 'community' THEN 1 END) AS community_contributions,
  COUNT(CASE WHEN source_type = 'global' THEN 1 END) AS global_contributions
FROM public.user_dashboard_contributions;

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================

SELECT
  '✅ COMMUNITY → DASHBOARD SYNC COMPLETE' AS status,
  'Community requests and offers now sync to user dashboard automatically' AS message,
  'Users can view all their activities in one place' AS benefit;

-- ========================================================================
-- USAGE EXAMPLES
-- ========================================================================

/*
FETCH USER'S DASHBOARD REQUESTS (Global + Community):

SELECT
  dr.id,
  dr.source_type,
  dr.title,
  dr.description,
  dr.category,
  dr.amount,
  dr.urgency,
  dr.status,
  dr.supporters,
  dr.created_at,
  c.name AS community_name
FROM user_dashboard_requests dr
LEFT JOIN communities c ON c.id = dr.community_id
WHERE dr.user_id = auth.uid()
ORDER BY dr.created_at DESC;

FETCH USER'S DASHBOARD CONTRIBUTIONS (Global + Community):

SELECT
  dc.id,
  dc.source_type,
  dc.contribution_type,
  dc.message,
  dc.status,
  dc.created_at,
  c.name AS community_name
FROM user_dashboard_contributions dc
LEFT JOIN communities c ON c.id = dc.community_id
WHERE dc.user_id = auth.uid()
ORDER BY dc.created_at DESC;

SUBSCRIBE TO REAL-TIME UPDATES:

const requestsChannel = supabase
  .channel('user_dashboard_requests')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'user_dashboard_requests',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('New request:', payload.new);
  })
  .subscribe();
*/

-- ========================================================================
-- ROLLBACK INSTRUCTIONS (IF NEEDED)
-- ========================================================================

/*
IF YOU NEED TO ROLLBACK:

-- Drop triggers
DROP TRIGGER IF EXISTS trg_sync_offer_update_to_dashboard ON public.community_help_offers;
DROP TRIGGER IF EXISTS trg_sync_offer_to_dashboard ON public.community_help_offers;
DROP TRIGGER IF EXISTS trg_sync_request_update_to_dashboard ON public.community_help_requests;
DROP TRIGGER IF EXISTS trg_sync_request_to_dashboard ON public.community_help_requests;

-- Drop functions
DROP FUNCTION IF EXISTS sync_offer_to_dashboard();
DROP FUNCTION IF EXISTS sync_request_to_dashboard();

-- Drop tables
DROP TABLE IF EXISTS public.user_dashboard_contributions CASCADE;
DROP TABLE IF EXISTS public.user_dashboard_requests CASCADE;

-- Refresh PostgREST
NOTIFY pgrst, 'reload schema';
*/

SELECT '📋 Script execution complete. Dashboard sync is live!' AS final_status;
