-- =====================================================
-- FIX COMMUNITY MEMBERS ISSUES
-- =====================================================
-- This script fixes:
-- 1. PGRST200 relationship error
-- 2. Incorrect member count (+1 bug)
-- 3. Member details not displaying
-- =====================================================

-- =====================================================
-- STEP 1: Fix Member Count Logic
-- =====================================================

-- The issue: communities table starts with members_count = 1
-- Then the auto_add_creator_as_admin trigger adds the creator
-- Then the increment trigger fires, making it 2 instead of 1!

-- Solution: Start with members_count = 0, let triggers handle it

-- Drop and recreate the communities table with correct default
-- OR just update the default for new communities

-- For existing communities, fix the count:
UPDATE communities
SET members_count = (
  SELECT COUNT(*)
  FROM community_members
  WHERE community_members.community_id = communities.id
);

-- Update the default for future communities
-- (This won't affect existing rows, just new inserts)
ALTER TABLE communities 
ALTER COLUMN members_count SET DEFAULT 0;

-- =====================================================
-- STEP 2: Ensure Foreign Keys Exist (should already exist)
-- =====================================================

-- Check if foreign keys exist
DO $$
BEGIN
  -- Check community_members -> auth.users FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_user' 
    AND table_name = 'community_members'
  ) THEN
    ALTER TABLE community_members
    ADD CONSTRAINT fk_user 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key: community_members.user_id -> auth.users.id';
  ELSE
    RAISE NOTICE 'Foreign key already exists: fk_user';
  END IF;

  -- Check community_members -> communities FK
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_community' 
    AND table_name = 'community_members'
  ) THEN
    ALTER TABLE community_members
    ADD CONSTRAINT fk_community 
    FOREIGN KEY (community_id) 
    REFERENCES communities(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key: community_members.community_id -> communities.id';
  ELSE
    RAISE NOTICE 'Foreign key already exists: fk_community';
  END IF;
END $$;

-- =====================================================
-- STEP 3: Create a user_profiles view (optional but recommended)
-- =====================================================

-- This creates a view that makes it easier to query user info
-- without directly accessing auth.users in the frontend

CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  created_at
FROM auth.users;

-- Grant access to authenticated users
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

COMMENT ON VIEW user_profiles IS 'Public view of user profile information';

-- =====================================================
-- STEP 4: Reload Schema Cache
-- =====================================================

-- Notify PostgREST to reload the schema cache
-- This is important for the relationships to work in Supabase client
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- 1. Check foreign keys
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'community_members'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 2. Check member counts are correct
SELECT 
  c.id,
  c.name,
  c.members_count as stored_count,
  COUNT(cm.id) as actual_count,
  CASE 
    WHEN c.members_count = COUNT(cm.id) THEN '✅ Correct'
    ELSE '❌ Mismatch'
  END as status
FROM communities c
LEFT JOIN community_members cm ON c.id = cm.community_id
GROUP BY c.id, c.name, c.members_count
ORDER BY c.created_at DESC;

-- 3. Check if user_profiles view exists
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_name = 'user_profiles';

-- 4. Test member query with user info
-- This should work without PGRST200 error now
SELECT 
  cm.id,
  cm.community_id,
  cm.user_id,
  cm.role,
  cm.joined_at,
  u.email,
  u.full_name
FROM community_members cm
LEFT JOIN user_profiles u ON cm.user_id = u.id
LIMIT 5;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '
  ====================================================
  ✅ COMMUNITY MEMBERS FIX COMPLETE!
  ====================================================
  
  Fixes Applied:
  1. ✅ Member count corrected for all communities
  2. ✅ Default member count changed to 0
  3. ✅ Foreign keys verified/created
  4. ✅ user_profiles view created
  5. ✅ Schema cache notified to reload
  
  What Changed:
  - members_count now starts at 0
  - Triggers properly increment from 0 to 1
  - No more +1 bug!
  - Foreign key relationships recognized
  - Easy user profile access via view
  
  Next Steps:
  1. Update supabaseService.ts (see fix file)
  2. Update CommunityDetails.tsx (see fix file)
  3. Test member fetching
  4. Verify member count is accurate
  
  ====================================================
  ';
END $$;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
