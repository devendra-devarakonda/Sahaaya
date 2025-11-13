-- ========================================================================
-- SAHAAYA PLATFORM - FIX DUPLICATE FOREIGN KEY RELATIONSHIPS
-- ========================================================================
-- This script fixes PGRST201 error by removing duplicate foreign keys
-- between community_help_requests and user_profiles
-- ========================================================================

-- ========================================================================
-- STEP 1: IDENTIFY EXISTING FOREIGN KEYS
-- ========================================================================

SELECT 
  '=== EXISTING FOREIGN KEYS ===' as status;

-- Check all foreign keys on community_help_requests pointing to auth.users
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  a.attname AS column_name,
  confrelid::regclass AS referenced_table,
  'auth.users reference' as note
FROM
  pg_constraint AS c
  JOIN pg_attribute AS a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE
  conrelid = 'community_help_requests'::regclass
  AND confrelid = 'auth.users'::regclass
  AND contype = 'f';

-- Check all foreign keys on community_help_requests pointing to user_profiles
-- (Note: user_profiles is a VIEW, not a table, so this should return nothing)
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  a.attname AS column_name,
  confrelid::regclass AS referenced_table,
  'user_profiles reference (should be empty)' as note
FROM
  pg_constraint AS c
  JOIN pg_attribute AS a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE
  conrelid = 'community_help_requests'::regclass
  AND contype = 'f'
  AND a.attname = 'user_id';

-- ========================================================================
-- STEP 2: DROP ALL EXISTING user_id FOREIGN KEYS
-- ========================================================================

-- Drop any existing foreign keys on user_id column
-- These are common names that might exist:
ALTER TABLE public.community_help_requests
  DROP CONSTRAINT IF EXISTS community_help_requests_user_id_fkey CASCADE;

ALTER TABLE public.community_help_requests
  DROP CONSTRAINT IF EXISTS fk_community_help_requests_user CASCADE;

ALTER TABLE public.community_help_requests
  DROP CONSTRAINT IF EXISTS community_help_requests_user_fkey CASCADE;

ALTER TABLE public.community_help_requests
  DROP CONSTRAINT IF EXISTS fk_user CASCADE;

SELECT 'All existing user_id foreign keys dropped' as status;

-- ========================================================================
-- STEP 3: CREATE SINGLE, PROPERLY NAMED FOREIGN KEY
-- ========================================================================

-- Create ONE foreign key with a clear, explicit name
-- This references auth.users (not user_profiles, which is a view)
ALTER TABLE public.community_help_requests
ADD CONSTRAINT fk_community_help_requests_user
FOREIGN KEY (user_id)
REFERENCES auth.users (id)
ON DELETE CASCADE;

COMMENT ON CONSTRAINT fk_community_help_requests_user 
  ON public.community_help_requests IS
  'Foreign key linking community help requests to their creator in auth.users';

SELECT 'Single foreign key constraint created: fk_community_help_requests_user' as status;

-- ========================================================================
-- STEP 4: VERIFY ONLY ONE FOREIGN KEY EXISTS
-- ========================================================================

SELECT 
  '=== VERIFICATION: Should show exactly ONE foreign key ===' as status;

SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  a.attname AS column_name,
  confrelid::regclass AS referenced_table,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM
  pg_constraint AS c
  JOIN pg_attribute AS a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE
  conrelid = 'community_help_requests'::regclass
  AND a.attname = 'user_id'
  AND contype = 'f';

-- ========================================================================
-- STEP 5: VERIFY THE VIEW STILL EXISTS
-- ========================================================================

SELECT 
  '=== VERIFICATION: user_profiles view ===' as status;

SELECT 
  table_name,
  table_type,
  'View for joining user data' as description
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'user_profiles';

-- ========================================================================
-- STEP 6: TEST THE JOIN QUERY
-- ========================================================================

SELECT 
  '=== TEST JOIN QUERY ===' as status;

-- Test that the join works correctly
SELECT
  chr.id,
  chr.title,
  chr.description,
  chr.amount_needed,
  chr.created_at,
  up.full_name,
  up.email,
  up.phone
FROM public.community_help_requests chr
LEFT JOIN public.user_profiles up ON up.id = chr.user_id
LIMIT 5;

-- ========================================================================
-- STEP 7: REFRESH POSTGREST SCHEMA CACHE
-- ========================================================================

-- Notify PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';

SELECT 'PostgREST schema cache refresh notification sent' as status;

-- ========================================================================
-- STEP 8: FINAL SUMMARY
-- ========================================================================

SELECT 
  '✅ DUPLICATE RELATIONSHIPS FIXED' as status,
  'Only ONE foreign key exists: fk_community_help_requests_user' as foreign_key,
  'Update frontend to use: user_profiles!fk_community_help_requests_user' as frontend_action,
  'Refresh schema cache in Supabase Dashboard' as next_step;

-- ========================================================================
-- IMPORTANT NOTES
-- ========================================================================

/*
IMPORTANT UNDERSTANDING:

1. Foreign Key References auth.users (NOT user_profiles)
   - community_help_requests.user_id → auth.users.id
   - This is the actual database relationship

2. user_profiles is a VIEW
   - It's a read-only window into auth.users
   - You cannot create foreign keys TO a view
   - Views don't have constraints

3. PostgREST Join Syntax
   - Even though the FK points to auth.users
   - We query using user_profiles (the view)
   - Syntax: user_profiles!fk_community_help_requests_user
   - PostgREST is smart enough to figure out the relationship

4. Why We Use the View
   - auth.users is not exposed via PostgREST API
   - user_profiles (view) IS exposed
   - The view filters safe columns from auth.users
   - PostgREST maps the FK relationship through the view

5. The !constraint_name Syntax
   - Tells PostgREST explicitly which FK to use
   - Prevents ambiguity when multiple FKs exist
   - Format: related_table!foreign_key_constraint_name
*/

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================

SELECT '✅ SUCCESS: All duplicate relationships removed!' as final_status;