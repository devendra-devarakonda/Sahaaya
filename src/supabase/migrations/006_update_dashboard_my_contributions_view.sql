-- Migration: Update dashboard_my_contributions view to join request data
-- Purpose: Fix null values in My Contributions by properly joining help_requests and community_help_requests
-- Date: 2025

-- Drop existing view
DROP VIEW IF EXISTS public.dashboard_my_contributions CASCADE;

-- Create enhanced unified view with proper joins
CREATE VIEW public.dashboard_my_contributions AS

-- Global Contributions (from help_offers)
SELECT
  ho.id,
  ho.helper_id AS user_id,
  ho.request_id AS request_id,
  hr.title AS request_title,
  hr.category AS category,
  hr.amount_needed AS amount,
  hr.status AS request_status,
  'global'::TEXT AS source_type,
  NULL::UUID AS community_id,
  NULL::TEXT AS community_name,
  NULL::TEXT AS community_category,
  ho.message,
  ho.status,
  'help_offer'::TEXT AS contribution_type,
  ho.created_at,
  hr.name AS requester_name,
  hr.city AS requester_city,
  hr.state AS requester_state,
  hr.phone AS requester_phone,
  hr.urgency AS urgency
FROM public.help_offers ho
INNER JOIN public.help_requests hr
  ON hr.id = ho.request_id

UNION ALL

-- Community Contributions (from community_help_offers)
SELECT
  cho.id,
  cho.helper_id AS user_id,
  cho.help_request_id AS request_id,
  chr.title AS request_title,
  chr.category AS category,
  chr.amount_needed AS amount,
  chr.status AS request_status,
  'community'::TEXT AS source_type,
  c.id AS community_id,
  c.name AS community_name,
  c.category AS community_category,
  cho.message,
  cho.status,
  'help_offer'::TEXT AS contribution_type,
  cho.created_at,
  NULL::TEXT AS requester_name,        -- Community requests don't store contact info
  NULL::TEXT AS requester_city,        -- Community requests don't store contact info
  NULL::TEXT AS requester_state,       -- Community requests don't store contact info
  NULL::TEXT AS requester_phone,       -- Community requests don't store contact info
  chr.urgency AS urgency
FROM public.community_help_offers cho
INNER JOIN public.community_help_requests chr
  ON chr.id = cho.help_request_id
INNER JOIN public.communities c
  ON c.id = chr.community_id;

-- Add helpful comment
COMMENT ON VIEW public.dashboard_my_contributions IS
'Unified and enriched contributions view joining related help request and community data. Note: Community requests do not include requester contact info (privacy by design).';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
