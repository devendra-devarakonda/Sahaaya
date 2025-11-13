-- ========================================================================
-- SAHAAYA PLATFORM - LOCKDOWN DASHBOARD VIEWS (READ-ONLY)
-- ========================================================================
-- This script ensures dashboard views are READ-ONLY to prevent accidental
-- data modifications. All writes must go through base tables.
-- ========================================================================

-- ========================================================================
-- STEP 1: REVOKE ALL PERMISSIONS
-- ========================================================================

-- Remove all existing permissions on views
REVOKE ALL ON public.dashboard_my_requests FROM authenticated;
REVOKE ALL ON public.dashboard_my_contributions FROM authenticated;

REVOKE ALL ON public.dashboard_my_requests FROM anon;
REVOKE ALL ON public.dashboard_my_contributions FROM anon;

SELECT '✅ Revoked all permissions on dashboard views' AS status;

-- ========================================================================
-- STEP 2: GRANT SELECT-ONLY ACCESS
-- ========================================================================

-- Grant SELECT (read-only) permission to authenticated users
GRANT SELECT ON public.dashboard_my_requests TO authenticated;
GRANT SELECT ON public.dashboard_my_contributions TO authenticated;

SELECT '✅ Granted SELECT-only access to authenticated users' AS status;

-- ========================================================================
-- STEP 3: VERIFY READ-ONLY STATUS
-- ========================================================================

-- Check permissions on views
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('dashboard_my_requests', 'dashboard_my_contributions')
ORDER BY table_name, grantee, privilege_type;

SELECT '=== PERMISSION VERIFICATION ===' AS status;

-- ========================================================================
-- STEP 4: ENSURE BASE TABLES REMAIN WRITABLE
-- ========================================================================

-- Verify base tables still have full access
SELECT
  table_name,
  COUNT(DISTINCT privilege_type) AS permission_count
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('help_requests', 'help_offers', 'community_help_requests', 'community_help_offers')
  AND grantee = 'authenticated'
GROUP BY table_name;

SELECT '✅ Verified base tables remain writable' AS status;

-- ========================================================================
-- STEP 5: REFRESH POSTGREST SCHEMA CACHE
-- ========================================================================

NOTIFY pgrst, 'reload schema';

SELECT '✅ PostgREST schema cache refreshed' AS status;

-- ========================================================================
-- VERIFICATION QUERIES
-- ========================================================================

SELECT '=== FINAL STATUS ===' AS status;

-- 1. Confirm views are read-only
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name = 'dashboard_my_requests'
        AND grantee = 'authenticated'
        AND privilege_type = 'SELECT'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name = 'dashboard_my_requests'
        AND grantee = 'authenticated'
        AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
    )
    THEN '✅ dashboard_my_requests is READ-ONLY'
    ELSE '❌ dashboard_my_requests has write permissions'
  END AS requests_view_security;

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name = 'dashboard_my_contributions'
        AND grantee = 'authenticated'
        AND privilege_type = 'SELECT'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name = 'dashboard_my_contributions'
        AND grantee = 'authenticated'
        AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
    )
    THEN '✅ dashboard_my_contributions is READ-ONLY'
    ELSE '❌ dashboard_my_contributions has write permissions'
  END AS contributions_view_security;

-- 2. Confirm base tables are writable
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name IN ('help_requests', 'community_help_requests')
        AND grantee = 'authenticated'
        AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
    )
    THEN '✅ Base tables remain writable (global + community)'
    ELSE '⚠️ Base tables may have restricted access'
  END AS base_tables_writable;

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================

SELECT
  '✅ DASHBOARD VIEWS LOCKED DOWN' AS status,
  'Views are READ-ONLY, base tables remain writable' AS message,
  'All write operations must use base tables' AS requirement;

-- ========================================================================
-- TESTING THE LOCKDOWN
-- ========================================================================

/*
TEST 1: Try to INSERT into view (should FAIL)
-------------------------------------------------
-- This should return an error
INSERT INTO dashboard_my_requests (title, description)
VALUES ('Test', 'This should fail');

-- Expected result: ERROR: cannot insert into view "dashboard_my_requests"


TEST 2: Try to UPDATE view (should FAIL)
-------------------------------------------------
-- This should return an error
UPDATE dashboard_my_requests 
SET title = 'Updated Title'
WHERE id = 'some-id';

-- Expected result: ERROR: cannot update view "dashboard_my_requests"


TEST 3: Try to DELETE from view (should FAIL)
-------------------------------------------------
-- This should return an error
DELETE FROM dashboard_my_requests
WHERE id = 'some-id';

-- Expected result: ERROR: cannot delete from view "dashboard_my_requests"


TEST 4: SELECT from view (should SUCCEED)
-------------------------------------------------
-- This should work fine
SELECT * FROM dashboard_my_requests LIMIT 5;

-- Expected result: Returns data successfully


TEST 5: INSERT into base table (should SUCCEED)
-------------------------------------------------
-- This should work fine
INSERT INTO help_requests (
  user_id,
  title,
  description,
  category,
  amount_needed,
  urgency
) VALUES (
  auth.uid(),
  'Test Request',
  'Test Description',
  'Healthcare',
  5000,
  'medium'
);

-- Expected result: Row inserted successfully
-- And automatically visible in dashboard_my_requests view
*/

-- ========================================================================
-- ROLLBACK (IF NEEDED)
-- ========================================================================

/*
TO RESTORE WRITE ACCESS TO VIEWS (NOT RECOMMENDED):

-- Grant full access (not recommended)
GRANT ALL ON public.dashboard_my_requests TO authenticated;
GRANT ALL ON public.dashboard_my_contributions TO authenticated;

-- Refresh schema
NOTIFY pgrst, 'reload schema';

NOTE: This is NOT recommended. Views should remain read-only.
All writes should go through base tables (help_requests, help_offers, etc.)
*/

SELECT '📋 Lockdown complete. Dashboard views are now read-only!' AS final_status;
SELECT '⚠️ All write operations must use base tables (help_requests, help_offers, etc.)' AS important_note;
