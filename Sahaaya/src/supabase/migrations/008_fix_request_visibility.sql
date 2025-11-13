-- =====================================================
-- FIX REQUEST VISIBILITY LOGIC
-- =====================================================
-- Requests should stay visible until marked as "Completed"
-- Pending AND Matched requests should be visible to all users
-- Only Completed requests should be hidden from non-owners
-- =====================================================

-- =====================================================
-- STEP 1: Update help_requests RLS Policy
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "View help requests with completion privacy" ON public.help_requests;

-- Create new policy: Show pending and matched requests to all, completed only to owner
CREATE POLICY "View help requests with completion privacy"
ON public.help_requests FOR SELECT
USING (
  -- Show pending and matched requests to everyone
  status IN ('pending', 'matched')
  OR 
  -- Show completed requests only to the owner
  (status = 'completed' AND user_id = auth.uid())
);

COMMENT ON POLICY "View help requests with completion privacy" ON public.help_requests IS
'Allows all users to see pending and matched requests. Completed requests are only visible to the owner.';

-- =====================================================
-- STEP 2: Update community_help_requests RLS Policy
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "View community help requests with proper visibility" ON public.community_help_requests;

-- Create new policy: Show pending and matched requests to members, completed only to owner
CREATE POLICY "View community help requests with proper visibility"
ON public.community_help_requests FOR SELECT
USING (
  -- User must be a member OR community is public
  (
    EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.community_id = community_help_requests.community_id
      AND cm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.communities c
      WHERE c.id = community_help_requests.community_id
      AND c.privacy = 'public'
    )
  )
  AND (
    -- Show pending and matched requests to everyone in community
    status IN ('pending', 'matched')
    OR
    -- Show completed requests only to the owner
    (status = 'completed' AND user_id = auth.uid())
  )
);

COMMENT ON POLICY "View community help requests with proper visibility" ON public.community_help_requests IS
'Shows pending and matched requests to all community members. Completed requests are only visible to their creators.';

-- =====================================================
-- STEP 3: Verify Policies
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('help_requests', 'community_help_requests')
ORDER BY tablename, policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Request visibility RLS policies updated successfully!' as status;
SELECT 'Pending and Matched requests are now visible to all users' as info;
SELECT 'Completed requests are only visible to their owners' as info;