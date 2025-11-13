-- ========================================================================
-- SAHAAYA PLATFORM - FINAL FIX FOR COMMUNITY ISSUES
-- ========================================================================
-- This script fixes:
-- 1. RLS policies blocking legitimate members from creating help requests
-- 2. Amount precision issues (₹10,000 → ₹9,998)
-- Run this in Supabase SQL Editor
-- ========================================================================

-- ========================================================================
-- PART 1: FIX AMOUNT PRECISION ISSUE
-- ========================================================================

-- Change amount_needed to INTEGER to avoid floating-point precision issues
-- This ensures ₹10,000 stays as 10,000 and not 9,998
ALTER TABLE public.community_help_requests
ALTER COLUMN amount_needed TYPE integer
USING ROUND(amount_needed)::integer;

-- Add comment explaining the column
COMMENT ON COLUMN public.community_help_requests.amount_needed IS 
'Amount needed in whole rupees (integer) - no decimal places to avoid precision issues';

-- ========================================================================
-- PART 2: FIX RLS POLICIES FOR COMMUNITY_HELP_REQUESTS
-- ========================================================================

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS insert_community_help_request ON public.community_help_requests;
DROP POLICY IF EXISTS select_community_help_request ON public.community_help_requests;
DROP POLICY IF EXISTS select_community_help_requests ON public.community_help_requests;
DROP POLICY IF EXISTS insert_community_help_requests ON public.community_help_requests;
DROP POLICY IF EXISTS update_community_help_request ON public.community_help_requests;
DROP POLICY IF EXISTS update_community_help_requests ON public.community_help_requests;
DROP POLICY IF EXISTS delete_community_help_request ON public.community_help_requests;

-- Create CORRECT INSERT policy - only members can create requests
-- Using WITH CHECK instead of USING for INSERT operations
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

COMMENT ON POLICY insert_community_help_request ON public.community_help_requests IS
'Allow authenticated users to create help requests only in communities they are members of';

-- Create CORRECT SELECT policy - only members can view requests
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

COMMENT ON POLICY select_community_help_request ON public.community_help_requests IS
'Allow authenticated users to view help requests only in communities they are members of';

-- Allow users to update their own help requests
CREATE POLICY update_community_help_request
ON public.community_help_requests
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

COMMENT ON POLICY update_community_help_request ON public.community_help_requests IS
'Allow users to update only their own help requests';

-- Allow users to delete their own help requests
CREATE POLICY delete_community_help_request
ON public.community_help_requests
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

COMMENT ON POLICY delete_community_help_request ON public.community_help_requests IS
'Allow users to delete only their own help requests';

-- ========================================================================
-- PART 3: ADD SERVER-SIDE MEMBERSHIP VALIDATION TRIGGER (OPTIONAL BUT RECOMMENDED)
-- ========================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_check_user_membership ON public.community_help_requests;
DROP FUNCTION IF EXISTS check_user_membership();

-- Create trigger function to validate membership at database level
CREATE OR REPLACE FUNCTION check_user_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user is a member of the community
  IF NOT EXISTS (
    SELECT 1 
    FROM public.community_members cm
    WHERE cm.user_id = auth.uid()
    AND cm.community_id = NEW.community_id
  ) THEN
    RAISE EXCEPTION 'User must be a member of this community to post help requests'
      USING HINT = 'Join the community first before creating help requests';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_user_membership() IS
'Validates that user is a community member before inserting help request';

-- Create trigger to run the validation function
CREATE TRIGGER trg_check_user_membership
BEFORE INSERT ON public.community_help_requests
FOR EACH ROW
EXECUTE FUNCTION check_user_membership();

COMMENT ON TRIGGER trg_check_user_membership ON public.community_help_requests IS
'Ensures only community members can create help requests';

-- ========================================================================
-- PART 4: VERIFICATION QUERIES
-- ========================================================================

-- Check that amount_needed is now INTEGER
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'community_help_requests'
  AND column_name = 'amount_needed';

-- Check RLS policies are correctly created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE ''
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE ''
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'community_help_requests'
ORDER BY policyname;

-- Check triggers are correctly created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'community_help_requests'
ORDER BY trigger_name;

-- Test query: Check a specific user's community memberships
-- (Replace USER_ID with actual user ID for testing)
/*
SELECT 
  c.id,
  c.name,
  cm.role,
  cm.joined_at,
  'Can create requests' as permission
FROM public.communities c
INNER JOIN public.community_members cm ON cm.community_id = c.id
WHERE cm.user_id = 'USER_ID'
ORDER BY cm.joined_at DESC;
*/

-- Verify existing help requests have correct amounts (should be integers now)
SELECT 
  id,
  title,
  amount_needed,
  pg_typeof(amount_needed) as amount_type,
  created_at
FROM public.community_help_requests
WHERE amount_needed IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- ========================================================================
-- PART 5: TEST SCENARIOS (OPTIONAL)
-- ========================================================================

/*
-- Test 1: Verify a member can create a help request
-- (Run this as a logged-in user who is a member of a community)

-- First check if you're a member
SELECT 
  cm.id,
  cm.community_id,
  c.name,
  cm.role
FROM community_members cm
JOIN communities c ON c.id = cm.community_id
WHERE cm.user_id = auth.uid()
LIMIT 1;

-- If you are a member, try inserting a test request
INSERT INTO community_help_requests (
  community_id,
  user_id,
  title,
  description,
  urgency,
  amount_needed,
  category
) VALUES (
  'YOUR_COMMUNITY_ID_HERE',
  auth.uid(),
  'Test Help Request',
  'This is a test to verify the RLS policy works',
  'medium',
  10000, -- Should stay as 10000, not become 9998
  'medical'
) RETURNING *;

-- Clean up test data
DELETE FROM community_help_requests 
WHERE title = 'Test Help Request' 
  AND user_id = auth.uid();
*/

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================
-- If this script runs without errors:
-- ✅ Amount precision is fixed (integer column)
-- ✅ RLS policies allow legitimate members to create requests
-- ✅ Trigger validation provides additional security
-- ✅ All existing data is preserved and migrated correctly
-- ========================================================================

SELECT 'SUCCESS: All fixes applied!' as status;
