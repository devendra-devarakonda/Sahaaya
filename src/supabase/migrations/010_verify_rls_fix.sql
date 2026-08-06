-- ========================================================================
-- VERIFICATION SCRIPT FOR RLS INSERT FIX
-- ========================================================================
-- Run this AFTER migration 010 to verify everything is correct
-- ========================================================================

-- ========================================================================
-- CHECK 1: Verify amount_needed has NO DEFAULT values
-- ========================================================================

SELECT 
  '=== CHECK 1: amount_needed Column Defaults ===' AS check_name;

SELECT 
  table_name,
  column_name,
  column_default,
  data_type,
  CASE 
    WHEN column_default IS NULL THEN '✅ No default (correct)'
    ELSE '❌ Has default (remove it!)'
  END AS status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('help_requests', 'community_help_requests')
  AND column_name = 'amount_needed';

-- ========================================================================
-- CHECK 2: Verify new INSERT policies exist
-- ========================================================================

SELECT 
  '=== CHECK 2: New INSERT Policies ===' AS check_name;

SELECT 
  tablename,
  policyname,
  cmd AS operation,
  with_check AS condition,
  CASE 
    WHEN policyname IN ('allow_authenticated_insert_help_requests', 'allow_authenticated_insert_comm_requests') 
    THEN '✅ New policy exists'
    ELSE '⚠️ Old policy name'
  END AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('help_requests', 'community_help_requests')
  AND cmd = 'INSERT'
ORDER BY tablename;

-- ========================================================================
-- CHECK 3: Verify old policies are removed
-- ========================================================================

SELECT 
  '=== CHECK 3: Old Policies Removed ===' AS check_name;

SELECT 
  tablename,
  policyname,
  cmd AS operation,
  '❌ Old policy still exists - should be dropped' AS warning
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('help_requests', 'community_help_requests')
  AND policyname IN (
    'Users can insert their own help requests',
    'Community members can create requests',
    'allow_insert_help_requests',
    'allow_insert_comm_requests'
  );

-- If this returns no rows, that's GOOD! It means old policies are gone.

-- ========================================================================
-- CHECK 4: Verify no triggers modify amount_needed
-- ========================================================================

SELECT 
  '=== CHECK 4: Triggers Affecting Amounts ===' AS check_name;

SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  CASE 
    WHEN action_statement LIKE '%amount_needed%' 
    THEN '⚠️ Trigger modifies amount_needed - review needed'
    ELSE 'ℹ️ Trigger mentions amount but may not modify it'
  END AS status
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('help_requests', 'community_help_requests')
  AND (
    action_statement LIKE '%amount%'
    OR action_statement LIKE '%amount_needed%'
  );

-- If this returns no rows, that's GOOD! No triggers modifying amounts.

-- ========================================================================
-- CHECK 5: Verify WITH CHECK conditions are simple
-- ========================================================================

SELECT 
  '=== CHECK 5: Policy WITH CHECK Conditions ===' AS check_name;

SELECT 
  tablename,
  policyname,
  with_check AS condition,
  CASE 
    WHEN with_check = '(auth.uid() = user_id)' THEN '✅ Simple condition (correct)'
    WHEN with_check LIKE '%auth.uid() = user_id%' AND with_check NOT LIKE '%AND%' THEN '✅ Simple condition'
    ELSE '⚠️ Complex condition (may cause issues)'
  END AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('help_requests', 'community_help_requests')
  AND cmd = 'INSERT'
ORDER BY tablename;

-- ========================================================================
-- CHECK 6: Test INSERT permissions (dry run)
-- ========================================================================

SELECT 
  '=== CHECK 6: Policy Permissions ===' AS check_name;

-- Check that policies allow authenticated users
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  CASE 
    WHEN 'authenticated' = ANY(roles) THEN '✅ Allows authenticated users'
    WHEN 'public' = ANY(roles) THEN '⚠️ Allows public (too permissive)'
    ELSE '❌ Does not allow authenticated users'
  END AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('help_requests', 'community_help_requests')
  AND cmd = 'INSERT'
ORDER BY tablename;

-- ========================================================================
-- CHECK 7: Sample data verification (if data exists)
-- ========================================================================

SELECT 
  '=== CHECK 7: Sample Data Verification ===' AS check_name;

-- Check latest 5 requests to see if amounts look correct
SELECT 
  'help_requests' AS table_name,
  id,
  title,
  amount_needed,
  user_id,
  created_at,
  CASE 
    WHEN amount_needed IS NULL THEN '⚠️ NULL (may be intentional)'
    WHEN amount_needed = 0 THEN '⚠️ Zero (may be wrong)'
    WHEN amount_needed < 0 THEN '❌ Negative (definitely wrong)'
    WHEN amount_needed > 0 THEN '✅ Positive amount'
    ELSE '❓ Unknown'
  END AS status
FROM help_requests
ORDER BY created_at DESC
LIMIT 5;

-- ========================================================================
-- CHECK 8: RLS is enabled
-- ========================================================================

SELECT 
  '=== CHECK 8: RLS Enabled ===' AS check_name;

SELECT 
  tablename,
  rowsecurity AS rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS is enabled'
    ELSE '❌ RLS is disabled (enable it!)'
  END AS status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('help_requests', 'community_help_requests')
ORDER BY tablename;

-- ========================================================================
-- CHECK 9: Count policies per table
-- ========================================================================

SELECT 
  '=== CHECK 9: Policy Count ===' AS check_name;

SELECT 
  tablename,
  COUNT(*) AS policy_count,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ Has multiple policies (SELECT, INSERT, UPDATE, DELETE)'
    WHEN COUNT(*) < 5 THEN '⚠️ May be missing some policies'
    ELSE '❓ Unknown'
  END AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('help_requests', 'community_help_requests')
GROUP BY tablename
ORDER BY tablename;

-- ========================================================================
-- CHECK 10: Verify PostgREST schema cache
-- ========================================================================

SELECT 
  '=== CHECK 10: Schema Cache ===' AS check_name;

-- Refresh cache to ensure changes are live
NOTIFY pgrst, 'reload schema';

SELECT '✅ PostgREST schema cache refreshed' AS status;

-- ========================================================================
-- SUMMARY REPORT
-- ========================================================================

SELECT 
  '=== SUMMARY REPORT ===' AS report;

DO $$
DECLARE
  help_requests_policy_exists BOOLEAN;
  comm_requests_policy_exists BOOLEAN;
  amount_has_default BOOLEAN;
  rls_enabled_hr BOOLEAN;
  rls_enabled_chr BOOLEAN;
BEGIN
  -- Check if new policies exist
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'help_requests' 
      AND policyname = 'allow_authenticated_insert_help_requests'
  ) INTO help_requests_policy_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'community_help_requests' 
      AND policyname = 'allow_authenticated_insert_comm_requests'
  ) INTO comm_requests_policy_exists;
  
  -- Check if amount_needed has default
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name IN ('help_requests', 'community_help_requests')
      AND column_name = 'amount_needed'
      AND column_default IS NOT NULL
  ) INTO amount_has_default;
  
  -- Check if RLS is enabled
  SELECT rowsecurity INTO rls_enabled_hr
  FROM pg_tables
  WHERE tablename = 'help_requests';
  
  SELECT rowsecurity INTO rls_enabled_chr
  FROM pg_tables
  WHERE tablename = 'community_help_requests';
  
  -- Report results
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE 'VERIFICATION SUMMARY';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  IF help_requests_policy_exists THEN
    RAISE NOTICE '✅ help_requests: New INSERT policy exists';
  ELSE
    RAISE WARNING '❌ help_requests: New INSERT policy MISSING';
  END IF;
  
  IF comm_requests_policy_exists THEN
    RAISE NOTICE '✅ community_help_requests: New INSERT policy exists';
  ELSE
    RAISE WARNING '❌ community_help_requests: New INSERT policy MISSING';
  END IF;
  
  IF amount_has_default THEN
    RAISE WARNING '❌ amount_needed has DEFAULT value (should be removed)';
  ELSE
    RAISE NOTICE '✅ amount_needed has NO DEFAULT value';
  END IF;
  
  IF rls_enabled_hr THEN
    RAISE NOTICE '✅ help_requests: RLS is enabled';
  ELSE
    RAISE WARNING '❌ help_requests: RLS is DISABLED';
  END IF;
  
  IF rls_enabled_chr THEN
    RAISE NOTICE '✅ community_help_requests: RLS is enabled';
  ELSE
    RAISE WARNING '❌ community_help_requests: RLS is DISABLED';
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  IF help_requests_policy_exists AND comm_requests_policy_exists 
     AND NOT amount_has_default AND rls_enabled_hr AND rls_enabled_chr THEN
    RAISE NOTICE '✅ ALL CHECKS PASSED - Fix is deployed correctly!';
  ELSE
    RAISE WARNING '⚠️ SOME CHECKS FAILED - Review the issues above';
  END IF;
  
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- ========================================================================
-- NEXT STEPS
-- ========================================================================

SELECT 
  '=== NEXT STEPS ===' AS section;

SELECT 
  'If all checks passed, test with a NEW user account:' AS step_1,
  '1. Create new user in Supabase Auth' AS step_1a,
  '2. Login as new user in Sahaaya app' AS step_1b,
  '3. Create help request with amount = 1000' AS step_1c,
  '4. Verify amount_needed = 1000 in database' AS step_1d;

-- ========================================================================
-- END OF VERIFICATION SCRIPT
-- ========================================================================

SELECT '✅ Verification script completed' AS final_status;
