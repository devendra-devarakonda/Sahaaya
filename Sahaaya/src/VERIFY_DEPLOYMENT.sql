-- ========================================================================
-- SAHAAYA PLATFORM - DEPLOYMENT VERIFICATION SCRIPT
-- ========================================================================
-- Run this after deploying unified dashboard views to verify everything
-- ========================================================================

SELECT '========================================' AS separator;
SELECT '🔍 UNIFIED DASHBOARD DEPLOYMENT VERIFICATION' AS title;
SELECT '========================================' AS separator;

-- ========================================================================
-- TEST 1: VERIFY VIEWS EXIST
-- ========================================================================

SELECT '--- TEST 1: Views Exist ---' AS test;

SELECT
  table_name,
  CASE
    WHEN table_name = 'dashboard_my_requests' THEN '✅ dashboard_my_requests exists'
    WHEN table_name = 'dashboard_my_contributions' THEN '✅ dashboard_my_contributions exists'
    ELSE '⚠️ Unknown view'
  END AS status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'dashboard%'
ORDER BY table_name;

-- Count views
SELECT
  CASE
    WHEN COUNT(*) = 2 THEN '✅ Both views exist'
    WHEN COUNT(*) = 1 THEN '⚠️ Only 1 view found (should be 2)'
    ELSE '❌ No views found'
  END AS view_count_status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'dashboard%';

-- ========================================================================
-- TEST 2: VERIFY FOREIGN KEY METADATA
-- ========================================================================

SELECT '--- TEST 2: Foreign Key Metadata ---' AS test;

SELECT
  table_name,
  CASE
    WHEN obj_description((table_schema || '.' || table_name)::regclass) LIKE '%@foreignKey%'
    THEN '✅ Has @foreignKey metadata'
    ELSE '❌ Missing @foreignKey metadata'
  END AS fk_metadata_status,
  obj_description((table_schema || '.' || table_name)::regclass) AS comment
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('dashboard_my_requests', 'dashboard_my_contributions')
ORDER BY table_name;

-- ========================================================================
-- TEST 3: VERIFY VIEW COLUMNS
-- ========================================================================

SELECT '--- TEST 3: View Columns ---' AS test;

-- Check dashboard_my_requests columns
SELECT
  'dashboard_my_requests' AS view_name,
  CASE
    WHEN COUNT(column_name) >= 12 THEN '✅ All required columns present'
    ELSE '⚠️ Some columns missing'
  END AS column_status,
  COUNT(column_name) AS column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'dashboard_my_requests';

-- Check dashboard_my_contributions columns
SELECT
  'dashboard_my_contributions' AS view_name,
  CASE
    WHEN COUNT(column_name) >= 8 THEN '✅ All required columns present'
    ELSE '⚠️ Some columns missing'
  END AS column_status,
  COUNT(column_name) AS column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'dashboard_my_contributions';

-- Verify community_id column exists
SELECT
  table_name,
  column_name,
  data_type,
  '✅ community_id column exists' AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('dashboard_my_requests', 'dashboard_my_contributions')
  AND column_name = 'community_id';

-- ========================================================================
-- TEST 4: VERIFY PERMISSIONS (READ-ONLY)
-- ========================================================================

SELECT '--- TEST 4: Permissions ---' AS test;

-- Check view permissions (should be SELECT only)
SELECT
  table_name,
  privilege_type,
  CASE
    WHEN privilege_type = 'SELECT' THEN '✅ Read-only (correct)'
    WHEN privilege_type IN ('INSERT', 'UPDATE', 'DELETE') THEN '❌ Write access (incorrect)'
    ELSE '⚠️ Unknown permission'
  END AS permission_status
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('dashboard_my_requests', 'dashboard_my_contributions')
  AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;

-- Verify no INSERT/UPDATE/DELETE on views
SELECT
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name IN ('dashboard_my_requests', 'dashboard_my_contributions')
        AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
        AND grantee = 'authenticated'
    )
    THEN '✅ Views are read-only (no write permissions)'
    ELSE '❌ Views have write permissions (security risk!)'
  END AS write_permission_check;

-- ========================================================================
-- TEST 5: VERIFY BASE TABLES ARE WRITABLE
-- ========================================================================

SELECT '--- TEST 5: Base Table Permissions ---' AS test;

-- Check base table permissions (should include INSERT, UPDATE, DELETE)
SELECT
  table_name,
  COUNT(DISTINCT privilege_type) AS permission_count,
  CASE
    WHEN COUNT(DISTINCT privilege_type) >= 4 THEN '✅ Full access (correct)'
    ELSE '⚠️ Limited access'
  END AS access_status
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('help_requests', 'help_offers', 'community_help_requests', 'community_help_offers')
  AND grantee = 'authenticated'
GROUP BY table_name
ORDER BY table_name;

-- Verify INSERT permission on base tables
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name IN ('help_requests', 'community_help_requests')
        AND privilege_type = 'INSERT'
        AND grantee = 'authenticated'
    )
    THEN '✅ Base tables are writable (INSERT permission exists)'
    ELSE '❌ Base tables are not writable (missing INSERT)'
  END AS base_table_write_check;

-- ========================================================================
-- TEST 6: VERIFY DATA IN VIEWS
-- ========================================================================

SELECT '--- TEST 6: View Data ---' AS test;

-- Count records by source_type in dashboard_my_requests
SELECT
  source_type,
  COUNT(*) AS record_count,
  CASE
    WHEN source_type = 'global' THEN '✅ Global requests present'
    WHEN source_type = 'community' THEN '✅ Community requests present'
    ELSE '⚠️ Unknown source type'
  END AS data_status
FROM public.dashboard_my_requests
GROUP BY source_type;

-- Total count
SELECT
  COUNT(*) AS total_requests,
  COUNT(CASE WHEN source_type = 'global' THEN 1 END) AS global_requests,
  COUNT(CASE WHEN source_type = 'community' THEN 1 END) AS community_requests,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ View has data'
    ELSE '⚠️ View is empty (expected if no requests exist)'
  END AS data_availability
FROM public.dashboard_my_requests;

-- Count records by source_type in dashboard_my_contributions
SELECT
  source_type,
  COUNT(*) AS record_count,
  CASE
    WHEN source_type = 'global' THEN '✅ Global contributions present'
    WHEN source_type = 'community' THEN '✅ Community contributions present'
    ELSE '⚠️ Unknown source type'
  END AS data_status
FROM public.dashboard_my_contributions
GROUP BY source_type;

-- ========================================================================
-- TEST 7: VERIFY COMMUNITIES JOIN
-- ========================================================================

SELECT '--- TEST 7: Communities Relationship ---' AS test;

-- Test LEFT JOIN with communities
SELECT
  dmr.source_type,
  COUNT(*) AS total_records,
  COUNT(c.id) AS records_with_community,
  COUNT(*) - COUNT(c.id) AS records_without_community,
  CASE
    WHEN COUNT(c.id) > 0 THEN '✅ Community joins working'
    ELSE '⚠️ No community data (check if communities exist)'
  END AS join_status
FROM public.dashboard_my_requests dmr
LEFT JOIN public.communities c ON c.id = dmr.community_id
GROUP BY dmr.source_type;

-- ========================================================================
-- TEST 8: VERIFY BACKUP EXISTS
-- ========================================================================

SELECT '--- TEST 8: Backup Safety ---' AS test;

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.schemata
      WHERE schema_name = 'backup_before_dashboard_sync'
    )
    THEN '✅ Safety backup schema exists'
    ELSE '⚠️ No backup schema (rollback may be difficult)'
  END AS backup_status;

-- List backup tables
SELECT
  table_name,
  '✅ Backed up' AS status
FROM information_schema.tables
WHERE table_schema = 'backup_before_dashboard_sync'
ORDER BY table_name;

-- ========================================================================
-- TEST 9: VERIFY NO OLD TRIGGERS
-- ========================================================================

SELECT '--- TEST 9: Old Triggers Removed ---' AS test;

SELECT
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_name LIKE '%dashboard%'
        AND event_object_table IN ('community_help_requests', 'community_help_offers')
    )
    THEN '✅ No old dashboard sync triggers (clean)'
    ELSE '⚠️ Old triggers still exist (may need cleanup)'
  END AS trigger_cleanup_status;

-- ========================================================================
-- TEST 10: SAMPLE DATA QUERY
-- ========================================================================

SELECT '--- TEST 10: Sample Data ---' AS test;

-- Sample from dashboard_my_requests
SELECT
  id,
  title,
  source_type,
  community_id,
  CASE
    WHEN source_type = 'community' AND community_id IS NOT NULL THEN '✅ Community request (has community_id)'
    WHEN source_type = 'global' AND community_id IS NULL THEN '✅ Global request (no community_id)'
    ELSE '⚠️ Inconsistent data'
  END AS data_consistency
FROM public.dashboard_my_requests
ORDER BY created_at DESC
LIMIT 5;

-- Sample from dashboard_my_contributions
SELECT
  id,
  source_type,
  community_id,
  CASE
    WHEN source_type = 'community' AND community_id IS NOT NULL THEN '✅ Community contribution'
    WHEN source_type = 'global' AND community_id IS NULL THEN '✅ Global contribution'
    ELSE '⚠️ Inconsistent data'
  END AS data_consistency
FROM public.dashboard_my_contributions
ORDER BY created_at DESC
LIMIT 5;

-- ========================================================================
-- FINAL SUMMARY
-- ========================================================================

SELECT '========================================' AS separator;
SELECT '📊 VERIFICATION SUMMARY' AS title;
SELECT '========================================' AS separator;

SELECT
  '1. Views Exist' AS check_item,
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public' AND table_name LIKE 'dashboard%') = 2
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS status;

SELECT
  '2. Foreign Key Metadata' AS check_item,
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public' AND table_name LIKE 'dashboard%' AND obj_description((table_schema || '.' || table_name)::regclass) LIKE '%@foreignKey%') = 2
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS status;

SELECT
  '3. Views Read-Only' AS check_item,
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_name LIKE 'dashboard%'
        AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
        AND grantee = 'authenticated'
    )
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS status;

SELECT
  '4. Base Tables Writable' AS check_item,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
      WHERE table_name IN ('help_requests', 'community_help_requests')
        AND privilege_type = 'INSERT'
        AND grantee = 'authenticated'
    )
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS status;

SELECT
  '5. Backup Exists' AS check_item,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'backup_before_dashboard_sync')
    THEN '✅ PASS'
    ELSE '⚠️ WARN'
  END AS status;

SELECT
  '6. No Old Triggers' AS check_item,
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_name LIKE '%dashboard%'
    )
    THEN '✅ PASS'
    ELSE '⚠️ WARN'
  END AS status;

-- ========================================================================
-- NEXT STEPS
-- ========================================================================

SELECT '========================================' AS separator;
SELECT '🎯 NEXT STEPS' AS title;
SELECT '========================================' AS separator;

SELECT
  '1. Test frontend dashboard' AS step,
  'Navigate to Dashboard and verify data displays' AS action;

SELECT
  '2. Create test request' AS step,
  'Create both global and community requests' AS action;

SELECT
  '3. Verify source badges' AS step,
  'Check that 🌐 Global and 🏘️ Community badges appear' AS action;

SELECT
  '4. Test communities query' AS step,
  'Try .select(''*, communities(name)'') in frontend' AS action;

SELECT
  '5. Monitor performance' AS step,
  'Check query response times (<100ms expected)' AS action;

-- ========================================================================
-- TROUBLESHOOTING HINTS
-- ========================================================================

SELECT '========================================' AS separator;
SELECT '🔧 TROUBLESHOOTING HINTS' AS title;
SELECT '========================================' AS separator;

SELECT
  'If foreign key errors occur' AS issue,
  'Run /FIX_FOREIGN_KEY_RELATIONSHIPS.sql' AS solution;

SELECT
  'If views missing' AS issue,
  'Re-run /UNIFIED_DASHBOARD_VIEWS.sql' AS solution;

SELECT
  'If permission denied' AS issue,
  'Run /LOCKDOWN_DASHBOARD_VIEWS.sql' AS solution;

SELECT
  'If cache issues' AS issue,
  'NOTIFY pgrst, ''reload schema'';' AS solution;

-- ========================================================================
-- END OF VERIFICATION
-- ========================================================================

SELECT '========================================' AS separator;
SELECT '✅ VERIFICATION COMPLETE' AS title;
SELECT '========================================' AS separator;

SELECT
  'Review results above' AS instruction,
  'All checks should show ✅ PASS' AS expectation,
  '⚠️ WARN is acceptable for some checks' AS note;
