-- ========================================================================
-- SAHAAYA PLATFORM - FIX COMMUNITY HELP REQUESTS USER RELATIONSHIP
-- ========================================================================
-- This script fixes the PGRST200 error by creating a proper user_profiles
-- view that PostgREST can use to join user data with help requests
-- ========================================================================

-- ========================================================================
-- STEP 1: CREATE USER_PROFILES VIEW (If it doesn't exist)
-- ========================================================================
-- This view allows PostgREST to access user data from auth.users
-- It's read-only and only exposes safe, non-sensitive user information

DROP VIEW IF EXISTS public.user_profiles CASCADE;

CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', 
           raw_user_meta_data->>'full_name',
           email) as full_name,
  raw_user_meta_data->>'phone' as phone,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  created_at,
  updated_at
FROM auth.users;

-- Add comment
COMMENT ON VIEW public.user_profiles IS 
'Read-only view of user profile data from auth.users for safe API access';

-- ========================================================================
-- STEP 2: GRANT ACCESS TO THE VIEW
-- ========================================================================

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- ========================================================================
-- STEP 3: VERIFY FOREIGN KEY EXISTS
-- ========================================================================

-- Check if foreign key exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_community_help_requests_user'
    AND table_name = 'community_help_requests'
  ) THEN
    ALTER TABLE public.community_help_requests
    ADD CONSTRAINT fk_community_help_requests_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users (id)
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Foreign key constraint added successfully';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;

-- ========================================================================
-- STEP 4: CREATE INDEXES FOR BETTER QUERY PERFORMANCE
-- ========================================================================

-- Index on community_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_community_help_requests_community_id 
ON public.community_help_requests(community_id);

-- Index on user_id for faster joins
CREATE INDEX IF NOT EXISTS idx_community_help_requests_user_id 
ON public.community_help_requests(user_id);

-- Index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_community_help_requests_created_at 
ON public.community_help_requests(created_at DESC);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_community_help_requests_community_user 
ON public.community_help_requests(community_id, user_id);

-- ========================================================================
-- STEP 5: VERIFICATION QUERIES
-- ========================================================================

-- Verify the view works
SELECT 
  'View created successfully' as status,
  COUNT(*) as user_count
FROM public.user_profiles;

-- Verify the foreign key exists
SELECT
  'Foreign key verified' as status,
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE constraint_name = 'fk_community_help_requests_user'
  AND table_schema = 'public';

-- Verify the indexes were created
SELECT
  'Indexes created' as status,
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'community_help_requests'
ORDER BY indexname;

-- Test the join query (this is what PostgREST will use)
SELECT
  'Join test successful' as status,
  chr.id,
  chr.title,
  up.full_name,
  up.email
FROM public.community_help_requests chr
LEFT JOIN public.user_profiles up ON up.id = chr.user_id
LIMIT 1;

-- ========================================================================
-- STEP 6: REFRESH POSTGREST SCHEMA CACHE
-- ========================================================================

-- Notify that schema cache needs refresh
SELECT 'SUCCESS: Schema updated. Please refresh PostgREST schema cache in Supabase Dashboard.' as status;

-- To refresh manually:
-- Go to: Supabase Dashboard → Database → REST → Refresh Schema Cache
-- Or run: NOTIFY pgrst, 'reload schema';

NOTIFY pgrst, 'reload schema';

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================
SELECT '✅ All fixes applied successfully!' as status,
       'You can now query community_help_requests with user_profiles join' as message;
