-- =====================================================
-- FIX: Column Reference Ambiguity in Complete Help Functions
-- =====================================================
-- Error: "column reference request_id is ambiguous"
-- Cause: Parameter name conflicts with column name
-- Solution: Rename parameter to complete_request_id and use table-qualified columns
-- =====================================================

-- ========================================================================
-- STEP 0: DROP existing functions (required to change parameter name)
-- ========================================================================

DROP FUNCTION IF EXISTS complete_global_help_request(UUID);
DROP FUNCTION IF EXISTS complete_community_help_request(UUID);

-- ========================================================================
-- STEP 1: Fix complete_global_help_request Function
-- ========================================================================

CREATE OR REPLACE FUNCTION complete_global_help_request(
  complete_request_id UUID
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

  -- Update request status to completed
  UPDATE public.help_requests
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE help_requests.id = complete_request_id;

  -- Update all help offers to completed status
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
-- STEP 2: Fix complete_community_help_request Function
-- ========================================================================

CREATE OR REPLACE FUNCTION complete_community_help_request(
  complete_request_id UUID
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

  -- Update request status to completed
  UPDATE public.community_help_requests
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE community_help_requests.id = complete_request_id;

  -- Update all community help offers to completed status
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
-- STEP 3: Ensure 'help_completed' notification type is allowed
-- ========================================================================

DO $$
BEGIN
  -- Drop and recreate the type constraint to include 'help_completed'
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
-- STEP 4: Grant permissions
-- ========================================================================

GRANT EXECUTE ON FUNCTION complete_global_help_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_community_help_request(UUID) TO authenticated;

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================

SELECT 'Complete Help functions fixed successfully!' as status;
SELECT 'Fixed ambiguous column references - parameter renamed to complete_request_id' as info;
SELECT 'All UPDATE statements now use table-qualified column names' as details;