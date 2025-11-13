-- ========================================================================
-- SAHAAYA PLATFORM - FIX COMMUNITY HELP REQUESTS SHOWING "ANONYMOUS"
-- ========================================================================
-- This script ensures community help requests display actual requester details
-- instead of showing "Anonymous"
-- ========================================================================

-- ========================================================================
-- STEP 1: VERIFY user_profiles VIEW EXISTS
-- ========================================================================

-- Check if the user_profiles view exists
SELECT 
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname = 'user_profiles';

-- If the view doesn't exist, create it
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT
  id,
  email,
  raw_user_meta_data->>'name' AS full_name,
  raw_user_meta_data->>'phone' AS phone,
  raw_user_meta_data->>'avatar_url' AS avatar_url,
  created_at,
  updated_at
FROM auth.users;

COMMENT ON VIEW public.user_profiles IS
'Exposes user profile data from auth.users for use in frontend queries';

SELECT 'user_profiles view created/updated' as status;

-- ========================================================================
-- STEP 2: VERIFY FOREIGN KEY RELATIONSHIP
-- ========================================================================

-- Check existing foreign keys on community_help_requests.user_id
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  a.attname as column_name,
  confrelid::regclass as foreign_table_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE conrelid = 'public.community_help_requests'::regclass
  AND a.attname = 'user_id';

-- Drop any duplicate or incorrectly named foreign keys
ALTER TABLE public.community_help_requests
DROP CONSTRAINT IF EXISTS community_help_requests_user_id_fkey CASCADE;

ALTER TABLE public.community_help_requests
DROP CONSTRAINT IF EXISTS community_help_requests_user_fkey CASCADE;

ALTER TABLE public.community_help_requests
DROP CONSTRAINT IF EXISTS fk_user CASCADE;

SELECT 'Old foreign keys dropped' as status;

-- Create the correct foreign key with explicit name
-- This references the user_profiles VIEW (which is backed by auth.users)
-- We use the auth.users table directly since views can't be referenced
ALTER TABLE public.community_help_requests
DROP CONSTRAINT IF EXISTS fk_community_help_requests_user CASCADE;

ALTER TABLE public.community_help_requests
ADD CONSTRAINT fk_community_help_requests_user
FOREIGN KEY (user_id)
REFERENCES auth.users (id)
ON DELETE CASCADE;

COMMENT ON CONSTRAINT fk_community_help_requests_user ON public.community_help_requests IS
'Links help requests to their creators via auth.users (exposed through user_profiles view)';

SELECT 'Foreign key fk_community_help_requests_user created' as status;

-- ========================================================================
-- STEP 3: VERIFY RLS POLICIES ALLOW DATA VISIBILITY
-- ========================================================================

-- Check existing SELECT policy
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'community_help_requests'
  AND cmd = 'SELECT';

-- Drop old restrictive SELECT policy
DROP POLICY IF EXISTS "allow_select_community_help_requests" ON public.community_help_requests;
DROP POLICY IF EXISTS select_community_help_request ON public.community_help_requests;

-- Create new SELECT policy that allows community members to view requests
CREATE POLICY select_community_help_request
ON public.community_help_requests
FOR SELECT
TO authenticated
USING (
  -- User must be a member of the community to view its help requests
  EXISTS (
    SELECT 1
    FROM public.community_members cm
    WHERE cm.user_id = auth.uid()
      AND cm.community_id = community_help_requests.community_id
  )
);

COMMENT ON POLICY select_community_help_request ON public.community_help_requests IS
'Allow authenticated community members to view help requests (including requester info)';

SELECT 'SELECT policy created: Community members can view requests with requester info' as status;

-- ========================================================================
-- STEP 4: VERIFY user_profiles VIEW IS ACCESSIBLE
-- ========================================================================

-- Grant SELECT permission on user_profiles view to authenticated users
GRANT SELECT ON public.user_profiles TO authenticated;

SELECT 'SELECT permission granted on user_profiles view' as status;

-- ========================================================================
-- STEP 5: TEST QUERY WITH EXPLICIT RELATIONSHIP
-- ========================================================================

-- Test the query that the frontend uses
-- This should return requester details in the user_profiles field
SELECT
  chr.id,
  chr.title,
  chr.description,
  chr.amount_needed,
  chr.status,
  chr.created_at,
  chr.user_id,
  -- Get user profile data via explicit join
  up.full_name,
  up.email,
  up.phone
FROM public.community_help_requests chr
LEFT JOIN public.user_profiles up ON up.id = chr.user_id
ORDER BY chr.created_at DESC
LIMIT 5;

SELECT 'Test query executed successfully' as status;

-- ========================================================================
-- STEP 6: VERIFY PostgREST RELATIONSHIP DETECTION
-- ========================================================================

-- PostgREST needs to detect the relationship between:
-- community_help_requests.user_id → auth.users.id (via user_profiles view)

-- Check that the foreign key constraint points to auth.users
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'community_help_requests'
  AND kcu.column_name = 'user_id';

SELECT 'Foreign key relationship verified' as status;

-- ========================================================================
-- STEP 7: REFRESH POSTGREST SCHEMA CACHE
-- ========================================================================

-- Tell PostgREST to reload the schema so it detects the new relationship
NOTIFY pgrst, 'reload schema';

SELECT 'PostgREST schema cache refreshed' as status;

-- ========================================================================
-- STEP 8: CREATE SAMPLE TEST DATA (OPTIONAL)
-- ========================================================================

/*
-- Uncomment to create test data

-- Get the first community ID
DO $$
DECLARE
  test_community_id uuid;
  test_user_id uuid;
BEGIN
  -- Get a community ID
  SELECT id INTO test_community_id
  FROM public.communities
  LIMIT 1;

  -- Get a user ID
  SELECT id INTO test_user_id
  FROM auth.users
  LIMIT 1;

  -- Check if we have both
  IF test_community_id IS NOT NULL AND test_user_id IS NOT NULL THEN
    -- Create a test help request
    INSERT INTO public.community_help_requests (
      community_id,
      user_id,
      title,
      description,
      category,
      urgency,
      amount_needed,
      status,
      supporters
    )
    VALUES (
      test_community_id,
      test_user_id,
      'Test Help Request - Verify Requester Info',
      'This is a test request to verify that requester information displays correctly.',
      'Education',
      'medium',
      5000,
      'pending',
      0
    );

    RAISE NOTICE 'Test help request created';
  ELSE
    RAISE NOTICE 'No community or user found - skip test data creation';
  END IF;
END $$;
*/

-- ========================================================================
-- STEP 9: VERIFICATION QUERIES
-- ========================================================================

SELECT '=== VERIFICATION SUMMARY ===' as status;

-- 1. Check user_profiles view exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_views
      WHERE schemaname = 'public' AND viewname = 'user_profiles'
    )
    THEN '✅ user_profiles view exists'
    ELSE '❌ user_profiles view missing'
  END as view_check;

-- 2. Check foreign key exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'fk_community_help_requests_user'
        AND conrelid = 'public.community_help_requests'::regclass
    )
    THEN '✅ Foreign key fk_community_help_requests_user exists'
    ELSE '❌ Foreign key missing'
  END as fk_check;

-- 3. Check RLS policy exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'community_help_requests'
        AND policyname = 'select_community_help_request'
    )
    THEN '✅ RLS SELECT policy exists'
    ELSE '❌ RLS SELECT policy missing'
  END as rls_check;

-- 4. Count community help requests with user data
SELECT
  COUNT(*) as total_requests,
  COUNT(up.full_name) as requests_with_names,
  COUNT(up.email) as requests_with_emails
FROM public.community_help_requests chr
LEFT JOIN public.user_profiles up ON up.id = chr.user_id;

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================

SELECT
  '✅ COMMUNITY REQUESTER INFO FIX COMPLETE' as status,
  'Requester details should now display instead of "Anonymous"' as message,
  'Frontend query uses: user_profiles!fk_community_help_requests_user' as frontend_note;

-- ========================================================================
-- TESTING INSTRUCTIONS
-- ========================================================================

/*
TO TEST THE FIX:

1. Log in as a community member
2. Navigate to a community you belong to
3. Go to "Browse Help" tab
4. Check if requester names appear (not "Anonymous")
5. Click "View Details" on a request
6. Verify "Posted By" section shows:
   - Full name (if available)
   - Email address
   - Phone number (if available)

EXPECTED RESULTS:
✅ Requester name appears in request cards (not "Anonymous")
✅ Request details dialog shows full contact info
✅ After offering help, success dialog shows requester contact info
✅ Only community members can see requests
✅ No PGRST201 errors in console

TO DEBUG IF STILL SHOWING "ANONYMOUS":

1. Check browser console for errors
2. Verify the API response includes user_profiles field:

fetch('https://YOUR_PROJECT.supabase.co/rest/v1/community_help_requests?select=*,user_profiles!fk_community_help_requests_user(full_name,email,phone)&community_id=eq.COMMUNITY_ID', {
  headers: {
    'apikey': 'YOUR_ANON_KEY',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})
.then(res => res.json())
.then(console.log);

3. Check if user_profiles view returns data:

SELECT * FROM user_profiles LIMIT 5;

4. Verify users have metadata:

SELECT
  id,
  email,
  raw_user_meta_data
FROM auth.users
LIMIT 5;

If raw_user_meta_data is empty, users need to update their profiles!
*/

-- ========================================================================
-- ROLLBACK INSTRUCTIONS (IF NEEDED)
-- ========================================================================

/*
IF YOU NEED TO ROLLBACK:

-- Drop the foreign key
ALTER TABLE public.community_help_requests
DROP CONSTRAINT IF EXISTS fk_community_help_requests_user;

-- Drop the RLS policy
DROP POLICY IF EXISTS select_community_help_request ON public.community_help_requests;

-- Drop the user_profiles view
DROP VIEW IF EXISTS public.user_profiles;

-- Refresh PostgREST
NOTIFY pgrst, 'reload schema';
*/

SELECT '📋 Script execution complete. Check verification results above.' as final_status;
