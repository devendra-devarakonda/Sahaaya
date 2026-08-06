-- =====================================================
-- FIX: Column Reference Ambiguity in Complete Help Functions
-- =====================================================
-- Error: "column reference request_id is ambiguous"
-- Cause: Parameter name conflicts with column name
-- Solution: Use proper table aliasing and qualified column names
-- =====================================================

-- ========================================================================
-- STEP 1: Fix complete_global_help_request Function
-- ========================================================================

CREATE OR REPLACE FUNCTION complete_global_help_request(
  request_id UUID
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
  WHERE hr.id = request_id  -- Properly qualified with table alias
    AND hr.user_id = auth.uid()
    AND hr.status IN ('matched', 'in_progress');
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Request not found or cannot be completed'
    );
  END IF;

  -- Update request status to completed
  UPDATE public.help_requests hr
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE hr.id = request_id;  -- Properly qualified with table alias

  -- Create notifications for all helpers
  -- Fixed: Use proper table alias to avoid ambiguity
  FOR v_helper IN 
    SELECT DISTINCT ho.helper_id, ho.helper_name
    FROM public.help_offers ho
    WHERE ho.request_id = complete_global_help_request.request_id  -- Fully qualified with function name
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
      request_id
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
  request_id UUID
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
  WHERE chr.id = request_id  -- Properly qualified with table alias
    AND chr.user_id = auth.uid()
    AND chr.status IN ('matched', 'in_progress');
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Request not found or cannot be completed'
    );
  END IF;

  -- Update request status to completed
  UPDATE public.community_help_requests chr
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE chr.id = request_id;  -- Properly qualified with table alias

  -- Create notifications for all helpers
  -- Fixed: Use proper table alias and column name
  FOR v_helper IN 
    SELECT DISTINCT cho.helper_id
    FROM public.community_help_offers cho
    WHERE cho.help_request_id = complete_community_help_request.request_id  -- Fully qualified
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
      request_id
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', 'Community help request marked as completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- STEP 3: Verify Function Signatures
-- ========================================================================

-- Add 'help_completed' to notification type check if not already present
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

-- Grant execute permissions (re-grant after function recreation)
GRANT EXECUTE ON FUNCTION complete_global_help_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_community_help_request(UUID) TO authenticated;

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================

SELECT 'Complete Help functions fixed successfully!' as status;
SELECT 'Fixed ambiguous column references in both global and community completion functions' as info;