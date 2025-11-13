-- ========================================================================
-- SAHAAYA PLATFORM - CREATE COMMUNITY HELP REQUESTS & OFFERS TABLES
-- ========================================================================
-- This script creates tables for community-scoped help requests
-- Run this in Supabase SQL Editor
-- ========================================================================

-- ========================================================================
-- STEP 1: CREATE COMMUNITY_HELP_REQUESTS TABLE
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.community_help_requests (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Community reference
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  
  -- User reference (who created this request)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Request details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  
  -- Financial information
  amount_needed NUMERIC(10, 2),
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'in_progress', 'completed', 'cancelled')),
  supporters INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ========================================================================
-- STEP 2: CREATE COMMUNITY_HELP_OFFERS TABLE
-- ========================================================================

CREATE TABLE IF NOT EXISTS public.community_help_offers (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- References
  help_request_id UUID NOT NULL REFERENCES public.community_help_requests(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  
  -- Offer details
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'declined')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ========================================================================
-- STEP 3: CREATE INDEXES
-- ========================================================================

CREATE INDEX IF NOT EXISTS idx_community_help_requests_community_id 
  ON public.community_help_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_community_help_requests_user_id 
  ON public.community_help_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_community_help_requests_status 
  ON public.community_help_requests(status);
CREATE INDEX IF NOT EXISTS idx_community_help_requests_created_at 
  ON public.community_help_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_help_offers_help_request_id 
  ON public.community_help_offers(help_request_id);
CREATE INDEX IF NOT EXISTS idx_community_help_offers_helper_id 
  ON public.community_help_offers(helper_id);
CREATE INDEX IF NOT EXISTS idx_community_help_offers_requester_id 
  ON public.community_help_offers(requester_id);
CREATE INDEX IF NOT EXISTS idx_community_help_offers_community_id 
  ON public.community_help_offers(community_id);

-- ========================================================================
-- STEP 4: CREATE TRIGGERS FOR UPDATED_AT
-- ========================================================================

DROP TRIGGER IF EXISTS update_community_help_requests_updated_at ON public.community_help_requests;
CREATE TRIGGER update_community_help_requests_updated_at 
  BEFORE UPDATE ON public.community_help_requests
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_help_offers_updated_at ON public.community_help_offers;
CREATE TRIGGER update_community_help_offers_updated_at 
  BEFORE UPDATE ON public.community_help_offers
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ========================================================================

ALTER TABLE public.community_help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_help_offers ENABLE ROW LEVEL SECURITY;

-- ========================================================================
-- STEP 6: DROP EXISTING POLICIES (IF RECREATING)
-- ========================================================================

DROP POLICY IF EXISTS "Community members can insert help requests" ON public.community_help_requests;
DROP POLICY IF EXISTS "Community members can view help requests" ON public.community_help_requests;
DROP POLICY IF EXISTS "Users can update their own community requests" ON public.community_help_requests;
DROP POLICY IF EXISTS "Users can delete their own community requests" ON public.community_help_requests;

DROP POLICY IF EXISTS "Community members can insert help offers" ON public.community_help_offers;
DROP POLICY IF EXISTS "Community members can view help offers" ON public.community_help_offers;
DROP POLICY IF EXISTS "Users can update their own offers" ON public.community_help_offers;

-- ========================================================================
-- STEP 7: CREATE RLS POLICIES FOR COMMUNITY_HELP_REQUESTS
-- ========================================================================

-- Policy 1: INSERT - Community members can create help requests
CREATE POLICY "Community members can insert help requests"
ON public.community_help_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE user_id = auth.uid() 
    AND community_id = community_help_requests.community_id
    AND status = 'active'
  )
);

-- Policy 2: SELECT - Community members can view help requests in their communities
CREATE POLICY "Community members can view help requests"
ON public.community_help_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE user_id = auth.uid() 
    AND community_id = community_help_requests.community_id
    AND status = 'active'
  )
);

-- Policy 3: UPDATE - Users can update their own community requests
CREATE POLICY "Users can update their own community requests"
ON public.community_help_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: DELETE - Users can delete their own community requests
CREATE POLICY "Users can delete their own community requests"
ON public.community_help_requests
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ========================================================================
-- STEP 8: CREATE RLS POLICIES FOR COMMUNITY_HELP_OFFERS
-- ========================================================================

-- Policy 1: INSERT - Community members can create help offers
CREATE POLICY "Community members can insert help offers"
ON public.community_help_offers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = helper_id AND
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE user_id = auth.uid() 
    AND community_id = community_help_offers.community_id
    AND status = 'active'
  )
);

-- Policy 2: SELECT - Community members can view offers in their communities
CREATE POLICY "Community members can view help offers"
ON public.community_help_offers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE user_id = auth.uid() 
    AND community_id = community_help_offers.community_id
    AND status = 'active'
  )
);

-- Policy 3: UPDATE - Users can update their own offers
CREATE POLICY "Users can update their own offers"
ON public.community_help_offers
FOR UPDATE
TO authenticated
USING (auth.uid() = helper_id)
WITH CHECK (auth.uid() = helper_id);

-- ========================================================================
-- STEP 9: GRANT PERMISSIONS
-- ========================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_help_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_help_offers TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ========================================================================
-- STEP 10: VERIFICATION QUERIES
-- ========================================================================

-- Check if tables exist
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'community_help_requests'
) AS community_help_requests_exists;

SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'community_help_offers'
) AS community_help_offers_exists;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('community_help_requests', 'community_help_offers');

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('community_help_requests', 'community_help_offers')
ORDER BY tablename, policyname;

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================
-- If this script runs without errors, your community help tables are ready!
-- Next steps:
-- 1. Enable Realtime for both tables in Supabase Dashboard
-- 2. Update the frontend to use these new tables
-- 3. Test creating requests and offers within communities
-- ========================================================================
