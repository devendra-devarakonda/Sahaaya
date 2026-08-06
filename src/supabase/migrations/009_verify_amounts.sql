-- ========================================================================
-- VERIFICATION SCRIPT - CHECK AMOUNT DATA INTEGRITY
-- ========================================================================
-- Run this BEFORE the fix migration to identify problematic data
-- This helps us understand the scope of the issue
-- ========================================================================

-- ========================================================================
-- CHECK 1: Global Help Requests - Look for suspicious amounts
-- ========================================================================

SELECT 
  '=== GLOBAL HELP REQUESTS ===' AS check_name;

-- Check for negative amounts (should never happen)
SELECT 
  COUNT(*) AS negative_amount_count,
  'Requests with negative amounts' AS issue
FROM help_requests
WHERE amount_needed < 0;

-- Check for NULL amounts
SELECT 
  COUNT(*) AS null_amount_count,
  'Requests with NULL amounts (OK if optional)' AS issue
FROM help_requests
WHERE amount_needed IS NULL;

-- Check for very small amounts (might indicate calculation errors)
SELECT 
  COUNT(*) AS suspicious_small_count,
  'Requests with amount < 10 (might be errors)' AS issue
FROM help_requests
WHERE amount_needed > 0 AND amount_needed < 10;

-- Sample of potentially problematic records
SELECT 
  id,
  title,
  amount_needed,
  supporters,
  status,
  created_at
FROM help_requests
WHERE amount_needed < 0 OR (amount_needed > 0 AND amount_needed < 10)
ORDER BY created_at DESC
LIMIT 10;

-- ========================================================================
-- CHECK 2: Community Help Requests - Look for suspicious amounts
-- ========================================================================

SELECT 
  '=== COMMUNITY HELP REQUESTS ===' AS check_name;

-- Check for negative amounts (should never happen)
SELECT 
  COUNT(*) AS negative_amount_count,
  'Community requests with negative amounts' AS issue
FROM community_help_requests
WHERE amount_needed < 0;

-- Check for NULL amounts
SELECT 
  COUNT(*) AS null_amount_count,
  'Community requests with NULL amounts (OK if optional)' AS issue
FROM community_help_requests
WHERE amount_needed IS NULL;

-- Check for very small amounts (might indicate calculation errors)
SELECT 
  COUNT(*) AS suspicious_small_count,
  'Community requests with amount < 10 (might be errors)' AS issue
FROM community_help_requests
WHERE amount_needed > 0 AND amount_needed < 10;

-- Sample of potentially problematic records
SELECT 
  id,
  title,
  amount_needed,
  supporters,
  status,
  community_id,
  created_at
FROM community_help_requests
WHERE amount_needed < 0 OR (amount_needed > 0 AND amount_needed < 10)
ORDER BY created_at DESC
LIMIT 10;

-- ========================================================================
-- CHECK 3: Verify View Definitions
-- ========================================================================

SELECT 
  '=== VIEW DEFINITIONS CHECK ===' AS check_name;

-- Check if views exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ Exists'
    ELSE '❌ Missing'
  END AS status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('dashboard_my_requests', 'dashboard_my_contributions')
ORDER BY table_name;

-- ========================================================================
-- CHECK 4: Sample Current View Output
-- ========================================================================

SELECT 
  '=== CURRENT VIEW OUTPUT SAMPLE ===' AS check_name;

-- Sample from dashboard_my_requests (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' AND table_name = 'dashboard_my_requests'
  ) THEN
    RAISE NOTICE 'Sampling dashboard_my_requests view...';
    -- Note: Actual SELECT would go here in a real query
  ELSE
    RAISE NOTICE 'dashboard_my_requests view does not exist yet';
  END IF;
END $$;

-- ========================================================================
-- CHECK 5: Look for Triggers That Might Modify Amounts
-- ========================================================================

SELECT 
  '=== TRIGGERS AFFECTING AMOUNTS ===' AS check_name;

SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  'Trigger found' AS warning
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('help_requests', 'community_help_requests')
  AND (
    action_statement LIKE '%amount%'
    OR action_statement LIKE '%supporters%'
  );

-- ========================================================================
-- CHECK 6: Look for Functions That Might Calculate Amounts
-- ========================================================================

SELECT 
  '=== FUNCTIONS AFFECTING AMOUNTS ===' AS check_name;

SELECT 
  routine_name,
  routine_type,
  'Function found' AS warning
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition LIKE '%amount_needed%'
  AND (
    routine_definition LIKE '%amount_needed%-%'
    OR routine_definition LIKE '%amount_needed - %'
  );

-- ========================================================================
-- CHECK 7: Statistics Summary
-- ========================================================================

SELECT 
  '=== SUMMARY STATISTICS ===' AS check_name;

-- Global requests stats
SELECT 
  'Global Requests' AS table_name,
  COUNT(*) AS total_requests,
  COUNT(amount_needed) AS requests_with_amount,
  AVG(amount_needed) AS avg_amount,
  MIN(amount_needed) AS min_amount,
  MAX(amount_needed) AS max_amount,
  COUNT(CASE WHEN amount_needed < 0 THEN 1 END) AS negative_count,
  COUNT(CASE WHEN amount_needed = 0 THEN 1 END) AS zero_count
FROM help_requests;

-- Community requests stats
SELECT 
  'Community Requests' AS table_name,
  COUNT(*) AS total_requests,
  COUNT(amount_needed) AS requests_with_amount,
  AVG(amount_needed) AS avg_amount,
  MIN(amount_needed) AS min_amount,
  MAX(amount_needed) AS max_amount,
  COUNT(CASE WHEN amount_needed < 0 THEN 1 END) AS negative_count,
  COUNT(CASE WHEN amount_needed = 0 THEN 1 END) AS zero_count
FROM community_help_requests;

-- ========================================================================
-- COMPLETION MESSAGE
-- ========================================================================

SELECT '✅ Verification complete - Review results above' AS status;
SELECT '⚠️  If you see negative or suspicious amounts, investigate before fixing' AS warning;
SELECT '📋 Next step: Run 009_fix_amount_display.sql migration' AS next_action;
