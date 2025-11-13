-- ========================================================================
-- SAHAAYA PLATFORM - FIX COMMUNITY HELP OFFER NOTIFICATIONS
-- ========================================================================
-- This script ensures notifications are sent to the requester when
-- someone offers help on their community help request.
-- ========================================================================

-- ========================================================================
-- STEP 1: VERIFY TABLE STRUCTURE
-- ========================================================================

-- Check if community_help_offers table has all required columns
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check help_request_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_help_offers'
      AND column_name = 'help_request_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'help_request_id');
  END IF;

  -- Check helper_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_help_offers'
      AND column_name = 'helper_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'helper_id');
  END IF;

  -- Check requester_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_help_offers'
      AND column_name = 'requester_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'requester_id');
  END IF;

  -- Check community_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_help_offers'
      AND column_name = 'community_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'community_id');
  END IF;

  -- Check message
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_help_offers'
      AND column_name = 'message'
  ) THEN
    missing_columns := array_append(missing_columns, 'message');
  END IF;

  -- Check status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_help_offers'
      AND column_name = 'status'
  ) THEN
    missing_columns := array_append(missing_columns, 'status');
  END IF;

  -- Report findings
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'community_help_offers table is missing columns: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ community_help_offers table has all required columns';
  END IF;
END $$;

SELECT 'Table structure verified' as status;

-- ========================================================================
-- STEP 2: DROP EXISTING TRIGGERS AND FUNCTIONS
-- ========================================================================

-- Drop any existing triggers with various possible names
DROP TRIGGER IF EXISTS trg_notify_requester_on_help_offer ON public.community_help_offers;
DROP TRIGGER IF EXISTS trg_notify_on_help_offer ON public.community_help_offers;
DROP TRIGGER IF EXISTS trg_notify_requester_on_community_help_offer ON public.community_help_offers;
DROP TRIGGER IF EXISTS trg_notify_on_community_help_offer ON public.community_help_offers;

-- Drop any existing functions with various possible names
DROP FUNCTION IF EXISTS notify_requester_on_help_offer();
DROP FUNCTION IF EXISTS notify_on_help_offer();
DROP FUNCTION IF EXISTS notify_requester_on_community_help_offer();
DROP FUNCTION IF EXISTS notify_on_community_help_offer();

SELECT 'Old triggers and functions dropped' as status;

-- ========================================================================
-- STEP 3: CREATE THE NOTIFICATION TRIGGER FUNCTION
-- ========================================================================

CREATE OR REPLACE FUNCTION notify_requester_on_help_offer()
RETURNS TRIGGER AS $$
DECLARE
  helper_name TEXT;
  requester_id_var UUID;
  community_name TEXT;
  notification_message TEXT;
BEGIN
  -- Log that trigger has fired
  RAISE NOTICE '🔔 Notification trigger fired for help offer ID: %', NEW.id;

  -- Fetch helper's name from user_profiles
  SELECT COALESCE(full_name, email, 'A community member')
  INTO helper_name
  FROM public.user_profiles
  WHERE id = NEW.helper_id;

  IF helper_name IS NULL THEN
    helper_name := 'A community member';
    RAISE WARNING '⚠️ Could not fetch helper name for user ID: %, using default', NEW.helper_id;
  ELSE
    RAISE NOTICE '✅ Helper name: %', helper_name;
  END IF;

  -- Fetch requester_id and community_name from help request
  SELECT chr.user_id, c.name
  INTO requester_id_var, community_name
  FROM public.community_help_requests chr
  JOIN public.communities c ON c.id = chr.community_id
  WHERE chr.id = NEW.help_request_id;

  -- Ensure requester_id was found
  IF requester_id_var IS NULL THEN
    RAISE WARNING '⚠️ No requester found for help request ID: %', NEW.help_request_id;
    RETURN NEW;
  END IF;

  RAISE NOTICE '✅ Requester ID: %, Community: %', requester_id_var, community_name;

  -- Build notification message
  notification_message := helper_name || ' from community "' || community_name || '" offered to help you with your request.';

  RAISE NOTICE '✅ Notification message: %', notification_message;

  -- Insert notification for requester
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

  RAISE NOTICE '✅ Notification created successfully for requester ID: %', requester_id_var;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the offer creation
    RAISE WARNING '❌ Failed to create notification: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RAISE WARNING 'Help offer ID: %, Helper ID: %, Request ID: %', NEW.id, NEW.helper_id, NEW.help_request_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_requester_on_help_offer() IS
'Automatically creates a notification when someone offers help on a community request.
Format: "{helper_name} from community "{community_name}" offered to help you with your request."
Uses SECURITY DEFINER to bypass RLS on notifications table.
Includes comprehensive logging for debugging.';

SELECT 'Notification trigger function created' as status;

-- ========================================================================
-- STEP 4: CREATE THE TRIGGER
-- ========================================================================

CREATE TRIGGER trg_notify_requester_on_help_offer
AFTER INSERT ON public.community_help_offers
FOR EACH ROW
EXECUTE FUNCTION notify_requester_on_help_offer();

COMMENT ON TRIGGER trg_notify_requester_on_help_offer ON public.community_help_offers IS
'Triggers notification creation when a help offer is made in a community.
Fires AFTER INSERT to ensure the offer record exists before creating notification.';

SELECT 'Trigger created successfully' as status;

-- ========================================================================
-- STEP 5: VERIFY NOTIFICATIONS TABLE STRUCTURE
-- ========================================================================

DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check recipient_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'recipient_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'recipient_id');
  END IF;

  -- Check sender_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'sender_id'
  ) THEN
    missing_columns := array_append(missing_columns, 'sender_id');
  END IF;

  -- Check type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'type'
  ) THEN
    missing_columns := array_append(missing_columns, 'type');
  END IF;

  -- Check content
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'content'
  ) THEN
    missing_columns := array_append(missing_columns, 'content');
  END IF;

  -- Check is_read
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'is_read'
  ) THEN
    missing_columns := array_append(missing_columns, 'is_read');
  END IF;

  -- Report findings
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE WARNING '⚠️ Notifications table is missing columns: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ Notifications table has all required columns';
  END IF;
END $$;

-- ========================================================================
-- STEP 6: VERIFY RLS POLICIES
-- ========================================================================

-- Check SELECT policy on notifications
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'notifications'
        AND cmd = 'SELECT'
        AND policyname LIKE '%select%'
    )
    THEN '✅ SELECT policy exists on notifications'
    ELSE '⚠️ WARNING: No SELECT policy on notifications - users may not see their notifications'
  END as rls_select_check;

-- Check if RLS is enabled on notifications
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename = 'notifications'
        AND rowsecurity = true
    )
    THEN '✅ RLS is enabled on notifications table'
    ELSE '⚠️ WARNING: RLS is NOT enabled on notifications table'
  END as rls_enabled_check;

-- ========================================================================
-- STEP 7: CREATE/VERIFY INCREMENT SUPPORTERS RPC
-- ========================================================================

CREATE OR REPLACE FUNCTION increment_community_request_supporters(request_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.community_help_requests
  SET 
    supporters = COALESCE(supporters, 0) + 1,
    updated_at = NOW()
  WHERE id = request_id;
  
  RAISE NOTICE '✅ Incremented supporters count for request ID: %', request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_community_request_supporters(UUID) IS
'Increments the supporters count for a community help request.
Called after a help offer is created.';

SELECT 'RPC function created: increment_community_request_supporters' as status;

-- ========================================================================
-- STEP 8: TEST THE TRIGGER (OPTIONAL - UNCOMMENT TO RUN)
-- ========================================================================

/*
-- Uncomment this section to test the trigger manually

DO $$
DECLARE
  test_community_id UUID;
  test_requester_id UUID;
  test_helper_id UUID;
  test_request_id UUID;
  test_offer_id UUID;
  notification_count INT;
BEGIN
  RAISE NOTICE '=== STARTING NOTIFICATION TRIGGER TEST ===';

  -- Get a test community
  SELECT id INTO test_community_id
  FROM public.communities
  LIMIT 1;

  IF test_community_id IS NULL THEN
    RAISE NOTICE '⚠️ No communities found - cannot run test';
    RETURN;
  END IF;

  RAISE NOTICE 'Using test community ID: %', test_community_id;

  -- Get two different users from auth.users
  SELECT id INTO test_requester_id
  FROM auth.users
  ORDER BY created_at
  LIMIT 1;

  SELECT id INTO test_helper_id
  FROM auth.users
  WHERE id != test_requester_id
  ORDER BY created_at
  LIMIT 1;

  IF test_requester_id IS NULL OR test_helper_id IS NULL THEN
    RAISE NOTICE '⚠️ Need at least 2 users to run test';
    RETURN;
  END IF;

  RAISE NOTICE 'Requester ID: %', test_requester_id;
  RAISE NOTICE 'Helper ID: %', test_helper_id;

  -- Create a test help request
  INSERT INTO public.community_help_requests (
    community_id,
    user_id,
    title,
    description,
    urgency,
    status,
    supporters
  )
  VALUES (
    test_community_id,
    test_requester_id,
    'TEST REQUEST - Verify Notifications',
    'This is an automated test to verify notification creation',
    'medium',
    'pending',
    0
  )
  RETURNING id INTO test_request_id;

  RAISE NOTICE '✅ Created test request ID: %', test_request_id;

  -- Count notifications before
  SELECT COUNT(*) INTO notification_count
  FROM public.notifications
  WHERE recipient_id = test_requester_id
    AND type = 'community_help_offer';

  RAISE NOTICE 'Notifications before: %', notification_count;

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
    'Test offer - automated',
    'pending'
  )
  RETURNING id INTO test_offer_id;

  RAISE NOTICE '✅ Created test offer ID: %', test_offer_id;

  -- Wait a moment for trigger to complete
  PERFORM pg_sleep(0.5);

  -- Count notifications after
  SELECT COUNT(*) INTO notification_count
  FROM public.notifications
  WHERE recipient_id = test_requester_id
    AND type = 'community_help_offer'
    AND created_at > NOW() - INTERVAL '5 seconds';

  IF notification_count > 0 THEN
    RAISE NOTICE '✅ TEST PASSED: Notification was created successfully';
    
    -- Show the notification
    DECLARE
      notif_content TEXT;
    BEGIN
      SELECT content INTO notif_content
      FROM public.notifications
      WHERE recipient_id = test_requester_id
        AND type = 'community_help_offer'
      ORDER BY created_at DESC
      LIMIT 1;
      
      RAISE NOTICE 'Notification content: %', notif_content;
    END;
  ELSE
    RAISE WARNING '❌ TEST FAILED: No notification was created';
  END IF;

  -- Clean up test data
  DELETE FROM public.community_help_offers WHERE id = test_offer_id;
  DELETE FROM public.community_help_requests WHERE id = test_request_id;

  RAISE NOTICE '✅ Test data cleaned up';
  RAISE NOTICE '=== TEST COMPLETE ===';
END $$;
*/

-- ========================================================================
-- STEP 9: REFRESH POSTGREST SCHEMA CACHE
-- ========================================================================

NOTIFY pgrst, 'reload schema';

SELECT 'PostgREST schema cache refreshed' as status;

-- ========================================================================
-- STEP 10: VERIFICATION SUMMARY
-- ========================================================================

SELECT '=== VERIFICATION SUMMARY ===' as status;

-- 1. Check trigger exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE event_object_schema = 'public'
        AND event_object_table = 'community_help_offers'
        AND trigger_name = 'trg_notify_requester_on_help_offer'
    )
    THEN '✅ Trigger "trg_notify_requester_on_help_offer" exists'
    ELSE '❌ Trigger NOT found'
  END as trigger_check;

-- 2. Check function exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'notify_requester_on_help_offer'
    )
    THEN '✅ Function "notify_requester_on_help_offer()" exists'
    ELSE '❌ Function NOT found'
  END as function_check;

-- 3. Check function is SECURITY DEFINER
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'notify_requester_on_help_offer'
        AND prosecdef = true
    )
    THEN '✅ Function uses SECURITY DEFINER (can bypass RLS)'
    ELSE '❌ Function is NOT SECURITY DEFINER'
  END as security_check;

-- 4. Check increment function
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_proc
      WHERE proname = 'increment_community_request_supporters'
    )
    THEN '✅ RPC "increment_community_request_supporters" exists'
    ELSE '❌ RPC function missing'
  END as rpc_check;

-- 5. Show trigger details
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'community_help_offers'
  AND trigger_name = 'trg_notify_requester_on_help_offer';

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================

SELECT
  '✅ NOTIFICATION TRIGGER FIX COMPLETE' as status,
  'Notifications will be sent automatically when help offers are made' as result,
  'Format: "{helper_name} from community "{community_name}" offered to help you..."' as format,
  'Check PostgreSQL logs for NOTICE messages when offers are created' as debugging_tip;

-- ========================================================================
-- TESTING INSTRUCTIONS
-- ========================================================================

/*
TO TEST THE FIX:

1. Log in as User A (Requester)
2. Create a help request in a community
3. Note the request details
4. Log out

5. Log in as User B (Helper) - must be in the same community
6. Go to the community → "Browse Help" tab
7. Find User A's request
8. Click "View Details"
9. Click "Offer Help"
10. Submit the offer

EXPECTED RESULTS:
✅ "Help offer sent successfully!" toast appears
✅ No errors in browser console
✅ No errors in Supabase logs

11. Log out and log back in as User A
12. Click the Notifications bell icon in header
13. ✅ New notification appears:
    "{User B Name} from community "{Community Name}" offered to help you with your request."

TO CHECK DATABASE DIRECTLY:

-- View recent notifications
SELECT
  n.id,
  n.recipient_id,
  n.sender_id,
  n.type,
  n.content,
  n.is_read,
  n.created_at,
  rp.full_name as recipient_name,
  sp.full_name as sender_name
FROM notifications n
LEFT JOIN user_profiles rp ON rp.id = n.recipient_id
LEFT JOIN user_profiles sp ON sp.id = n.sender_id
WHERE n.type = 'community_help_offer'
ORDER BY n.created_at DESC
LIMIT 10;

-- View recent help offers
SELECT
  cho.id,
  cho.help_request_id,
  cho.helper_id,
  cho.requester_id,
  cho.status,
  cho.created_at,
  hp.full_name as helper_name,
  rp.full_name as requester_name,
  chr.title as request_title
FROM community_help_offers cho
LEFT JOIN user_profiles hp ON hp.id = cho.helper_id
LEFT JOIN user_profiles rp ON rp.id = cho.requester_id
LEFT JOIN community_help_requests chr ON chr.id = cho.help_request_id
ORDER BY cho.created_at DESC
LIMIT 10;

TO VIEW TRIGGER LOGS:

Check Supabase Dashboard → Logs → Postgres Logs
Look for NOTICE messages starting with:
- "🔔 Notification trigger fired..."
- "✅ Helper name: ..."
- "✅ Requester ID: ..."
- "✅ Notification created successfully..."

If you see WARNING messages:
- "⚠️ No requester found..." → help_request_id may be invalid
- "❌ Failed to create notification..." → Check RLS policies
*/

SELECT '📋 Script execution complete!' as final_status;
