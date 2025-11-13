-- ========================================================================
-- SAHAAYA PLATFORM - FIX COMMUNITY ISSUES
-- ========================================================================
-- This script fixes:
-- 1. RLS policies blocking legitimate members from requesting help
-- 2. Member count showing +1 extra (double counting creator)
-- Run this in Supabase SQL Editor
-- ========================================================================

-- ========================================================================
-- PART 1: FIX RLS POLICIES FOR COMMUNITY_HELP_REQUESTS
-- ========================================================================

-- Drop existing policies
DROP POLICY IF EXISTS insert_community_help_request ON public.community_help_requests;
DROP POLICY IF EXISTS select_community_help_request ON public.community_help_requests;
DROP POLICY IF EXISTS select_community_help_requests ON public.community_help_requests;
DROP POLICY IF EXISTS insert_community_help_requests ON public.community_help_requests;

-- Create correct INSERT policy - only members can create help requests
CREATE POLICY insert_community_help_request
ON public.community_help_requests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.community_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.community_id = community_help_requests.community_id
  )
);

-- Create correct SELECT policy - only members can view help requests
CREATE POLICY select_community_help_request
ON public.community_help_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.community_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.community_id = community_help_requests.community_id
  )
);

-- Allow users to update their own help requests (if needed)
DROP POLICY IF EXISTS update_community_help_request ON public.community_help_requests;

CREATE POLICY update_community_help_request
ON public.community_help_requests
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ========================================================================
-- PART 2: FIX MEMBER COUNT DUPLICATION
-- ========================================================================

-- First, let's check and fix existing triggers
-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS trg_increment_member_count ON public.community_members;
DROP TRIGGER IF EXISTS trg_decrement_member_count ON public.community_members;

-- Create improved increment function that doesn't double-count creator
CREATE OR REPLACE FUNCTION increment_community_member_count()
RETURNS TRIGGER AS $$
DECLARE
  is_first_member BOOLEAN;
BEGIN
  -- Check if this is the first member (creator/admin being added during community creation)
  SELECT COUNT(*) = 0 INTO is_first_member
  FROM public.community_members
  WHERE community_id = NEW.community_id;
  
  -- If this is NOT the first member, increment the count
  -- The first member (creator) count is already set to 1 during community creation
  IF NOT is_first_member THEN
    UPDATE public.communities
    SET members_count = members_count + 1,
        updated_at = NOW()
    WHERE id = NEW.community_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create decrement function for when members leave
CREATE OR REPLACE FUNCTION decrement_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.communities
  SET members_count = GREATEST(members_count - 1, 0),
      updated_at = NOW()
  WHERE id = OLD.community_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trg_increment_member_count
AFTER INSERT ON public.community_members
FOR EACH ROW
EXECUTE FUNCTION increment_community_member_count();

CREATE TRIGGER trg_decrement_member_count
AFTER DELETE ON public.community_members
FOR EACH ROW
EXECUTE FUNCTION decrement_community_member_count();

-- ========================================================================
-- PART 3: SYNC EXISTING MEMBER COUNTS (FIX EXISTING DATA)
-- ========================================================================

-- Recalibrate all community member counts to match actual member count
UPDATE public.communities c
SET members_count = (
  SELECT COUNT(*)
  FROM public.community_members cm
  WHERE cm.community_id = c.id
),
updated_at = NOW()
WHERE EXISTS (
  SELECT 1
  FROM public.community_members cm
  WHERE cm.community_id = c.id
);

-- ========================================================================
-- PART 4: VERIFICATION QUERIES
-- ========================================================================

-- Check RLS policies are correctly created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'community_help_requests'
ORDER BY policyname;

-- Check triggers are correctly created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'community_members'
  AND trigger_name IN ('trg_increment_member_count', 'trg_decrement_member_count')
ORDER BY trigger_name;

-- Verify member counts match actual members
SELECT 
  c.id,
  c.name,
  c.members_count AS recorded_count,
  COUNT(cm.id) AS actual_count,
  c.members_count - COUNT(cm.id) AS difference
FROM public.communities c
LEFT JOIN public.community_members cm ON cm.community_id = c.id
GROUP BY c.id, c.name, c.members_count
HAVING c.members_count != COUNT(cm.id);

-- If the above query returns any rows, those communities have mismatched counts
-- The sync query in PART 3 should have fixed them

-- ========================================================================
-- PART 5: TEST QUERIES (OPTIONAL - FOR VALIDATION)
-- ========================================================================

/*
-- Test 1: Check a specific community's members
SELECT 
  c.name AS community_name,
  c.members_count,
  cm.user_id,
  cm.role,
  cm.joined_at,
  u.email
FROM public.communities c
LEFT JOIN public.community_members cm ON cm.community_id = c.id
LEFT JOIN auth.users u ON u.id = cm.user_id
WHERE c.id = 'YOUR_COMMUNITY_ID_HERE'
ORDER BY cm.joined_at;

-- Test 2: Check if a specific user is a member of a community
SELECT 
  cm.id,
  cm.role,
  cm.joined_at,
  c.name AS community_name
FROM public.community_members cm
JOIN public.communities c ON c.id = cm.community_id
WHERE cm.user_id = auth.uid()
  AND cm.community_id = 'YOUR_COMMUNITY_ID_HERE';

-- Test 3: List all communities with their actual vs recorded member counts
SELECT 
  c.id,
  c.name,
  c.members_count AS recorded_count,
  COUNT(cm.id) AS actual_count,
  CASE 
    WHEN c.members_count = COUNT(cm.id) THEN '✅ Match'
    ELSE '❌ Mismatch'
  END AS status
FROM public.communities c
LEFT JOIN public.community_members cm ON cm.community_id = c.id
GROUP BY c.id, c.name, c.members_count
ORDER BY c.name;
*/

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================
-- If this script runs without errors, your issues are fixed!
-- ✅ Members can now request help in communities they've joined
-- ✅ Member counts are accurate (no +1 duplication)
-- ✅ Existing data has been synced
-- ========================================================================
