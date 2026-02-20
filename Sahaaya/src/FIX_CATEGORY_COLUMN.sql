-- ========================================================================
-- FIX: Complete dashboard_my_contributions view with ALL required fields
-- ========================================================================
-- This creates a comprehensive view that includes every field the UI needs
-- Run this in Supabase SQL Editor
-- ========================================================================

-- STEP 1: Drop old view
DROP VIEW IF EXISTS public.dashboard_my_contributions CASCADE;

-- STEP 2: Create comprehensive view with ALL fields
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

-- STEP 3: Grant permissions
GRANT SELECT ON public.dashboard_my_contributions TO authenticated;

-- STEP 4: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- STEP 5: Verify the fix
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'dashboard_my_contributions'
ORDER BY ordinal_position;

-- Expected columns (15 total):
-- id, user_id, request_id, request_title, category, amount, urgency,
-- contribution_status, request_status, report_count, contribution_type,
-- source_type, community_id, message, created_at

-- STEP 6: Test query
SELECT 
  id,
  request_title,
  category,
  amount,
  urgency,
  contribution_status,
  request_status
FROM public.dashboard_my_contributions 
LIMIT 1;

-- ========================================================================
-- ✅ DONE! The view now has ALL required fields
-- ========================================================================
