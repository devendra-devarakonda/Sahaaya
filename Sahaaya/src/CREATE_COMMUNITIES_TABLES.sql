-- =====================================================
-- SAHAAYA COMMUNITIES MODULE - DATABASE TABLES & POLICIES
-- =====================================================
-- This file creates the communities and community_members tables
-- with proper Row Level Security (RLS) policies
-- Run this entire script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: Drop existing objects (if re-running)
-- =====================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_community_member_added ON community_members;
DROP TRIGGER IF EXISTS on_community_member_removed ON community_members;
DROP TRIGGER IF EXISTS on_community_created ON communities;

-- Drop functions
DROP FUNCTION IF EXISTS increment_community_members_count();
DROP FUNCTION IF EXISTS decrement_community_members_count();
DROP FUNCTION IF EXISTS auto_add_creator_as_admin();

-- Drop tables (CASCADE will drop related objects)
DROP TABLE IF EXISTS community_members CASCADE;
DROP TABLE IF EXISTS communities CASCADE;

-- =====================================================
-- STEP 2: Create communities table
-- =====================================================

CREATE TABLE communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('medical', 'education', 'financial', 'food', 'shelter', 'emergency', 'other')),
  location text,
  creator_id uuid NOT NULL,
  is_verified boolean DEFAULT false,
  members_count integer DEFAULT 0,
  trust_rating numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Foreign key constraint
  CONSTRAINT fk_creator FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add comments for documentation
COMMENT ON TABLE communities IS 'Stores all community information';
COMMENT ON COLUMN communities.creator_id IS 'User who created the community';
COMMENT ON COLUMN communities.members_count IS 'Total number of members (auto-updated by triggers)';
COMMENT ON COLUMN communities.trust_rating IS 'Community trust score (0-5)';

-- Create indexes for better query performance
CREATE INDEX idx_communities_creator_id ON communities(creator_id);
CREATE INDEX idx_communities_category ON communities(category);
CREATE INDEX idx_communities_created_at ON communities(created_at DESC);
CREATE INDEX idx_communities_location ON communities(location);

-- =====================================================
-- STEP 3: Create community_members table
-- =====================================================

CREATE TABLE community_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamp with time zone DEFAULT now(),
  
  -- Foreign key constraints
  CONSTRAINT fk_community FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Prevent duplicate memberships
  CONSTRAINT unique_community_member UNIQUE(community_id, user_id)
);

-- Add comments for documentation
COMMENT ON TABLE community_members IS 'Tracks user memberships in communities';
COMMENT ON COLUMN community_members.role IS 'User role in the community (admin or member)';

-- Create indexes for better query performance
CREATE INDEX idx_community_members_community_id ON community_members(community_id);
CREATE INDEX idx_community_members_user_id ON community_members(user_id);
CREATE INDEX idx_community_members_joined_at ON community_members(joined_at DESC);

-- =====================================================
-- STEP 4: Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: Create RLS Policies for communities table
-- =====================================================

-- Policy 1: Everyone can view all communities (public access)
CREATE POLICY "allow_select_communities"
  ON communities
  FOR SELECT
  USING (true);

-- Policy 2: Authenticated users can create communities
CREATE POLICY "allow_insert_communities"
  ON communities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Policy 3: Only creator can update their community
CREATE POLICY "allow_update_communities"
  ON communities
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Policy 4: Only creator can delete their community
CREATE POLICY "allow_delete_communities"
  ON communities
  FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- =====================================================
-- STEP 6: Create RLS Policies for community_members table
-- =====================================================

-- Policy 1: Everyone can view all community members
CREATE POLICY "allow_select_community_members"
  ON community_members
  FOR SELECT
  USING (true);

-- Policy 2: Authenticated users can join communities
CREATE POLICY "allow_insert_community_members"
  ON community_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can leave communities they joined
CREATE POLICY "allow_delete_community_members"
  ON community_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- STEP 7: Create Trigger Functions
-- =====================================================

-- Function 1: Auto-add creator as admin when community is created
CREATE OR REPLACE FUNCTION auto_add_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the creator as an admin member
  INSERT INTO community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.creator_id, 'admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION auto_add_creator_as_admin() IS 'Automatically adds community creator as admin member';

-- Function 2: Increment members_count when a user joins
CREATE OR REPLACE FUNCTION increment_community_members_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the members_count in communities table
  UPDATE communities
  SET 
    members_count = members_count + 1,
    updated_at = now()
  WHERE id = NEW.community_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_community_members_count() IS 'Increments community member count when user joins';

-- Function 3: Decrement members_count when a user leaves
CREATE OR REPLACE FUNCTION decrement_community_members_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the members_count in communities table
  UPDATE communities
  SET 
    members_count = GREATEST(members_count - 1, 0),
    updated_at = now()
  WHERE id = OLD.community_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION decrement_community_members_count() IS 'Decrements community member count when user leaves';

-- =====================================================
-- STEP 8: Create Triggers
-- =====================================================

-- Trigger 1: Auto-add creator as admin after community creation
CREATE TRIGGER on_community_created
  AFTER INSERT ON communities
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_creator_as_admin();

-- Trigger 2: Increment member count after user joins
CREATE TRIGGER on_community_member_added
  AFTER INSERT ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION increment_community_members_count();

-- Trigger 3: Decrement member count after user leaves
CREATE TRIGGER on_community_member_removed
  AFTER DELETE ON community_members
  FOR EACH ROW
  EXECUTE FUNCTION decrement_community_members_count();

-- =====================================================
-- STEP 9: Enable Realtime (if not already enabled)
-- =====================================================

-- Note: Run these commands separately if you get an error
-- about publication already existing

-- Try to add tables to realtime publication
DO $$ 
BEGIN
  -- Add communities table to realtime
  ALTER PUBLICATION supabase_realtime ADD TABLE communities;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication
  WHEN undefined_object THEN
    NULL; -- Publication doesn't exist (will be created by Supabase)
END $$;

DO $$ 
BEGIN
  -- Add community_members table to realtime
  ALTER PUBLICATION supabase_realtime ADD TABLE community_members;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication
  WHEN undefined_object THEN
    NULL; -- Publication doesn't exist (will be created by Supabase)
END $$;

-- =====================================================
-- STEP 10: Insert Sample Data (Optional - for testing)
-- =====================================================

-- You can uncomment this section to add sample communities
-- Make sure to replace 'YOUR_USER_ID_HERE' with an actual user ID from auth.users

/*
-- Get the first user ID (or specify your own)
DO $$
DECLARE
  sample_user_id uuid;
BEGIN
  -- Get first user from auth.users (adjust as needed)
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
  
  -- Only insert if we found a user
  IF sample_user_id IS NOT NULL THEN
    -- Insert sample communities
    INSERT INTO communities (name, description, category, location, creator_id, is_verified, trust_rating)
    VALUES 
      ('Mumbai Medical Support', 'Community helping with medical expenses and healthcare access in Mumbai', 'medical', 'Mumbai, Maharashtra', sample_user_id, true, 4.5),
      ('Delhi Education Fund', 'Supporting education needs of children in Delhi NCR region', 'education', 'Delhi', sample_user_id, true, 4.7),
      ('Bangalore Food Security', 'Ensuring no one goes hungry in Bangalore', 'food', 'Bangalore, Karnataka', sample_user_id, false, 4.3);
    
    RAISE NOTICE 'Sample communities created successfully!';
  ELSE
    RAISE NOTICE 'No users found. Create a user first, then run sample data insertion.';
  END IF;
END $$;
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these queries to verify the setup:

-- 1. Check if tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('communities', 'community_members')
ORDER BY table_name;

-- 2. Check columns in communities table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'communities'
ORDER BY ordinal_position;

-- 3. Check columns in community_members table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'community_members'
ORDER BY ordinal_position;

-- 4. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('communities', 'community_members')
ORDER BY tablename, policyname;

-- 5. Check triggers
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('communities', 'community_members')
ORDER BY event_object_table, trigger_name;

-- 6. Check indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('communities', 'community_members')
ORDER BY tablename, indexname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '
  ====================================================
  ✅ COMMUNITIES MODULE SETUP COMPLETE!
  ====================================================
  
  Tables Created:
  - communities (with creator_id, name, description, etc.)
  - community_members (with user_id, community_id, role)
  
  Triggers Active:
  - Auto-add creator as admin
  - Auto-increment members_count on join
  - Auto-decrement members_count on leave
  
  RLS Policies:
  - Anyone can view communities
  - Authenticated users can create communities
  - Only creators can update/delete their communities
  - Users can join/leave communities
  
  Realtime: Enabled for live updates
  
  Next Steps:
  1. Verify tables exist (see verification queries above)
  2. Test creating a community from your app
  3. Test joining/leaving communities
  4. Check real-time updates are working
  
  ====================================================
  ';
END $$;

-- =====================================================
-- END OF SCRIPT
-- =====================================================
