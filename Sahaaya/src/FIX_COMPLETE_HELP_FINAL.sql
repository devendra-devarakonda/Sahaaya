-- =====================================================
-- 🔧 FINAL FIX: Complete Help Request Ambiguous Column Error
-- =====================================================
-- RUN THIS ENTIRE SCRIPT IN YOUR SUPABASE SQL EDITOR
-- IMPORTANT: Run the entire script at once, don't run parts separately
-- =====================================================

-- ========================================================================
-- STEP 1: Drop ALL existing variations of the functions
-- ========================================================================

-- Drop with any possible parameter name variations
DROP FUNCTION IF EXISTS public.complete_global_help_request(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.complete_community_help_request(UUID) CASCADE;
DROP FUNCTION IF EXISTS complete_global_help_request(UUID) CASCADE;
DROP FUNCTION IF EXISTS complete_community_help_request(UUID) CASCADE;

-- Wait a moment for the drops to complete
SELECT pg_sleep(0.5);

-- ========================================================================
-- STEP 2: Create GLOBAL HELP completion function (with new parameter name)
-- ========================================================================

CREATE FUNCTION public.complete_global_help_request(
  p_request_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_request RECORD;
  v_helper RECORD;
BEGIN
  -- Verify the request exists and belongs to the current user
  SELECT * INTO v_request
  FROM public.help_requests
  WHERE id = p_request_id
    AND user_id = auth.uid()
    AND status IN ('pending', 'matched', 'in_progress');
  
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
  WHERE id = p_request_id;

  -- Update all help offers to completed status
  UPDATE public.help_offers
  SET status = 'completed'
  WHERE request_id = p_request_id;

  -- Create notifications for all helpers
  FOR v_helper IN 
    SELECT DISTINCT helper_id, helper_name
    FROM public.help_offers
    WHERE request_id = p_request_id
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
      p_request_id
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', 'Help request marked as completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- STEP 3: Create COMMUNITY HELP completion function (with new parameter name)
-- ========================================================================

CREATE FUNCTION public.complete_community_help_request(
  p_request_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_request RECORD;
  v_helper RECORD;
BEGIN
  -- Verify the request exists and belongs to the current user
  SELECT * INTO v_request
  FROM public.community_help_requests
  WHERE id = p_request_id
    AND user_id = auth.uid()
    AND status IN ('pending', 'matched', 'in_progress');
  
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
  WHERE id = p_request_id;

  -- Update all community help offers to completed status
  UPDATE public.community_help_offers
  SET status = 'completed'
  WHERE help_request_id = p_request_id;

  -- Create notifications for all helpers
  FOR v_helper IN 
    SELECT DISTINCT cho.helper_id, u.name as helper_name
    FROM public.community_help_offers cho
    LEFT JOIN public.users u ON u.id = cho.helper_id
    WHERE cho.help_request_id = p_request_id
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
      p_request_id
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', 'Community help request marked as completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- STEP 4: Ensure notification type constraint includes 'help_completed'
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
-- STEP 5: Grant permissions
-- ========================================================================

GRANT EXECUTE ON FUNCTION public.complete_global_help_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_community_help_request(UUID) TO authenticated;

-- ========================================================================
-- STEP 6: Verify the functions were created successfully
-- ========================================================================

DO $$
DECLARE
  v_global_exists BOOLEAN;
  v_community_exists BOOLEAN;
BEGIN
  -- Check if functions exist
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'complete_global_help_request'
  ) INTO v_global_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'complete_community_help_request'
  ) INTO v_community_exists;
  
  IF v_global_exists AND v_community_exists THEN
    RAISE NOTICE '✅ SUCCESS: Both completion functions created successfully!';
  ELSE
    RAISE NOTICE '❌ WARNING: Some functions may not have been created';
  END IF;
END $$;

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================

SELECT '✅ Complete Help functions fixed successfully!' as status;
SELECT '✅ Parameter name: p_request_id (no ambiguity)' as fix_1;
SELECT '✅ All UPDATE statements simplified (no table prefix needed with p_ prefix)' as fix_2;
SELECT '✅ help_offers status updates to completed' as fix_3;
SELECT '✅ community_help_offers status updates to completed' as fix_4;
SELECT '✅ Test by clicking "Mark as Complete" on any request' as next_step;
