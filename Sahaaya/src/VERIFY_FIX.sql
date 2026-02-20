-- =====================================================
-- 🔍 VERIFICATION SCRIPT: Complete Help Fix
-- =====================================================
-- Run this in Supabase SQL Editor AFTER running the fix
-- This will verify everything is configured correctly
-- =====================================================

-- ========================================================================
-- CHECK 1: Verify functions exist with correct parameter names
-- ========================================================================

SELECT 
  '🔍 CHECK 1: Function Existence' as check_name,
  '─────────────────────────────' as separator;

SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as parameters,
  CASE 
    WHEN pg_get_function_identity_arguments(p.oid) LIKE '%p_request_id%' THEN '✅ CORRECT'
    WHEN pg_get_function_identity_arguments(p.oid) LIKE '%request_id%' THEN '❌ OLD (needs fix)'
    ELSE '⚠️ UNKNOWN'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('complete_global_help_request', 'complete_community_help_request')
  AND n.nspname = 'public'
ORDER BY p.proname;

-- ========================================================================
-- CHECK 2: Verify notification type constraint includes 'help_completed'
-- ========================================================================

SELECT 
  '🔍 CHECK 2: Notification Type Constraint' as check_name,
  '─────────────────────────────────────────' as separator;

SELECT 
  conname as constraint_name,
  CASE 
    WHEN pg_get_constraintdef(oid) LIKE '%help_completed%' THEN '✅ INCLUDES help_completed'
    ELSE '❌ MISSING help_completed'
  END as status,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'notifications_type_check'
  AND conrelid = 'public.notifications'::regclass;

-- ========================================================================
-- CHECK 3: Count existing help requests by status
-- ========================================================================

SELECT 
  '🔍 CHECK 3: Help Requests Status Distribution' as check_name,
  '──────────────────────────────────────────────' as separator;

SELECT 
  status,
  COUNT(*) as count,
  CASE 
    WHEN status = 'completed' THEN '✅ Completed requests exist'
    WHEN status = 'matched' THEN '🔵 Ready to be completed'
    WHEN status = 'pending' THEN '🟡 Awaiting help'
    ELSE '📊 Other status'
  END as note
FROM public.help_requests
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'matched' THEN 2
    WHEN 'in_progress' THEN 3
    WHEN 'completed' THEN 4
    ELSE 5
  END;

-- ========================================================================
-- CHECK 4: Count community help requests by status
-- ========================================================================

SELECT 
  '🔍 CHECK 4: Community Requests Status Distribution' as check_name,
  '────────────────────────────────────────────────────' as separator;

SELECT 
  status,
  COUNT(*) as count,
  CASE 
    WHEN status = 'completed' THEN '✅ Completed requests exist'
    WHEN status = 'matched' THEN '🔵 Ready to be completed'
    WHEN status = 'pending' THEN '🟡 Awaiting help'
    ELSE '📊 Other status'
  END as note
FROM public.community_help_requests
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'matched' THEN 2
    WHEN 'in_progress' THEN 3
    WHEN 'completed' THEN 4
    ELSE 5
  END;

-- ========================================================================
-- CHECK 5: Verify help_offers can be marked completed
-- ========================================================================

SELECT 
  '🔍 CHECK 5: Help Offers Status Distribution' as check_name,
  '───────────────────────────────────────────' as separator;

SELECT 
  status,
  COUNT(*) as count
FROM public.help_offers
GROUP BY status
ORDER BY status;

-- ========================================================================
-- CHECK 6: Verify permissions on functions
-- ========================================================================

SELECT 
  '🔍 CHECK 6: Function Permissions' as check_name,
  '─────────────────────────────────' as separator;

SELECT 
  p.proname as function_name,
  pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE') as can_execute,
  CASE 
    WHEN pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE') THEN '✅ Accessible'
    ELSE '❌ NOT accessible'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('complete_global_help_request', 'complete_community_help_request')
  AND n.nspname = 'public';

-- ========================================================================
-- CHECK 7: Recent notifications of type 'help_completed'
-- ========================================================================

SELECT 
  '🔍 CHECK 7: Recent Help Completed Notifications' as check_name,
  '─────────────────────────────────────────────────' as separator;

SELECT 
  COUNT(*) as total_help_completed_notifications,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as last_24_hours,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Notifications being created'
    ELSE '⚠️ No help_completed notifications yet (expected if not tested)'
  END as status
FROM public.notifications
WHERE type = 'help_completed';

-- ========================================================================
-- SUMMARY REPORT
-- ========================================================================

SELECT 
  '═══════════════════════════════════════════════' as separator,
  '📊 VERIFICATION SUMMARY' as title,
  '═══════════════════════════════════════════════' as separator2;

DO $$
DECLARE
  v_global_func BOOLEAN;
  v_community_func BOOLEAN;
  v_notification_constraint BOOLEAN;
  v_global_perm BOOLEAN;
  v_community_perm BOOLEAN;
  v_status TEXT := '';
BEGIN
  -- Check global function
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'complete_global_help_request'
      AND n.nspname = 'public'
      AND pg_get_function_identity_arguments(p.oid) LIKE '%p_request_id%'
  ) INTO v_global_func;

  -- Check community function
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'complete_community_help_request'
      AND n.nspname = 'public'
      AND pg_get_function_identity_arguments(p.oid) LIKE '%p_request_id%'
  ) INTO v_community_func;

  -- Check notification constraint
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'notifications_type_check'
      AND pg_get_constraintdef(oid) LIKE '%help_completed%'
  ) INTO v_notification_constraint;

  -- Check permissions
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.proname = 'complete_global_help_request'
      AND pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ) INTO v_global_perm;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.proname = 'complete_community_help_request'
      AND pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ) INTO v_community_perm;

  -- Build status message
  v_status := E'VERIFICATION RESULTS:\n';
  v_status := v_status || E'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  
  IF v_global_func THEN
    v_status := v_status || E'✅ Global help function exists with p_request_id\n';
  ELSE
    v_status := v_status || E'❌ Global help function MISSING or has wrong parameter\n';
  END IF;

  IF v_community_func THEN
    v_status := v_status || E'✅ Community help function exists with p_request_id\n';
  ELSE
    v_status := v_status || E'❌ Community help function MISSING or has wrong parameter\n';
  END IF;

  IF v_notification_constraint THEN
    v_status := v_status || E'✅ Notification constraint includes help_completed\n';
  ELSE
    v_status := v_status || E'❌ Notification constraint MISSING help_completed\n';
  END IF;

  IF v_global_perm THEN
    v_status := v_status || E'✅ Global function has EXECUTE permission\n';
  ELSE
    v_status := v_status || E'❌ Global function MISSING EXECUTE permission\n';
  END IF;

  IF v_community_perm THEN
    v_status := v_status || E'✅ Community function has EXECUTE permission\n';
  ELSE
    v_status := v_status || E'❌ Community function MISSING EXECUTE permission\n';
  END IF;

  v_status := v_status || E'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

  IF v_global_func AND v_community_func AND v_notification_constraint 
     AND v_global_perm AND v_community_perm THEN
    v_status := v_status || E'🎉 ALL CHECKS PASSED - Fix is complete!\n';
    v_status := v_status || E'✅ Ready to test Complete Help functionality\n';
  ELSE
    v_status := v_status || E'⚠️ SOME CHECKS FAILED - Review issues above\n';
    v_status := v_status || E'🔧 Run /RUN_THIS_IN_SUPABASE.sql to fix\n';
  END IF;

  RAISE NOTICE '%', v_status;
END $$;

-- ========================================================================
-- NEXT STEPS
-- ========================================================================

SELECT 
  '📋 NEXT STEPS' as section,
  '─────────────' as separator;

SELECT 
  '1️⃣ If all checks passed ✅' as step,
  '   → Test the Complete Help feature in your app!' as action
UNION ALL
SELECT 
  '2️⃣ If any checks failed ❌' as step,
  '   → Run /RUN_THIS_IN_SUPABASE.sql script' as action
UNION ALL
SELECT 
  '3️⃣ Frontend check' as step,
  '   → Verify /utils/supabaseService.ts uses p_request_id' as action
UNION ALL
SELECT 
  '4️⃣ End-to-end test' as step,
  '   → Mark a help request as complete and verify notifications' as action;
