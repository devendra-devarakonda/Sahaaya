-- ========================================================================
-- SAHAAYA PLATFORM - FIX FOREIGN KEY RELATIONSHIPS FOR DASHBOARD VIEWS
-- ========================================================================
-- This script adds PostgREST foreign key metadata to existing views
-- to enable .select('..., communities(name, category)') queries
-- ========================================================================

-- ========================================================================
-- STEP 1: UPDATE DASHBOARD_MY_REQUESTS VIEW METADATA
-- ========================================================================

-- Add PostgREST foreign key annotation
COMMENT ON VIEW public.dashboard_my_requests IS
E'@foreignKey (community_id) references communities (id)\nUnified view of all help requests (global + community) for user dashboard.\nAutomatically stays in sync without triggers or data duplication.';

SELECT '✅ Updated dashboard_my_requests with foreign key metadata' AS status;

-- ========================================================================
-- STEP 2: UPDATE DASHBOARD_MY_CONTRIBUTIONS VIEW METADATA
-- ========================================================================

-- Add PostgREST foreign key annotation
COMMENT ON VIEW public.dashboard_my_contributions IS
E'@foreignKey (community_id) references communities (id)\nUnified view of all help offers (global + community) for user dashboard.\nAutomatically stays in sync without triggers or data duplication.';

SELECT '✅ Updated dashboard_my_contributions with foreign key metadata' AS status;

-- ========================================================================
-- STEP 3: REFRESH POSTGREST SCHEMA CACHE
-- ========================================================================

NOTIFY pgrst, 'reload schema';

SELECT '✅ PostgREST schema cache refreshed' AS status;

-- ========================================================================
-- STEP 4: VERIFICATION
-- ========================================================================

-- Check view comments contain foreign key annotations
SELECT
  table_name,
  CASE
    WHEN obj_description((table_schema || '.' || table_name)::regclass) LIKE '%@foreignKey%'
    THEN '✅ Foreign key metadata present'
    ELSE '❌ Foreign key metadata missing'
  END AS fk_status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('dashboard_my_requests', 'dashboard_my_contributions')
ORDER BY table_name;

-- ========================================================================
-- TESTING QUERIES
-- ========================================================================

/*
TEST 1: Fetch requests with community data
-------------------------------------------------
SELECT * FROM dashboard_my_requests
WHERE user_id = auth.uid()
LIMIT 5;

Expected: Returns data with community_id populated for community requests


TEST 2: Test Supabase Client Query (Frontend)
-------------------------------------------------
const { data, error } = await supabase
  .from('dashboard_my_requests')
  .select(`
    id,
    title,
    category,
    amount,
    status,
    source_type,
    created_at,
    communities (
      name,
      category
    )
  `)
  .eq('user_id', userId);

Expected Result:
- No PGRST200 relationship error
- communities data appears for community requests
- communities is null for global requests


TEST 3: Test contributions query
-------------------------------------------------
const { data, error } = await supabase
  .from('dashboard_my_contributions')
  .select(`
    id,
    message,
    status,
    source_type,
    created_at,
    communities (
      name,
      category
    )
  `)
  .eq('user_id', userId);

Expected Result:
- No PGRST200 relationship error
- communities data appears for community contributions
- communities is null for global contributions
*/

-- ========================================================================
-- TROUBLESHOOTING
-- ========================================================================

/*
Issue: Still getting "Could not find relationship" error
---------------------------------------------------------

Solution 1: Verify PostgREST version supports @foreignKey comments
SELECT version();
-- PostgREST 9.0+ required for view relationship hints

Solution 2: Manually refresh schema cache
NOTIFY pgrst, 'reload schema';
-- Wait 5 seconds, then try query again

Solution 3: Check if communities table exists and has proper permissions
SELECT * FROM communities LIMIT 1;
GRANT SELECT ON communities TO authenticated;

Solution 4: Verify views have proper structure
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'dashboard_my_requests'
  AND table_schema = 'public'
ORDER BY ordinal_position;
-- Should include: community_id UUID column

Solution 5: Re-run full view creation script
-- Use /UNIFIED_DASHBOARD_VIEWS.sql to recreate views from scratch
*/

-- ========================================================================
-- SUCCESS CRITERIA
-- ========================================================================

/*
✅ View comments contain @foreignKey annotation
✅ PostgREST schema cache refreshed
✅ No PGRST200 errors when querying with communities()
✅ Community data appears for community requests/offers
✅ Global requests show communities as null
*/

-- ========================================================================
-- EXAMPLE OUTPUT
-- ========================================================================

/*
DASHBOARD_MY_REQUESTS QUERY RESULT:

| id   | title           | source_type | community_id | communities.name |
|------|-----------------|-------------|--------------|------------------|
| 123  | Need Medicine   | community   | abc-def      | Medical Aid      |
| 456  | Food Support    | global      | null         | null             |
| 789  | School Supplies | community   | xyz-123      | Education Fund   |


DASHBOARD_MY_CONTRIBUTIONS QUERY RESULT:

| id   | message         | source_type | community_id | communities.name |
|------|-----------------|-------------|--------------|------------------|
| 111  | I can help!     | community   | abc-def      | Medical Aid      |
| 222  | Donation sent   | global      | null         | null             |
| 333  | Books donated   | community   | xyz-123      | Education Fund   |
*/

-- ========================================================================
-- ADDITIONAL NOTES
-- ========================================================================

/*
🔍 What is @foreignKey?
-----------------------
PostgREST uses special comments to understand relationships in views.
The format is: @foreignKey (column_name) references table_name (pk_column)

This tells PostgREST:
- dashboard_my_requests.community_id → communities.id
- dashboard_my_contributions.community_id → communities.id

So queries like .select('*, communities(name)') work properly.


🎯 Why is this needed?
-----------------------
Normal tables have actual foreign key constraints in the database.
Views don't have constraints, so we use comments to hint the relationship.


⚡ Performance Impact
-----------------------
Zero performance impact. Comments are metadata only.
The actual JOIN is still performed by PostgreSQL efficiently.


🔒 Security
-----------
Foreign key hints don't bypass RLS policies.
Users can only see communities they have access to.
*/

SELECT '✅ Foreign key relationships fixed!' AS final_status;
SELECT 'Run frontend queries to verify communities() joins work' AS next_step;
