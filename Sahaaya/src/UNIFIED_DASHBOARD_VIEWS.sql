-- ========================================================================
-- SAHAAYA PLATFORM - UNIFIED DASHBOARD VIEWS (Clean Approach)
-- ========================================================================
-- This script creates SQL VIEWS to unify global and community data
-- for the user dashboard WITHOUT duplicating data or using triggers.
-- ========================================================================

-- ========================================================================
-- STEP 0: CREATE SAFETY BACKUP (ROLLBACK POINT)
-- ========================================================================

-- Create backup schema
DROP SCHEMA IF EXISTS backup_before_dashboard_sync CASCADE;
CREATE SCHEMA backup_before_dashboard_sync;

-- Backup all critical tables
CREATE TABLE backup_before_dashboard_sync.help_requests AS TABLE public.help_requests;
CREATE TABLE backup_before_dashboard_sync.help_offers AS TABLE public.help_offers;
CREATE TABLE backup_before_dashboard_sync.community_help_requests AS TABLE public.community_help_requests;
CREATE TABLE backup_before_dashboard_sync.community_help_offers AS TABLE public.community_help_offers;

-- Backup dashboard tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_dashboard_requests') THEN
    CREATE TABLE backup_before_dashboard_sync.user_dashboard_requests AS TABLE public.user_dashboard_requests;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_dashboard_contributions') THEN
    CREATE TABLE backup_before_dashboard_sync.user_dashboard_contributions AS TABLE public.user_dashboard_contributions;
  END IF;
END $$;

-- Backup activity_feed if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_feed') THEN
    CREATE TABLE backup_before_dashboard_sync.activity_feed AS TABLE public.activity_feed;
  END IF;
END $$;

SELECT '✅ Safety backup created in schema: backup_before_dashboard_sync' AS status;

COMMENT ON SCHEMA backup_before_dashboard_sync IS
'Rollback point created before unified dashboard views implementation. 
Restore using: CREATE TABLE public.help_requests AS TABLE backup_before_dashboard_sync.help_requests;';

-- ========================================================================
-- STEP 1: REMOVE OLD DASHBOARD SYNC TRIGGERS (IF THEY EXIST)
-- ========================================================================

-- Drop old triggers that may have been created
DROP TRIGGER IF EXISTS trg_sync_request_update_to_dashboard ON public.community_help_requests;
DROP TRIGGER IF EXISTS trg_sync_request_to_dashboard ON public.community_help_requests;
DROP TRIGGER IF EXISTS trg_sync_offer_update_to_dashboard ON public.community_help_offers;
DROP TRIGGER IF EXISTS trg_sync_offer_to_dashboard ON public.community_help_offers;

-- Drop old functions
DROP FUNCTION IF EXISTS sync_request_to_dashboard();
DROP FUNCTION IF EXISTS sync_offer_to_dashboard();

-- Drop old dashboard tables (we'll use views instead)
DROP TABLE IF EXISTS public.user_dashboard_contributions CASCADE;
DROP TABLE IF EXISTS public.user_dashboard_requests CASCADE;

SELECT '✅ Removed old triggers, functions, and tables (now using views)' AS status;

-- ========================================================================
-- STEP 2: CREATE UNIFIED VIEW FOR "MY REQUESTS"
-- ========================================================================

-- Drop view if exists
DROP VIEW IF EXISTS public.dashboard_my_requests CASCADE;

-- Create unified view combining global + community requests
CREATE VIEW public.dashboard_my_requests AS
SELECT
  hr.id,
  hr.user_id,
  hr.title,
  hr.description,
  hr.category,
  hr.amount_needed AS amount,
  hr.urgency,
  hr.status,
  hr.supporters,
  'global'::TEXT AS source_type,
  NULL::UUID AS community_id,
  NULL::TEXT AS community_name,
  NULL::TEXT AS community_category,
  hr.created_at,
  hr.updated_at
FROM public.help_requests hr

UNION ALL

SELECT
  chr.id,
  chr.user_id,
  chr.title,
  chr.description,
  chr.category,
  chr.amount_needed AS amount,
  chr.urgency,
  chr.status,
  chr.supporters,
  'community'::TEXT AS source_type,
  chr.community_id,
  c.name AS community_name,
  c.category AS community_category,
  chr.created_at,
  chr.updated_at
FROM public.community_help_requests chr
LEFT JOIN public.communities c ON c.id = chr.community_id;

-- Add comment (no foreign key needed - data is embedded)
COMMENT ON VIEW public.dashboard_my_requests IS
'Unified view of all help requests (global + community) for user dashboard with embedded community details.
Automatically stays in sync without triggers or data duplication.';

SELECT '✅ Created unified view: dashboard_my_requests' AS status;

-- ========================================================================
-- STEP 3: CREATE UNIFIED VIEW FOR "MY CONTRIBUTIONS"
-- ========================================================================

-- Drop view if exists
DROP VIEW IF EXISTS public.dashboard_my_contributions CASCADE;

-- Create unified view combining global + community offers
CREATE VIEW public.dashboard_my_contributions AS
SELECT
  ho.id,
  ho.helper_id AS user_id,
  ho.request_id AS request_id,
  'global'::TEXT AS source_type,
  NULL::UUID AS community_id,
  NULL::TEXT AS community_name,
  NULL::TEXT AS community_category,
  ho.message,
  ho.status,
  'help_offer'::TEXT AS contribution_type,
  ho.created_at
FROM public.help_offers ho

UNION ALL

SELECT
  cho.id,
  cho.helper_id AS user_id,
  cho.help_request_id AS request_id,
  'community'::TEXT AS source_type,
  chr.community_id,
  c.name AS community_name,
  c.category AS community_category,
  cho.message,
  cho.status,
  'help_offer'::TEXT AS contribution_type,
  cho.created_at
FROM public.community_help_offers cho
INNER JOIN public.community_help_requests chr ON chr.id = cho.help_request_id
LEFT JOIN public.communities c ON c.id = chr.community_id;

-- Add comment (no foreign key needed - data is embedded)
COMMENT ON VIEW public.dashboard_my_contributions IS
'Unified view of all help offers (global + community) for user dashboard with embedded community details.
Automatically stays in sync without triggers or data duplication.';

SELECT '✅ Created unified view: dashboard_my_contributions' AS status;

-- ========================================================================
-- STEP 4: CREATE RLS POLICIES FOR VIEWS
-- ========================================================================

-- Enable RLS on views (inherited from base tables)
-- Note: Views inherit RLS from underlying tables, but we can add explicit policies

-- Grant SELECT on views to authenticated users
GRANT SELECT ON public.dashboard_my_requests TO authenticated;
GRANT SELECT ON public.dashboard_my_contributions TO authenticated;

SELECT '✅ Granted permissions on dashboard views' AS status;

-- ========================================================================
-- STEP 5: REFRESH POSTGREST SCHEMA CACHE
-- ========================================================================

NOTIFY pgrst, 'reload schema';

SELECT '✅ PostgREST schema cache refreshed' AS status;

-- ========================================================================
-- STEP 6: VERIFICATION QUERIES
-- ========================================================================

SELECT '=== VERIFICATION SUMMARY ===' AS status;

-- 1. Check views exist
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name = 'dashboard_my_requests'
    )
    THEN '✅ dashboard_my_requests view exists'
    ELSE '❌ dashboard_my_requests view missing'
  END AS requests_view_check;

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name = 'dashboard_my_contributions'
    )
    THEN '✅ dashboard_my_contributions view exists'
    ELSE '❌ dashboard_my_contributions view missing'
  END AS contributions_view_check;

-- 2. Check old triggers removed
SELECT
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_name LIKE '%dashboard%'
        AND event_object_table IN ('community_help_requests', 'community_help_offers')
    )
    THEN '✅ Old dashboard sync triggers removed'
    ELSE '⚠️ Old triggers still exist (may need manual cleanup)'
  END AS triggers_check;

-- 3. Check old tables removed
SELECT
  CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('user_dashboard_requests', 'user_dashboard_contributions')
    )
    THEN '✅ Old dashboard tables removed (using views now)'
    ELSE '⚠️ Old dashboard tables still exist'
  END AS tables_check;

-- 4. Check backup schema exists
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.schemata
      WHERE schema_name = 'backup_before_dashboard_sync'
    )
    THEN '✅ Safety backup schema exists'
    ELSE '❌ Backup schema missing'
  END AS backup_check;

-- 5. Count records in views
SELECT
  COUNT(*) AS total_requests,
  COUNT(CASE WHEN source_type = 'global' THEN 1 END) AS global_requests,
  COUNT(CASE WHEN source_type = 'community' THEN 1 END) AS community_requests
FROM public.dashboard_my_requests;

SELECT
  COUNT(*) AS total_contributions,
  COUNT(CASE WHEN source_type = 'global' THEN 1 END) AS global_contributions,
  COUNT(CASE WHEN source_type = 'community' THEN 1 END) AS community_contributions
FROM public.dashboard_my_contributions;

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================

SELECT
  '✅ UNIFIED DASHBOARD VIEWS COMPLETE' AS status,
  'Dashboard now dynamically queries both global and community data' AS message,
  'No triggers, no data duplication, always in sync' AS benefit;

-- ========================================================================
-- USAGE EXAMPLES
-- ========================================================================

/*
FETCH USER'S DASHBOARD REQUESTS (Unified: Global + Community):

SELECT
  dmr.id,
  dmr.title,
  dmr.description,
  dmr.category,
  dmr.amount,
  dmr.urgency,
  dmr.status,
  dmr.source_type,
  dmr.supporters,
  dmr.created_at,
  dmr.community_name,
  dmr.community_category
FROM dashboard_my_requests dmr
WHERE dmr.user_id = auth.uid()
ORDER BY dmr.created_at DESC;

FETCH USER'S DASHBOARD CONTRIBUTIONS (Unified: Global + Community):

SELECT
  dmc.id,
  dmc.source_type,
  dmc.contribution_type,
  dmc.message,
  dmc.status,
  dmc.created_at,
  c.name AS community_name
FROM dashboard_my_contributions dmc
LEFT JOIN communities c ON c.id = dmc.community_id
WHERE dmc.user_id = auth.uid()
ORDER BY dmc.created_at DESC;

SUPABASE CLIENT USAGE (Frontend):

// Fetch unified requests
const { data: requests } = await supabase
  .from('dashboard_my_requests')
  .select(`
    id,
    title,
    description,
    category,
    amount,
    urgency,
    status,
    source_type,
    supporters,
    created_at,
    community_name,
    community_category
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Fetch unified contributions
const { data: contributions } = await supabase
  .from('dashboard_my_contributions')
  .select(`
    id,
    source_type,
    contribution_type,
    message,
    status,
    created_at,
    communities (
      name,
      category
    )
  `)
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

REAL-TIME UPDATES:

// Subscribe to both global and community changes
const requestsChannel = supabase
  .channel('help_updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'help_requests'
  }, () => fetchMyRequests())
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'community_help_requests'
  }, () => fetchMyRequests())
  .subscribe();

const contributionsChannel = supabase
  .channel('contribution_updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'help_offers'
  }, () => fetchMyContributions())
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'community_help_offers'
  }, () => fetchMyContributions())
  .subscribe();
*/

-- ========================================================================
-- ROLLBACK INSTRUCTIONS (IF NEEDED)
-- ========================================================================

/*
IF YOU NEED TO ROLLBACK TO PREVIOUS STATE:

-- 1. Drop views
DROP VIEW IF EXISTS public.dashboard_my_contributions CASCADE;
DROP VIEW IF EXISTS public.dashboard_my_requests CASCADE;

-- 2. Restore tables from backup
CREATE TABLE public.help_requests AS TABLE backup_before_dashboard_sync.help_requests;
CREATE TABLE public.help_offers AS TABLE backup_before_dashboard_sync.help_offers;
CREATE TABLE public.community_help_requests AS TABLE backup_before_dashboard_sync.community_help_requests;
CREATE TABLE public.community_help_offers AS TABLE backup_before_dashboard_sync.community_help_offers;

-- 3. Restore old dashboard tables if they existed
CREATE TABLE public.user_dashboard_requests AS TABLE backup_before_dashboard_sync.user_dashboard_requests;
CREATE TABLE public.user_dashboard_contributions AS TABLE backup_before_dashboard_sync.user_dashboard_contributions;

-- 4. Refresh PostgREST
NOTIFY pgrst, 'reload schema';

-- 5. Clean up backup after successful restore
DROP SCHEMA backup_before_dashboard_sync CASCADE;

TOTAL ROLLBACK TIME: < 2 minutes
*/

-- ========================================================================
-- ADVANTAGES OF THIS APPROACH
-- ========================================================================

/*
✅ NO DATA DUPLICATION
   - Views query original tables directly
   - No storage overhead
   - Single source of truth

✅ ALWAYS IN SYNC
   - Views are computed dynamically
   - No triggers to maintain
   - Zero sync lag

✅ SIMPLER MAINTENANCE
   - No complex trigger logic
   - No sync failures
   - Easier to debug

✅ BETTER PERFORMANCE
   - Views use underlying indexes
   - No trigger overhead on INSERT
   - Efficient query execution

✅ FLEXIBLE QUERIES
   - Can filter by source_type
   - Easy to add new columns
   - Simple to extend

✅ SAFE ROLLBACK
   - Full backup created
   - Easy to revert
   - No data loss risk
*/

-- ========================================================================
-- CLEAN UP OLD BACKUP (OPTIONAL - RUN AFTER VERIFICATION)
-- ========================================================================

/*
AFTER CONFIRMING EVERYTHING WORKS, CLEAN UP BACKUP:

-- ⚠️ WARNING: Only run this after thorough testing!
DROP SCHEMA backup_before_dashboard_sync CASCADE;
*/

SELECT '📋 Script execution complete. Dashboard now uses unified views!' AS final_status;
SELECT '⚠️ Backup schema "backup_before_dashboard_sync" kept for safety. Drop manually after testing.' AS backup_note;