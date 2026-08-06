-- ========================================================================
-- SAHAAYA PLATFORM - HELP TRACKING SYSTEM
-- ========================================================================
-- This migration implements a 3-stage tracking system:
-- Pending → Matched → Completed
-- ========================================================================

-- ========================================================================
-- STEP 1: ENSURE STATUS COLUMNS EXIST (Should already exist)
-- ========================================================================

-- Verify status column exists in help_requests
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'help_requests' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.help_requests 
    ADD COLUMN status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'matched', 'in_progress', 'completed', 'cancelled'));
  END IF;
END $$;

-- Verify status column exists in community_help_requests
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_help_requests' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.community_help_requests 
    ADD COLUMN status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'matched', 'in_progress', 'completed', 'cancelled'));
  END IF;
END $$;

-- ========================================================================
-- STEP 2: CREATE TRIGGER FUNCTIONS FOR AUTO-STATUS UPDATE
-- ========================================================================

-- Function: Auto-update global help request status to 'matched' when offer is made
CREATE OR REPLACE FUNCTION auto_match_global_help_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the help request status to 'matched' if it's currently 'pending'
  UPDATE public.help_requests
  SET 
    status = 'matched',
    updated_at = NOW()
  WHERE 
    id = NEW.request_id 
    AND status = 'pending';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-update community help request status to 'matched' when offer is made
CREATE OR REPLACE FUNCTION auto_match_community_help_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the community help request status to 'matched' if it's currently 'pending'
  UPDATE public.community_help_requests
  SET 
    status = 'matched',
    updated_at = NOW()
  WHERE 
    id = NEW.help_request_id 
    AND status = 'pending';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- STEP 3: CREATE TRIGGERS
-- ========================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_auto_match_global_request ON public.help_offers;
DROP TRIGGER IF EXISTS trigger_auto_match_community_request ON public.community_help_offers;

-- Trigger: Auto-match global requests when offer is created
CREATE TRIGGER trigger_auto_match_global_request
AFTER INSERT ON public.help_offers
FOR EACH ROW
EXECUTE FUNCTION auto_match_global_help_request();

-- Trigger: Auto-match community requests when offer is created
CREATE TRIGGER trigger_auto_match_community_request
AFTER INSERT ON public.community_help_offers
FOR EACH ROW
EXECUTE FUNCTION auto_match_community_help_request();

-- ========================================================================
-- STEP 4: UPDATE RLS POLICIES FOR COMPLETED REQUESTS
-- ========================================================================

-- Drop existing read policy if it exists
DROP POLICY IF EXISTS "Users can view help requests" ON public.help_requests;
DROP POLICY IF EXISTS "Anyone can view pending and matched requests" ON public.help_requests;

-- Create new RLS policy for help_requests:
-- - Completed requests visible ONLY to the requester
-- - All other requests visible to everyone
CREATE POLICY "View help requests with completion privacy"
ON public.help_requests FOR SELECT
USING (
  status != 'completed'
  OR (status = 'completed' AND user_id = auth.uid())
);

-- Drop existing read policy for community requests
DROP POLICY IF EXISTS "Community members can view requests" ON public.community_help_requests;

-- Create new RLS policy for community_help_requests:
-- - Completed requests visible ONLY to the requester
-- - All other requests visible to community members
CREATE POLICY "View community requests with completion privacy"
ON public.community_help_requests FOR SELECT
USING (
  -- Check if user is a community member
  EXISTS (
    SELECT 1 FROM public.community_members cm
    WHERE cm.community_id = community_help_requests.community_id
    AND cm.user_id = auth.uid()
  )
  AND (
    -- Either request is not completed, or user is the requester
    status != 'completed'
    OR (status = 'completed' AND user_id = auth.uid())
  )
);

-- ========================================================================
-- STEP 5: CREATE HELPER VIEW FOR REQUEST COUNTS BY STATUS
-- ========================================================================

DROP VIEW IF EXISTS public.request_status_counts CASCADE;

CREATE VIEW public.request_status_counts AS
-- Global request counts
SELECT
  user_id,
  'global' AS source_type,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE status = 'matched') AS matched_count,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
  COUNT(*) AS total_count
FROM public.help_requests
GROUP BY user_id

UNION ALL

-- Community request counts
SELECT
  user_id,
  'community' AS source_type,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE status = 'matched') AS matched_count,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
  COUNT(*) AS total_count
FROM public.community_help_requests
GROUP BY user_id;

COMMENT ON VIEW public.request_status_counts IS
'Provides counts of help requests by status for each user (global and community combined)';

-- ========================================================================
-- STEP 6: CREATE FUNCTION TO COMPLETE A HELP REQUEST
-- ========================================================================

-- Function: Mark a global help request as completed
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
  FROM public.help_requests
  WHERE id = request_id
    AND user_id = auth.uid()
    AND status IN ('matched', 'in_progress');
  
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
  WHERE id = request_id;

  -- Create notifications for all helpers
  FOR v_helper IN 
    SELECT DISTINCT helper_id, helper_name
    FROM public.help_offers
    WHERE request_id = request_id
  LOOP
    INSERT INTO public.notifications (
      recipient_id,
      sender_id,
      type,
      title,
      message,
      reference_id,
      reference_type
    ) VALUES (
      v_helper.helper_id,
      auth.uid(),
      'help_completed',
      'Help Request Completed',
      format('The requester has marked your help as completed for: %s. Thank you for your support!', v_request.title),
      request_id,
      'help_request'
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', 'Help request marked as completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark a community help request as completed
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
  FROM public.community_help_requests
  WHERE id = request_id
    AND user_id = auth.uid()
    AND status IN ('matched', 'in_progress');
  
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
  WHERE id = request_id;

  -- Create notifications for all helpers
  FOR v_helper IN 
    SELECT DISTINCT helper_id
    FROM public.community_help_offers
    WHERE help_request_id = request_id
  LOOP
    INSERT INTO public.notifications (
      recipient_id,
      sender_id,
      type,
      title,
      message,
      reference_id,
      reference_type
    ) VALUES (
      v_helper.helper_id,
      auth.uid(),
      'help_completed',
      'Help Request Completed',
      format('The requester has marked your help as completed for: %s. Thank you for your support!', v_request.title),
      request_id,
      'community_help_request'
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'message', 'Community help request marked as completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION complete_global_help_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_community_help_request(UUID) TO authenticated;

-- ========================================================================
-- STEP 7: CREATE VIEW FOR HELPERS ON A REQUEST
-- ========================================================================

DROP VIEW IF EXISTS public.request_helpers CASCADE;

CREATE VIEW public.request_helpers AS
-- Global request helpers
SELECT
  ho.request_id,
  'global' AS source_type,
  ho.id AS offer_id,
  ho.helper_id,
  ho.helper_name,
  ho.helper_email,
  ho.helper_phone,
  ho.message,
  ho.status AS offer_status,
  ho.created_at
FROM public.help_offers ho

UNION ALL

-- Community request helpers
SELECT
  cho.help_request_id AS request_id,
  'community' AS source_type,
  cho.id AS offer_id,
  cho.helper_id,
  NULL AS helper_name,
  NULL AS helper_email,
  NULL AS helper_phone,
  cho.message,
  cho.status AS offer_status,
  cho.created_at
FROM public.community_help_offers cho;

COMMENT ON VIEW public.request_helpers IS
'Unified view of all helpers (offers) for both global and community help requests';

-- ========================================================================
-- STEP 8: UPDATE DASHBOARD VIEWS TO SUPPORT STATUS FILTERING
-- ========================================================================

-- The existing dashboard_my_requests view already includes status
-- No changes needed, but let's add a comment
COMMENT ON VIEW public.dashboard_my_requests IS
'Unified view of user help requests (global + community) with status field for tracking (pending/matched/completed)';

-- ========================================================================
-- FINALIZATION
-- ========================================================================

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

SELECT '✅ Help Tracking System installed successfully!' AS status;
