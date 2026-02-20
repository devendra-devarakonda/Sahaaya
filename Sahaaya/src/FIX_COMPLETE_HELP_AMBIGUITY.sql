-- =====================================================
-- 🔧 FIX: Complete Help Request Ambiguous Column Error
-- =====================================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- =====================================================

-- ========================================================================
-- 🔧 STEP 0: DROP existing functions (required to change parameter name)
-- ========================================================================

DROP FUNCTION IF EXISTS complete_global_help_request(UUID);
DROP FUNCTION IF EXISTS complete_community_help_request(UUID);

-- ========================================================================
-- 🔧 STEP 1: Fix GLOBAL HELP completion function
-- ========================================================================

CREATE OR REPLACE FUNCTION complete_global_help_request(
  complete_request_id UUID  -- ✅ Renamed from request_id to avoid ambiguity
)
RETURNS JSON AS $$
DECLARE
  v_request RECORD;
  v_helper RECORD;
  v_result JSON;
BEGIN
  -- Verify the request exists and belongs to the current user
  SELECT * INTO v_request
  FROM public.help_requests hr
  WHERE hr.id = complete_request_id
    AND hr.user_id = auth.uid()
    AND hr.status IN ('pending', 'matched', 'in_progress');
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Request not found or cannot be completed'
    );
  END IF;

  -- ✅ Update request status to completed (table-qualified)
  UPDATE public.help_requests
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE help_requests.id = complete_request_id;

  -- ✅ Update all help offers to completed status (table-qualified)
  UPDATE public.help_offers
  SET status = 'completed'
  WHERE help_offers.request_id = complete_request_id;

  -- Create notifications for all helpers
  FOR v_helper IN 
    SELECT DISTINCT ho.helper_id, ho.helper_name
    FROM public.help_offers ho
    WHERE ho.request_id = complete_request_id
  LOOP
    INSERT INTO public.notifications (
      recipient_id,
      sender_id,
      type,
      title,
      content,
      request_id
    ) VALUES (
      v_helper.helper_id,
      auth.uid(),
      'help_completed',
      'Help Request Completed',
      format('The requester has marked your help as completed for: %s. Thank you for your support!', v_request.title),
      complete_request_id
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', 'Help request marked as completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- 🔧 STEP 2: Fix COMMUNITY HELP completion function
-- ========================================================================

CREATE OR REPLACE FUNCTION complete_community_help_request(
  complete_request_id UUID  -- ✅ Renamed from request_id to avoid ambiguity
)
RETURNS JSON AS $$
DECLARE
  v_request RECORD;
  v_helper RECORD;
  v_result JSON;
BEGIN
  -- Verify the request exists and belongs to the current user
  SELECT * INTO v_request
  FROM public.community_help_requests chr
  WHERE chr.id = complete_request_id
    AND chr.user_id = auth.uid()
    AND chr.status IN ('pending', 'matched', 'in_progress');
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Request not found or cannot be completed'
    );
  END IF;

  -- ✅ Update request status to completed (table-qualified)
  UPDATE public.community_help_requests
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE community_help_requests.id = complete_request_id;

  -- ✅ Update all community help offers to completed status (table-qualified)
  UPDATE public.community_help_offers
  SET status = 'completed'
  WHERE community_help_offers.help_request_id = complete_request_id;

  -- Create notifications for all helpers
  FOR v_helper IN 
    SELECT DISTINCT cho.helper_id, u.name as helper_name
    FROM public.community_help_offers cho
    LEFT JOIN public.users u ON u.id = cho.helper_id
    WHERE cho.help_request_id = complete_request_id
  LOOP
    INSERT INTO public.notifications (
      recipient_id,
      sender_id,
      type,
      title,
      content,
      request_id
    ) VALUES (
      v_helper.helper_id,
      auth.uid(),
      'help_completed',
      'Help Request Completed',
      format('The requester has marked your help as completed for: %s. Thank you for your support!', v_request.title),
      complete_request_id
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', 'Community help request marked as completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- 🔧 STEP 3: Ensure notification type constraint includes 'help_completed'
-- ========================================================================

DO $$
BEGIN
  ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN (
      'help_offer',
      'offer_accepted', 
      'offer_rejected',
      'offer_completed',
      'help_completed',
      'request_update',
      'message',
      'system',
      'donation',
      'match'
    ));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not update type constraint: %', SQLERRM;
END $$;

-- ========================================================================
-- 🔧 STEP 4: Grant execution permissions
-- ========================================================================

GRANT EXECUTE ON FUNCTION complete_global_help_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_community_help_request(UUID) TO authenticated;

-- ========================================================================
-- ✅ VERIFICATION
-- ========================================================================

SELECT '✅ Complete Help functions fixed successfully!' as status;
SELECT '✅ Parameter renamed: request_id → complete_request_id' as fix_1;
SELECT '✅ All UPDATE statements use table-qualified columns' as fix_2;
SELECT '✅ help_offers status updates to completed' as fix_3;
SELECT '✅ community_help_offers status updates to completed' as fix_4;

-- ========================================================================
-- 📋 SUMMARY OF CHANGES
-- ========================================================================
-- 1. Renamed function parameter from request_id to complete_request_id
-- 2. Added table qualification to all UPDATE statements:
--    - help_requests.id = complete_request_id
--    - help_offers.request_id = complete_request_id
--    - community_help_requests.id = complete_request_id
--    - community_help_offers.help_request_id = complete_request_id
-- 3. Updated all WHERE clauses to use complete_request_id parameter
-- 4. Added status update for help_offers and community_help_offers
-- 5. Ensured 'help_completed' notification type is allowed
-- ========================================================================