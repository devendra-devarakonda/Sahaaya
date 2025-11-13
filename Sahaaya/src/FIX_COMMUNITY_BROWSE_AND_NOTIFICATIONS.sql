-- ========================================================================
-- SAHAAYA PLATFORM - FIX COMMUNITY HELP BROWSE & NOTIFICATIONS
-- ========================================================================
-- This script fixes two issues:
-- 1. Users seeing their own requests in Browse Help (should only see others')
-- 2. Notifications not reaching the requester when someone offers help
-- ========================================================================

-- ========================================================================
-- ISSUE 1: Browse Help Shows User's Own Requests
-- ========================================================================
-- SOLUTION: Frontend now uses .neq('user_id', user.id) to exclude own requests
-- No database changes needed for this issue - it's handled in the query

SELECT '✅ Issue 1: Frontend query now excludes user''s own requests' as status;

-- ========================================================================
-- ISSUE 2: Notifications Not Reaching Requester
-- ========================================================================
-- PROBLEM: The existing trigger may not be working correctly
-- SOLUTION: Re-create the trigger with proper error handling

-- ========================================================================
-- STEP 1: DROP EXISTING TRIGGER AND FUNCTION
-- ========================================================================

-- Drop any existing triggers
DROP TRIGGER IF EXISTS trg_notify_on_community_help_offer ON public.community_help_offers;
DROP TRIGGER IF EXISTS trg_notify_requester_on_community_help_offer ON public.community_help_offers;

-- Drop any existing functions
DROP FUNCTION IF EXISTS notify_on_community_help_offer();
DROP FUNCTION IF EXISTS notify_requester_on_community_help_offer();

SELECT 'Old triggers and functions dropped' as status;

-- ========================================================================
-- STEP 2: CREATE IMPROVED NOTIFICATION TRIGGER FUNCTION
-- ========================================================================

CREATE OR REPLACE FUNCTION notify_requester_on_community_help_offer()
RETURNS TRIGGER AS $$
DECLARE
  helper_name TEXT;
  requester_id_var UUID;
  community_name TEXT;
  notification_message TEXT;
  request_title TEXT;
BEGIN
  -- Get helper's name from user_profiles view
  SELECT COALESCE(full_name, email, 'A community member')
  INTO helper_name
  FROM public.user_profiles
  WHERE id = NEW.helper_id;

  -- Get requester_id, community_name, and request_title
  SELECT 
    chr.user_id,
    c.name,
    chr.title
  INTO 
    requester_id_var,
    community_name,
    request_title
  FROM public.community_help_requests chr
  JOIN public.communities c ON c.id = chr.community_id
  WHERE chr.id = NEW.help_request_id;

  -- Build notification message
  notification_message := helper_name || ' from community "' || community_name || '" offered to help you with your request.';

  -- Insert notification for the requester
  INSERT INTO public.notifications (
    recipient_id,
    sender_id,
    type,
    content,
    is_read,
    created_at
  )
  VALUES (
    requester_id_var,
    NEW.helper_id,
    'community_help_offer',
    notification_message,
    false,
    NOW()
  );

  -- Log success
  RAISE NOTICE 'Notification sent to requester (ID: %): %', requester_id_var, notification_message;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the offer creation
    RAISE WARNING 'Failed to create notification for community help offer: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_requester_on_community_help_offer() IS
'Automatically creates a notification when someone offers help on a community request.
Format: "{helper_name} from community "{community_name}" offered to help you with your request."
Uses SECURITY DEFINER to bypass RLS on notifications table.';

SELECT 'Notification trigger function created with improved error handling' as status;

-- ========================================================================
-- STEP 3: CREATE TRIGGER ON community_help_offers
-- ========================================================================

CREATE TRIGGER trg_notify_requester_on_community_help_offer
AFTER INSERT ON public.community_help_offers
FOR EACH ROW
EXECUTE FUNCTION notify_requester_on_community_help_offer();

COMMENT ON TRIGGER trg_notify_requester_on_community_help_offer ON public.community_help_offers IS
'Triggers notification creation when a help offer is made in a community.
Fires AFTER INSERT to ensure the offer record exists before creating notification.';

SELECT 'Trigger created: Notifications will be sent automatically on new help offers' as status;

-- ========================================================================
-- STEP 4: VERIFY NOTIFICATIONS TABLE STRUCTURE
-- ========================================================================

-- Check if notifications table has required columns
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check for recipient_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'recipient_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'recipient_id');
  END IF;

  -- Check for sender_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'sender_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'sender_id');
  END IF;

  -- Check for type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'type'
  ) THEN
    missing_columns := array_append(missing_columns, 'type');
  END IF;

  -- Check for content
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'content'
  ) THEN
    missing_columns := array_append(missing_columns, 'content');
  END IF;

  -- Report findings
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE WARNING 'Notifications table is missing columns: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ Notifications table has all required columns';
  END IF;
END $$;

-- ========================================================================
-- STEP 5: VERIFY RLS POLICIES ON NOTIFICATIONS
-- ========================================================================

-- Check if INSERT policy exists for notifications
-- The trigger uses SECURITY DEFINER so it can bypass RLS, but let's verify

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'notifications'
        AND cmd = 'SELECT'
    )
    THEN '✅ SELECT policy exists on notifications'
    ELSE '⚠️  No SELECT policy on notifications - users may not see their notifications'
  END as rls_check;

-- ========================================================================
-- STEP 6: CREATE RPC FUNCTION TO INCREMENT SUPPORTERS (IF NOT EXISTS)
-- ========================================================================

-- This function is called after creating a help offer
CREATE OR REPLACE FUNCTION increment_community_request_supporters(request_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.community_help_requests
  SET supporters = COALESCE(supporters, 0) + 1
  WHERE id = request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_community_request_supporters(UUID) IS
'Increments the supporters count for a community help request.
Called after a help offer is created.';

SELECT 'RPC function created: increment_community_request_supporters' as status;

-- ========================================================================
-- STEP 7: TEST THE TRIGGER MANUALLY (OPTIONAL)
-- ========================================================================

/*
-- Uncomment to manually test the trigger

DO $$
DECLARE
  test_community_id UUID;
  test_requester_id UUID;
  test_helper_id UUID;
  test_request_id UUID;
  test_offer_id UUID;
BEGIN
  -- Get a test community
  SELECT id INTO test_community_id
  FROM public.communities
  LIMIT 1;

  -- Get two different users
  SELECT id INTO test_requester_id
  FROM auth.users
  WHERE email LIKE '%test1%'
  LIMIT 1;

  SELECT id INTO test_helper_id
  FROM auth.users
  WHERE email LIKE '%test2%'
  LIMIT 1;

  -- Check if we have the necessary data
  IF test_community_id IS NULL OR test_requester_id IS NULL OR test_helper_id IS NULL THEN
    RAISE NOTICE 'Skipping test - insufficient test data';
    RETURN;
  END IF;

  -- Create a test help request
  INSERT INTO public.community_help_requests (
    community_id,
    user_id,
    title,
    description,
    urgency,
    status
  )
  VALUES (
    test_community_id,
    test_requester_id,
    'Test Request - Verify Notifications',
    'This is a test to verify notification creation',
    'medium',
    'pending'
  )
  RETURNING id INTO test_request_id;

  RAISE NOTICE 'Created test request: %', test_request_id;

  -- Create a test help offer (this should trigger the notification)
  INSERT INTO public.community_help_offers (
    help_request_id,
    helper_id,
    requester_id,
    community_id,
    message,
    status
  )
  VALUES (
    test_request_id,
    test_helper_id,
    test_requester_id,
    test_community_id,
    'Test offer',
    'pending'
  )
  RETURNING id INTO test_offer_id;

  RAISE NOTICE 'Created test offer: %', test_offer_id;

  -- Check if notification was created
  IF EXISTS (
    SELECT 1 FROM public.notifications
    WHERE recipient_id = test_requester_id
      AND type = 'community_help_offer'
      AND created_at > NOW() - INTERVAL '1 minute'
  ) THEN
    RAISE NOTICE '✅ TEST PASSED: Notification was created successfully';
  ELSE
    RAISE WARNING '❌ TEST FAILED: Notification was NOT created';
  END IF;

  -- Clean up test data
  DELETE FROM public.community_help_offers WHERE id = test_offer_id;
  DELETE FROM public.community_help_requests WHERE id = test_request_id;

  RAISE NOTICE 'Test data cleaned up';
END $$;
*/

-- ========================================================================
-- STEP 8: REFRESH POSTGREST SCHEMA CACHE
-- ========================================================================

NOTIFY pgrst, 'reload schema';

SELECT 'PostgREST schema cache refreshed' as status;

-- ========================================================================
-- STEP 9: VERIFICATION QUERIES
-- ========================================================================

SELECT '=== VERIFICATION SUMMARY ===' as status;

-- 1. Check trigger exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE event_object_schema = 'public'
        AND event_object_table = 'community_help_offers'
        AND trigger_name = 'trg_notify_requester_on_community_help_offer'
    )
    THEN '✅ Trigger exists and is active'
    ELSE '❌ Trigger NOT found - re-run this script'
  END as trigger_check;

-- 2. Check function exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'notify_requester_on_community_help_offer'
    )
    THEN '✅ Notification function exists'
    ELSE '❌ Function NOT found - re-run this script'
  END as function_check;

-- 3. Check if function is SECURITY DEFINER
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'notify_requester_on_community_help_offer'
        AND prosecdef = true
    )
    THEN '✅ Function uses SECURITY DEFINER (can bypass RLS)'
    ELSE '⚠️  Function is NOT SECURITY DEFINER - may fail due to RLS'
  END as security_check;

-- 4. Check increment_community_request_supporters function
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'increment_community_request_supporters'
    )
    THEN '✅ increment_community_request_supporters RPC exists'
    ELSE '⚠️  RPC function missing - supporters count may not update'
  END as rpc_check;

-- 5. Count recent notifications
SELECT
  COUNT(*) as recent_notifications_count,
  COUNT(CASE WHEN type = 'community_help_offer' THEN 1 END) as community_help_offer_notifications
FROM public.notifications
WHERE created_at > NOW() - INTERVAL '1 hour';

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================

SELECT
  '✅ COMMUNITY BROWSE & NOTIFICATIONS FIX COMPLETE' as status,
  'Browse Help now excludes user''s own requests' as fix_1,
  'Notifications automatically sent when offers are made' as fix_2,
  'Format: "{helper_name} from community "{community_name}" offered to help you."' as notification_format;

-- ========================================================================
-- TESTING INSTRUCTIONS
-- ========================================================================

/*
TO TEST THE FIXES:

=== TEST 1: Browse Help Excludes Own Requests ===

1. Log in as User A
2. Navigate to a community you're a member of
3. Go to "Browse Help" tab
4. Create a new help request via "My Requests" tab
5. Return to "Browse Help" tab
6. ✅ EXPECTED: Your own request should NOT appear in Browse Help
7. ✅ EXPECTED: You should only see requests from other members

=== TEST 2: Notifications Reach Requester ===

1. Log in as User A
2. Create a help request in a community
3. Note the request title
4. Log out

5. Log in as User B (different user, same community)
6. Go to the community → "Browse Help" tab
7. Find User A's request
8. Click "Offer Help"
9. Submit the offer
10. ✅ EXPECTED: "Help offer sent successfully!" message appears

11. Log out and log back in as User A
12. Click the Notifications icon (bell) in header
13. ✅ EXPECTED: New notification appears with message:
    "{User B Name} from community "{Community Name}" offered to help you with your request."
14. ✅ EXPECTED: Notification is marked as unread
15. ✅ EXPECTED: Clicking notification marks it as read

=== TEST 3: Verify in Database ===

-- Check if notification was created
SELECT
  recipient_id,
  sender_id,
  type,
  content,
  is_read,
  created_at
FROM notifications
WHERE type = 'community_help_offer'
ORDER BY created_at DESC
LIMIT 10;

-- Check if offer was created
SELECT
  help_request_id,
  helper_id,
  requester_id,
  status,
  created_at
FROM community_help_offers
ORDER BY created_at DESC
LIMIT 10;

-- Check if supporters count was incremented
SELECT
  id,
  title,
  supporters,
  updated_at
FROM community_help_requests
WHERE supporters > 0
ORDER BY updated_at DESC
LIMIT 10;

=== DEBUGGING ===

If notifications are NOT appearing:

1. Check PostgreSQL logs for NOTICE/WARNING messages:
   - Look for: "Notification sent to requester..."
   - Or: "Failed to create notification..."

2. Verify trigger fired:
   SELECT * FROM pg_stat_user_triggers
   WHERE schemaname = 'public'
     AND relname = 'community_help_offers';

3. Manually test the function:
   SELECT notify_requester_on_community_help_offer();

4. Check RLS policies on notifications:
   SELECT * FROM pg_policies
   WHERE tablename = 'notifications';

5. Verify user_profiles view exists:
   SELECT * FROM user_profiles LIMIT 5;
*/

-- ========================================================================
-- ROLLBACK INSTRUCTIONS (IF NEEDED)
-- ========================================================================

/*
IF YOU NEED TO ROLLBACK:

-- Drop the trigger
DROP TRIGGER IF EXISTS trg_notify_requester_on_community_help_offer ON public.community_help_offers;

-- Drop the function
DROP FUNCTION IF EXISTS notify_requester_on_community_help_offer();

-- Drop the RPC function
DROP FUNCTION IF EXISTS increment_community_request_supporters(UUID);

-- Refresh PostgREST
NOTIFY pgrst, 'reload schema';
*/

SELECT '📋 Script execution complete. Test by offering help in a community!' as final_status;
