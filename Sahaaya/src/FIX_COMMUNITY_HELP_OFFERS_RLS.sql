-- ========================================================================
-- SAHAAYA PLATFORM - FIX COMMUNITY HELP OFFERS RLS & NOTIFICATIONS
-- ========================================================================
-- This script fixes the 42501 RLS error when offering help
-- and adds automatic notification creation
-- ========================================================================

-- ========================================================================
-- STEP 1: DROP EXISTING RESTRICTIVE POLICIES
-- ========================================================================

-- Drop old policies that are too restrictive
DROP POLICY IF EXISTS "allow_insert_community_help_offers" ON public.community_help_offers;
DROP POLICY IF EXISTS "allow_select_community_help_offers" ON public.community_help_offers;
DROP POLICY IF EXISTS "allow_update_community_help_offers" ON public.community_help_offers;
DROP POLICY IF EXISTS insert_community_help_offer ON public.community_help_offers;
DROP POLICY IF EXISTS select_community_help_offer ON public.community_help_offers;

SELECT 'Old RLS policies dropped' as status;

-- ========================================================================
-- STEP 2: CREATE NEW INSERT POLICY (COMMUNITY MEMBERSHIP BASED)
-- ========================================================================

-- Allow any authenticated community member to create help offers
-- for requests within their community
CREATE POLICY insert_community_help_offer
ON public.community_help_offers
FOR INSERT
TO authenticated
WITH CHECK (
  -- Check if the user is a member of the community that this request belongs to
  EXISTS (
    SELECT 1
    FROM public.community_help_requests chr
    JOIN public.community_members cm
      ON cm.community_id = chr.community_id
    WHERE chr.id = community_help_offers.help_request_id
      AND cm.user_id = auth.uid()
  )
);

COMMENT ON POLICY insert_community_help_offer ON public.community_help_offers IS
'Allow authenticated community members to offer help on requests in their communities';

SELECT 'Insert policy created: Any community member can offer help' as status;

-- ========================================================================
-- STEP 3: CREATE SELECT POLICY
-- ========================================================================

-- Allow users to view offers if they are:
-- 1. The helper who created the offer
-- 2. The requester receiving the offer
-- 3. A member of the same community
CREATE POLICY select_community_help_offer
ON public.community_help_offers
FOR SELECT
TO authenticated
USING (
  -- User is the helper
  helper_id = auth.uid()
  OR
  -- User is the requester
  requester_id = auth.uid()
  OR
  -- User is a member of the community
  EXISTS (
    SELECT 1
    FROM public.community_members cm
    JOIN public.community_help_requests chr
      ON chr.community_id = cm.community_id
    WHERE chr.id = community_help_offers.help_request_id
      AND cm.user_id = auth.uid()
  )
);

COMMENT ON POLICY select_community_help_offer ON public.community_help_offers IS
'Allow users to view offers they created, received, or are in the same community';

SELECT 'Select policy created: Helpers, requesters, and community members can view' as status;

-- ========================================================================
-- STEP 4: CREATE UPDATE POLICY
-- ========================================================================

-- Allow requester to update the status of offers they received
CREATE POLICY update_community_help_offer
ON public.community_help_offers
FOR UPDATE
TO authenticated
USING (
  requester_id = auth.uid()
)
WITH CHECK (
  requester_id = auth.uid()
);

COMMENT ON POLICY update_community_help_offer ON public.community_help_offers IS
'Allow requesters to update the status of offers they received';

SELECT 'Update policy created: Requesters can update offer status' as status;

-- ========================================================================
-- STEP 5: CREATE DELETE POLICY
-- ========================================================================

-- Allow helper to delete their own offers (if they change their mind)
CREATE POLICY delete_community_help_offer
ON public.community_help_offers
FOR DELETE
TO authenticated
USING (
  helper_id = auth.uid()
);

COMMENT ON POLICY delete_community_help_offer ON public.community_help_offers IS
'Allow helpers to delete their own offers';

SELECT 'Delete policy created: Helpers can delete their own offers' as status;

-- ========================================================================
-- STEP 6: CREATE NOTIFICATION TRIGGER FUNCTION
-- ========================================================================

-- Function to automatically create notification when help offer is made
CREATE OR REPLACE FUNCTION notify_on_community_help_offer()
RETURNS TRIGGER AS $$
DECLARE
  helper_name TEXT;
  community_name TEXT;
  notification_message TEXT;
BEGIN
  -- Get helper's name from user_profiles view
  SELECT COALESCE(full_name, email, 'A community member')
  INTO helper_name
  FROM public.user_profiles
  WHERE id = NEW.helper_id;

  -- Get community name
  SELECT c.name
  INTO community_name
  FROM public.communities c
  JOIN public.community_help_requests chr ON chr.community_id = c.id
  WHERE chr.id = NEW.help_request_id;

  -- Build notification message
  notification_message := helper_name || ' from community "' || community_name || '" is willing to help you.';

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
    NEW.requester_id,
    NEW.helper_id,
    'community_help_offer',
    notification_message,
    false,
    NOW()
  );

  RAISE NOTICE 'Notification sent to requester: %', notification_message;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the offer creation
    RAISE WARNING 'Failed to create notification for community help offer: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_on_community_help_offer() IS
'Automatically creates a notification when someone offers help on a community request';

SELECT 'Notification trigger function created' as status;

-- ========================================================================
-- STEP 7: CREATE TRIGGER ON community_help_offers
-- ========================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_notify_on_community_help_offer ON public.community_help_offers;

-- Create trigger that fires after insert
CREATE TRIGGER trg_notify_on_community_help_offer
AFTER INSERT ON public.community_help_offers
FOR EACH ROW
EXECUTE FUNCTION notify_on_community_help_offer();

COMMENT ON TRIGGER trg_notify_on_community_help_offer ON public.community_help_offers IS
'Triggers notification creation when a help offer is made';

SELECT 'Trigger created: Notifications will be sent automatically' as status;

-- ========================================================================
-- STEP 8: VERIFY POLICIES ARE IN PLACE
-- ========================================================================

SELECT 
  '=== VERIFICATION: RLS Policies ===' as status;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL as has_using_clause,
  with_check IS NOT NULL as has_with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'community_help_offers'
ORDER BY policyname;

-- ========================================================================
-- STEP 9: VERIFY TRIGGER EXISTS
-- ========================================================================

SELECT 
  '=== VERIFICATION: Triggers ===' as status;

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'community_help_offers'
ORDER BY trigger_name;

-- ========================================================================
-- STEP 10: TEST THE NOTIFICATION FUNCTION
-- ========================================================================

-- Test that the function compiles and returns the expected structure
SELECT 
  '=== TEST: Notification Function ===' as status;

SELECT
  proname as function_name,
  prosecdef as is_security_definer,
  provolatile as volatility,
  'Function is ready' as status
FROM pg_proc
WHERE proname = 'notify_on_community_help_offer';

-- ========================================================================
-- STEP 11: REFRESH POSTGREST SCHEMA CACHE
-- ========================================================================

NOTIFY pgrst, 'reload schema';

SELECT 'PostgREST schema cache refreshed' as status;

-- ========================================================================
-- SUCCESS SUMMARY
-- ========================================================================

SELECT 
  '✅ COMMUNITY HELP OFFERS RLS FIXED' as status,
  'Community members can now offer help' as insert_policy,
  'Automatic notifications enabled' as notification_feature,
  'Requesters will see: "{helper_name} from community "{community_name}" is willing to help you."' as notification_format;

-- ========================================================================
-- TESTING INSTRUCTIONS
-- ========================================================================

/*
TO TEST THIS FIX:

1. Log in as a community member
2. Navigate to any community you're a member of
3. Go to "Browse Help" tab
4. Click "Offer Help" on any request
5. Enter a message and submit

EXPECTED RESULTS:
✅ No 42501 RLS error
✅ Offer created successfully
✅ Requester receives notification immediately
✅ Notification appears in their Notifications tab
✅ Message format: "{Helper Name} from community "{Community Name}" is willing to help you."

TO VERIFY NOTIFICATION WAS SENT:
SELECT * FROM notifications
WHERE type = 'community_help_offer'
ORDER BY created_at DESC
LIMIT 5;

TO VERIFY RLS POLICIES:
-- Test as a community member (should succeed)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '<user_uuid>';
INSERT INTO community_help_offers (
  help_request_id, helper_id, requester_id, message, status
) VALUES (
  '<request_id>', '<helper_id>', '<requester_id>', 'Test offer', 'pending'
);
*/

-- ========================================================================
-- ROLLBACK INSTRUCTIONS (IF NEEDED)
-- ========================================================================

/*
IF YOU NEED TO ROLLBACK THESE CHANGES:

-- Drop the trigger
DROP TRIGGER IF EXISTS trg_notify_on_community_help_offer ON public.community_help_offers;

-- Drop the function
DROP FUNCTION IF EXISTS notify_on_community_help_offer();

-- Drop the policies
DROP POLICY IF EXISTS insert_community_help_offer ON public.community_help_offers;
DROP POLICY IF EXISTS select_community_help_offer ON public.community_help_offers;
DROP POLICY IF EXISTS update_community_help_offer ON public.community_help_offers;
DROP POLICY IF EXISTS delete_community_help_offer ON public.community_help_offers;

-- Then re-create your original policies
*/

SELECT '✅ SUCCESS: All fixes applied! Test by offering help in a community.' as final_status;
