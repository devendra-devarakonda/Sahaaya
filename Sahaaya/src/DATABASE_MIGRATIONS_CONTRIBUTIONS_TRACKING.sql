-- ========================================================================
-- SAHAAYA PLATFORM - CONTRIBUTIONS TRACKING SYSTEM WITH FRAUD DETECTION
-- ========================================================================
-- This script adds:
-- 1. report_count column to track fraud reports
-- 2. Updates status flow: matched → completed
-- 3. Fraud detection when report_count >= 10
-- 4. Updated views to include fraud tracking
-- ========================================================================

-- ========================================================================
-- STEP 1: ADD REPORT_COUNT COLUMN TO HELP_OFFERS TABLES
-- ========================================================================

-- Add report_count to global help_offers
ALTER TABLE public.help_offers 
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0 NOT NULL;

-- Add report_count to community help_offers
ALTER TABLE public.community_help_offers 
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0 NOT NULL;

-- Add index for faster queries on fraud detection
CREATE INDEX IF NOT EXISTS idx_help_offers_report_count 
ON public.help_offers(report_count) 
WHERE report_count >= 10;

CREATE INDEX IF NOT EXISTS idx_community_help_offers_report_count 
ON public.community_help_offers(report_count) 
WHERE report_count >= 10;

-- ========================================================================
-- STEP 2: UPDATE STATUS CHECK CONSTRAINTS TO INCLUDE 'FRAUD'
-- ========================================================================

-- Update help_offers status constraint
ALTER TABLE public.help_offers 
DROP CONSTRAINT IF EXISTS help_offers_status_check;

ALTER TABLE public.help_offers 
ADD CONSTRAINT help_offers_status_check 
CHECK (status IN ('pending', 'matched', 'accepted', 'rejected', 'completed', 'cancelled', 'fraud'));

-- Update community_help_offers status constraint
ALTER TABLE public.community_help_offers 
DROP CONSTRAINT IF EXISTS community_help_offers_status_check;

ALTER TABLE public.community_help_offers 
ADD CONSTRAINT community_help_offers_status_check 
CHECK (status IN ('pending', 'matched', 'accepted', 'in_progress', 'completed', 'declined', 'fraud'));

-- ========================================================================
-- STEP 3: CREATE FUNCTION TO REPORT HELP OFFER (FRAUD DETECTION)
-- ========================================================================

-- Function to report a global help offer
CREATE OR REPLACE FUNCTION public.report_help_offer(
  offer_id_param UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_report_count INTEGER;
  offer_helper_id UUID;
  offer_request_id UUID;
  result JSON;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;

  -- Get current report count and helper info
  SELECT report_count, helper_id, request_id
  INTO current_report_count, offer_helper_id, offer_request_id
  FROM public.help_offers
  WHERE id = offer_id_param;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Help offer not found'
    );
  END IF;

  -- Prevent users from reporting their own offers
  IF offer_helper_id = auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You cannot report your own help offer'
    );
  END IF;

  -- Increment report count
  UPDATE public.help_offers
  SET 
    report_count = report_count + 1,
    updated_at = NOW()
  WHERE id = offer_id_param;

  -- Get new report count
  current_report_count := current_report_count + 1;

  -- If report count >= 10, mark as fraud
  IF current_report_count >= 10 THEN
    UPDATE public.help_offers
    SET 
      status = 'fraud',
      updated_at = NOW()
    WHERE id = offer_id_param;

    -- Send notification to helper
    INSERT INTO public.notifications (
      recipient_id,
      sender_id,
      type,
      title,
      content,
      priority,
      offer_id,
      request_id,
      metadata
    ) VALUES (
      offer_helper_id,
      NULL,
      'fraud_alert',
      'Help Contribution Flagged as Fraud',
      'Your help contribution was reported by multiple users and has been marked as fraud. This contribution will be removed from your dashboard.',
      'high',
      offer_id_param,
      offer_request_id,
      json_build_object('report_count', current_report_count)
    );

    result := json_build_object(
      'success', true,
      'message', 'Help offer reported and marked as fraud',
      'report_count', current_report_count,
      'status', 'fraud'
    );
  ELSE
    result := json_build_object(
      'success', true,
      'message', 'Help offer reported successfully',
      'report_count', current_report_count,
      'status', 'reported'
    );
  END IF;

  RETURN result;
END;
$$;

-- Function to report a community help offer
CREATE OR REPLACE FUNCTION public.report_community_help_offer(
  offer_id_param UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_report_count INTEGER;
  offer_helper_id UUID;
  offer_request_id UUID;
  result JSON;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;

  -- Get current report count and helper info
  SELECT report_count, helper_id, help_request_id
  INTO current_report_count, offer_helper_id, offer_request_id
  FROM public.community_help_offers
  WHERE id = offer_id_param;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Help offer not found'
    );
  END IF;

  -- Prevent users from reporting their own offers
  IF offer_helper_id = auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You cannot report your own help offer'
    );
  END IF;

  -- Increment report count
  UPDATE public.community_help_offers
  SET 
    report_count = report_count + 1,
    updated_at = NOW()
  WHERE id = offer_id_param;

  -- Get new report count
  current_report_count := current_report_count + 1;

  -- If report count >= 10, mark as fraud
  IF current_report_count >= 10 THEN
    UPDATE public.community_help_offers
    SET 
      status = 'fraud',
      updated_at = NOW()
    WHERE id = offer_id_param;

    -- Send notification to helper
    INSERT INTO public.notifications (
      recipient_id,
      sender_id,
      type,
      title,
      content,
      priority,
      offer_id,
      request_id,
      metadata
    ) VALUES (
      offer_helper_id,
      NULL,
      'fraud_alert',
      'Help Contribution Flagged as Fraud',
      'Your help contribution was reported by multiple users and has been marked as fraud. This contribution will be removed from your dashboard.',
      'high',
      offer_id_param,
      offer_request_id,
      json_build_object('report_count', current_report_count)
    );

    result := json_build_object(
      'success', true,
      'message', 'Help offer reported and marked as fraud',
      'report_count', current_report_count,
      'status', 'fraud'
    );
  ELSE
    result := json_build_object(
      'success', true,
      'message', 'Help offer reported successfully',
      'report_count', current_report_count,
      'status', 'reported'
    );
  END IF;

  RETURN result;
END;
$$;

-- ========================================================================
-- STEP 4: UPDATE COMPLETE HELP REQUEST FUNCTIONS
-- ========================================================================

-- Update global complete help request function to set offers to 'completed'
CREATE OR REPLACE FUNCTION public.complete_global_help_request(
  request_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_owner_id UUID;
  helper_ids UUID[];
  helper_id UUID;
  helper_count INTEGER;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;

  -- Get request owner
  SELECT user_id INTO request_owner_id
  FROM public.help_requests
  WHERE id = request_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Help request not found'
    );
  END IF;

  -- Check if the current user owns the request
  IF request_owner_id != auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You can only complete your own requests'
    );
  END IF;

  -- Update request status to completed
  UPDATE public.help_requests
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE id = request_id;

  -- Update ALL help offers for this request to 'completed' (not fraud ones)
  UPDATE public.help_offers
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE request_id = request_id
    AND status NOT IN ('fraud', 'cancelled', 'rejected');

  -- Get all helpers who offered help (excluding fraud)
  SELECT ARRAY_AGG(DISTINCT helper_id) INTO helper_ids
  FROM public.help_offers
  WHERE request_id = request_id
    AND status = 'completed';

  -- Send notifications to all helpers
  IF helper_ids IS NOT NULL THEN
    FOREACH helper_id IN ARRAY helper_ids
    LOOP
      INSERT INTO public.notifications (
        recipient_id,
        sender_id,
        type,
        title,
        content,
        priority,
        request_id
      ) VALUES (
        helper_id,
        auth.uid(),
        'help_completed',
        'Help Request Completed',
        'The help request you contributed to has been marked as completed. Thank you for your support!',
        'medium',
        request_id
      );
    END LOOP;
  END IF;

  -- Get count of helpers
  helper_count := COALESCE(array_length(helper_ids, 1), 0);

  RETURN json_build_object(
    'success', true,
    'message', 'Help request completed successfully',
    'helpers_notified', helper_count
  );
END;
$$;

-- Update community complete help request function
CREATE OR REPLACE FUNCTION public.complete_community_help_request(
  request_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_owner_id UUID;
  helper_ids UUID[];
  helper_id UUID;
  helper_count INTEGER;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;

  -- Get request owner
  SELECT user_id INTO request_owner_id
  FROM public.community_help_requests
  WHERE id = request_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Help request not found'
    );
  END IF;

  -- Check if the current user owns the request
  IF request_owner_id != auth.uid() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You can only complete your own requests'
    );
  END IF;

  -- Update request status to completed
  UPDATE public.community_help_requests
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE id = request_id;

  -- Update ALL help offers for this request to 'completed' (not fraud ones)
  UPDATE public.community_help_offers
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE help_request_id = request_id
    AND status NOT IN ('fraud', 'declined');

  -- Get all helpers who offered help (excluding fraud)
  SELECT ARRAY_AGG(DISTINCT helper_id) INTO helper_ids
  FROM public.community_help_offers
  WHERE help_request_id = request_id
    AND status = 'completed';

  -- Send notifications to all helpers
  IF helper_ids IS NOT NULL THEN
    FOREACH helper_id IN ARRAY helper_ids
    LOOP
      INSERT INTO public.notifications (
        recipient_id,
        sender_id,
        type,
        title,
        content,
        priority,
        request_id
      ) VALUES (
        helper_id,
        auth.uid(),
        'help_completed',
        'Help Request Completed',
        'The community help request you contributed to has been marked as completed. Thank you for your support!',
        'medium',
        request_id
      );
    END LOOP;
  END IF;

  -- Get count of helpers
  helper_count := COALESCE(array_length(helper_ids, 1), 0);

  RETURN json_build_object(
    'success', true,
    'message', 'Community help request completed successfully',
    'helpers_notified', helper_count
  );
END;
$$;

-- ========================================================================
-- STEP 5: RECREATE DASHBOARD VIEW WITH REPORT_COUNT
-- ========================================================================

-- Drop and recreate dashboard_my_contributions view
DROP VIEW IF EXISTS public.dashboard_my_contributions CASCADE;

CREATE VIEW public.dashboard_my_contributions AS
-- ========================
-- GLOBAL CONTRIBUTIONS
-- ========================
SELECT
  ho.id,
  ho.helper_id AS user_id,
  ho.request_id,
  hr.title AS request_title,
  hr.category AS category,
  hr.amount_needed AS amount,
  hr.urgency AS urgency,
  ho.status AS contribution_status,
  hr.status AS request_status,
  ho.report_count,
  'help_offer'::TEXT AS contribution_type,
  'global'::TEXT AS source_type,
  NULL::UUID AS community_id,
  ho.message,
  ho.created_at
FROM public.help_offers ho
LEFT JOIN public.help_requests hr ON hr.id = ho.request_id

UNION ALL

-- ========================
-- COMMUNITY CONTRIBUTIONS
-- ========================
SELECT
  cho.id,
  cho.helper_id AS user_id,
  cho.help_request_id AS request_id,
  chr.title AS request_title,
  chr.category AS category,
  chr.amount_needed AS amount,
  chr.urgency AS urgency,
  cho.status AS contribution_status,
  chr.status AS request_status,
  cho.report_count,
  'help_offer'::TEXT AS contribution_type,
  'community'::TEXT AS source_type,
  chr.community_id,
  cho.message,
  cho.created_at
FROM public.community_help_offers cho
LEFT JOIN public.community_help_requests chr ON chr.id = cho.help_request_id;

-- Grant permissions
GRANT SELECT ON public.dashboard_my_contributions TO authenticated;

-- ========================================================================
-- STEP 6: CREATE TRIGGER TO AUTO-MARK AS FRAUD
-- ========================================================================

-- Trigger function for global help_offers
CREATE OR REPLACE FUNCTION public.check_fraud_report_count_global()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If report_count reaches 10, automatically mark as fraud
  IF NEW.report_count >= 10 AND OLD.status != 'fraud' THEN
    NEW.status := 'fraud';
    NEW.updated_at := NOW();
    
    -- Send notification to helper
    INSERT INTO public.notifications (
      recipient_id,
      type,
      title,
      content,
      priority,
      offer_id,
      request_id,
      metadata
    ) VALUES (
      NEW.helper_id,
      'fraud_alert',
      'Help Contribution Flagged as Fraud',
      'Your help contribution was reported by multiple users and has been automatically marked as fraud.',
      'high',
      NEW.id,
      NEW.request_id,
      json_build_object('report_count', NEW.report_count)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for community help_offers
CREATE OR REPLACE FUNCTION public.check_fraud_report_count_community()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If report_count reaches 10, automatically mark as fraud
  IF NEW.report_count >= 10 AND OLD.status != 'fraud' THEN
    NEW.status := 'fraud';
    NEW.updated_at := NOW();
    
    -- Send notification to helper
    INSERT INTO public.notifications (
      recipient_id,
      type,
      title,
      content,
      priority,
      offer_id,
      request_id,
      metadata
    ) VALUES (
      NEW.helper_id,
      'fraud_alert',
      'Help Contribution Flagged as Fraud',
      'Your community help contribution was reported by multiple users and has been automatically marked as fraud.',
      'high',
      NEW.id,
      NEW.help_request_id,
      json_build_object('report_count', NEW.report_count)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_fraud_detection_global ON public.help_offers;
CREATE TRIGGER trigger_fraud_detection_global
BEFORE UPDATE OF report_count ON public.help_offers
FOR EACH ROW
WHEN (NEW.report_count >= 10)
EXECUTE FUNCTION public.check_fraud_report_count_global();

DROP TRIGGER IF EXISTS trigger_fraud_detection_community ON public.community_help_offers;
CREATE TRIGGER trigger_fraud_detection_community
BEFORE UPDATE OF report_count ON public.community_help_offers
FOR EACH ROW
WHEN (NEW.report_count >= 10)
EXECUTE FUNCTION public.check_fraud_report_count_community();

-- ========================================================================
-- STEP 7: UPDATE RLS POLICIES
-- ========================================================================

-- Users can read their own contributions (including fraud status)
DROP POLICY IF EXISTS "Users can view their own contributions" ON public.help_offers;
CREATE POLICY "Users can view their own contributions"
ON public.help_offers FOR SELECT
TO authenticated
USING (helper_id = auth.uid() OR requester_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own community contributions" ON public.community_help_offers;
CREATE POLICY "Users can view their own community contributions"
ON public.community_help_offers FOR SELECT
TO authenticated
USING (helper_id = auth.uid() OR requester_id = auth.uid());

-- ========================================================================
-- VERIFICATION QUERIES
-- ========================================================================

-- Test that columns exist
DO $$
BEGIN
  -- Check help_offers
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'help_offers' 
    AND column_name = 'report_count'
  ) THEN
    RAISE NOTICE '✅ report_count column exists in help_offers';
  ELSE
    RAISE EXCEPTION '❌ report_count column missing in help_offers';
  END IF;

  -- Check community_help_offers
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'community_help_offers' 
    AND column_name = 'report_count'
  ) THEN
    RAISE NOTICE '✅ report_count column exists in community_help_offers';
  ELSE
    RAISE EXCEPTION '❌ report_count column missing in community_help_offers';
  END IF;

  -- Check view exists
  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'dashboard_my_contributions'
  ) THEN
    RAISE NOTICE '✅ dashboard_my_contributions view exists';
  ELSE
    RAISE EXCEPTION '❌ dashboard_my_contributions view missing';
  END IF;

  -- Check functions exist
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'report_help_offer'
  ) THEN
    RAISE NOTICE '✅ report_help_offer function exists';
  ELSE
    RAISE EXCEPTION '❌ report_help_offer function missing';
  END IF;

  RAISE NOTICE '✅ ALL DATABASE MIGRATIONS COMPLETED SUCCESSFULLY';
END;
$$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- ========================================================================
-- SUMMARY
-- ========================================================================
/*
✅ Added report_count column to both help_offers tables
✅ Updated status constraints to include 'fraud'
✅ Created report_help_offer functions for fraud detection
✅ Updated complete_help_request functions to set offers to 'completed'
✅ Recreated dashboard view with report_count field
✅ Created triggers for automatic fraud detection at 10 reports
✅ Updated RLS policies

NEXT STEPS:
1. Run this SQL in Supabase SQL Editor
2. Update frontend TypeScript interfaces
3. Add UI for reporting and fraud detection
4. Test the complete flow
*/