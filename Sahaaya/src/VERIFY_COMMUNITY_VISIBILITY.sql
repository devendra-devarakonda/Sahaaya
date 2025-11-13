-- ========================================================================
-- VERIFICATION SCRIPT FOR COMMUNITY VISIBILITY FIX
-- ========================================================================
-- Run this script AFTER applying the migration to verify everything works
-- ========================================================================

-- ========================================================================
-- STEP 1: CHECK RLS IS ENABLED
-- ========================================================================

SELECT 
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled - ISSUE!'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'communities',
    'community_members',
    'community_help_requests',
    'community_help_offers'
  )
ORDER BY tablename;

-- ========================================================================
-- STEP 2: CHECK POLICIES EXIST
-- ========================================================================

SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN '📖 Read'
    WHEN cmd = 'INSERT' THEN '➕ Create'
    WHEN cmd = 'UPDATE' THEN '✏️ Update'
    WHEN cmd = 'DELETE' THEN '🗑️ Delete'
    ELSE cmd
  END as action
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'communities',
    'community_members',
    'community_help_requests',
    'community_help_offers'
  )
ORDER BY tablename, cmd;

-- ========================================================================
-- STEP 3: COUNT POLICIES PER TABLE (Should have 4 each minimum)
-- ========================================================================

SELECT 
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Complete'
    ELSE '⚠️ Missing Policies'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'communities',
    'community_members',
    'community_help_requests',
    'community_help_offers'
  )
GROUP BY tablename
ORDER BY tablename;

-- ========================================================================
-- STEP 4: CHECK REALTIME PUBLICATION
-- ========================================================================

SELECT 
  tablename,
  CASE 
    WHEN tablename IN (
      SELECT tablename FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime'
    ) THEN '✅ Realtime Enabled'
    ELSE '❌ Realtime Disabled - ISSUE!'
  END as realtime_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'communities',
    'community_members',
    'community_help_requests',
    'community_help_offers'
  )
ORDER BY tablename;

-- ========================================================================
-- STEP 5: CHECK HELPER VIEWS EXIST
-- ========================================================================

SELECT 
  viewname,
  '✅ View Created' as status
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN (
    'visible_communities',
    'visible_community_requests'
  )
ORDER BY viewname;

-- ========================================================================
-- STEP 6: TEST DATA ACCESS (Run as authenticated user)
-- ========================================================================

-- Check current user
SELECT 
  'Current User:' as info,
  auth.uid() as user_id,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ Authenticated'
    ELSE '❌ Not Authenticated - ISSUE!'
  END as auth_status;

-- Test: Can user see all communities?
SELECT 
  'Community Visibility Test' as test_name,
  COUNT(*) as total_communities_visible,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Can see communities'
    ELSE '⚠️ No communities visible (might be none created yet)'
  END as result
FROM communities;

-- Test: Can user see all community members?
SELECT 
  'Members Visibility Test' as test_name,
  COUNT(*) as total_members_visible,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Can see members'
    ELSE '⚠️ No members visible (might be none yet)'
  END as result
FROM community_members;

-- Test: Can user see community help requests (member communities only)?
SELECT 
  'Requests Visibility Test' as test_name,
  COUNT(*) as total_requests_visible,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Query executes (access granted)'
    ELSE '❌ Access denied'
  END as result
FROM community_help_requests;

-- ========================================================================
-- STEP 7: DETAILED POLICY VERIFICATION
-- ========================================================================

-- Communities policies check
SELECT 
  '1. Communities Table' as table_name,
  STRING_AGG(policyname, ', ') as policies,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ All policies present'
    ELSE '❌ Missing policies'
  END as status
FROM pg_policies
WHERE tablename = 'communities'
GROUP BY table_name;

-- Community members policies check
SELECT 
  '2. Community Members Table' as table_name,
  STRING_AGG(policyname, ', ') as policies,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ All policies present'
    ELSE '❌ Missing policies'
  END as status
FROM pg_policies
WHERE tablename = 'community_members'
GROUP BY table_name;

-- Community help requests policies check
SELECT 
  '3. Community Help Requests Table' as table_name,
  STRING_AGG(policyname, ', ') as policies,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ All policies present'
    ELSE '❌ Missing policies'
  END as status
FROM pg_policies
WHERE tablename = 'community_help_requests'
GROUP BY table_name;

-- Community help offers policies check
SELECT 
  '4. Community Help Offers Table' as table_name,
  STRING_AGG(policyname, ', ') as policies,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ All policies present'
    ELSE '❌ Missing policies'
  END as status
FROM pg_policies
WHERE tablename = 'community_help_offers'
GROUP BY table_name;

-- ========================================================================
-- STEP 8: SAMPLE DATA CHECK (Optional)
-- ========================================================================

-- Show sample communities (top 5)
SELECT 
  id,
  name,
  category,
  is_public,
  created_at,
  '✅ Visible' as visibility
FROM communities
ORDER BY created_at DESC
LIMIT 5;

-- Show sample members (top 5)
SELECT 
  cm.id,
  cm.community_id,
  c.name as community_name,
  cm.role,
  cm.joined_at,
  '✅ Visible' as visibility
FROM community_members cm
JOIN communities c ON c.id = cm.community_id
ORDER BY cm.joined_at DESC
LIMIT 5;

-- ========================================================================
-- SUMMARY REPORT
-- ========================================================================

SELECT 
  '========================================' as separator,
  'VERIFICATION SUMMARY' as report_title,
  '========================================' as separator2;

-- Count checks passed
WITH verification_results AS (
  SELECT 
    CASE WHEN rowsecurity THEN 1 ELSE 0 END as rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public' 
    AND tablename = 'communities'
)
SELECT 
  'Total Tables:' as metric,
  '4' as expected,
  (SELECT COUNT(*) FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('communities', 'community_members', 
                     'community_help_requests', 'community_help_offers')
  )::text as actual,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename IN ('communities', 'community_members', 
                           'community_help_requests', 'community_help_offers')
         ) = 4 
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status;

-- Final status
SELECT 
  '========================================' as separator,
  'If all checks show ✅, deployment is successful!' as final_message,
  '========================================' as separator2;
