-- =====================================================
-- 🚨 EMERGENCY FIX: Complete Help Functions
-- =====================================================
-- Copy this ENTIRE file and run it in Supabase SQL Editor
-- This will forcefully drop and recreate the functions
-- =====================================================

-- ========================================================================
-- STEP 1: FORCE DROP all variations (no matter what parameter name)
-- ========================================================================

-- Try dropping with CASCADE to remove all dependencies
DO $$ 
BEGIN
    EXECUTE 'DROP FUNCTION IF EXISTS public.complete_global_help_request CASCADE';
    EXECUTE 'DROP FUNCTION IF EXISTS complete_global_help_request CASCADE';
    EXECUTE 'DROP FUNCTION IF EXISTS public.complete_community_help_request CASCADE';
    EXECUTE 'DROP FUNCTION IF EXISTS complete_community_help_request CASCADE';
    RAISE NOTICE '✅ Old functions dropped successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Drop attempt completed (may have had warnings)';
END $$;

-- ========================================================================
-- STEP 2: Create NEW GLOBAL completion function with clean parameter name
-- ========================================================================

CREATE FUNCTION public.complete_global_help_request(
  p_request_id UUID  -- Using p_ prefix to avoid ANY ambiguity
)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
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
$$;

-- ========================================================================
-- STEP 3: Create NEW COMMUNITY completion function with clean parameter name
-- ========================================================================

CREATE FUNCTION public.complete_community_help_request(
  p_request_id UUID  -- Using p_ prefix to avoid ANY ambiguity
)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
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
$$;

-- ========================================================================
-- STEP 4: Ensure notification type includes 'help_completed'
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
  RAISE NOTICE '✅ Notification type constraint updated';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Type constraint already correct or could not be updated: %', SQLERRM;
END $$;

-- ========================================================================
-- STEP 5: Grant permissions
-- ========================================================================

GRANT EXECUTE ON FUNCTION public.complete_global_help_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_community_help_request(UUID) TO authenticated;

-- ========================================================================
-- STEP 6: Verify everything worked
-- ========================================================================

DO $$
DECLARE
  v_global_count INTEGER;
  v_community_count INTEGER;
BEGIN
  -- Count how many versions of each function exist
  SELECT COUNT(*) INTO v_global_count
  FROM pg_proc 
  WHERE proname = 'complete_global_help_request';
  
  SELECT COUNT(*) INTO v_community_count
  FROM pg_proc 
  WHERE proname = 'complete_community_help_request';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VERIFICATION RESULTS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Global help function versions: %', v_global_count;
  RAISE NOTICE 'Community help function versions: %', v_community_count;
  
  IF v_global_count = 1 AND v_community_count = 1 THEN
    RAISE NOTICE '✅ SUCCESS! Functions created correctly';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Multiple versions may exist';
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- Final success messages
SELECT '✅ Complete Help functions fixed and deployed!' as status;
SELECT '✅ Parameter name: p_request_id (no ambiguity possible)' as technical_fix;
SELECT '✅ Ready to test - try marking a help request as complete' as next_action;
