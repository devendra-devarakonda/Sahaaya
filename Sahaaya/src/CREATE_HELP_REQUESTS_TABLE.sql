-- ========================================================================
-- SAHAAYA PLATFORM - CREATE HELP_REQUESTS TABLE
-- ========================================================================
-- This script creates the help_requests table with full RLS policies
-- Run this in Supabase SQL Editor to fix PGRST205 error
-- ========================================================================

-- Step 1: Drop existing table if you need to recreate (CAUTION: This deletes data!)
-- DROP TABLE IF EXISTS public.help_requests CASCADE;

-- Step 2: Create the help_requests table
CREATE TABLE IF NOT EXISTS public.help_requests (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User reference (who created this request)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Request details
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  
  -- Financial information
  amount_needed NUMERIC(10, 2),
  
  -- Contact information
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Location information
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  full_location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'in_progress', 'completed', 'cancelled')),
  supporters INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Step 3: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 4: Create trigger for automatic updated_at
DROP TRIGGER IF EXISTS update_help_requests_updated_at ON public.help_requests;
CREATE TRIGGER update_help_requests_updated_at 
  BEFORE UPDATE ON public.help_requests
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_help_requests_user_id ON public.help_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON public.help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_urgency ON public.help_requests(urgency);
CREATE INDEX IF NOT EXISTS idx_help_requests_created_at ON public.help_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_help_requests_category ON public.help_requests(category);

-- Step 6: Enable Row Level Security
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop existing policies if recreating
DROP POLICY IF EXISTS "Users can insert their own help requests" ON public.help_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.help_requests;
DROP POLICY IF EXISTS "Users can browse other users requests" ON public.help_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON public.help_requests;
DROP POLICY IF EXISTS "Users can delete their own requests" ON public.help_requests;
DROP POLICY IF EXISTS "allow_my_requests" ON public.help_requests;
DROP POLICY IF EXISTS "allow_browse_requests" ON public.help_requests;

-- Step 8: Create RLS Policies

-- Policy 1: INSERT - Users can only insert their own requests
CREATE POLICY "Users can insert their own help requests"
ON public.help_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Policy 2: SELECT OWN - Users can view their own requests (My Requests)
CREATE POLICY "allow_my_requests"
ON public.help_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Policy 3: SELECT OTHERS - Users can browse other users' requests (Browse Requests)
CREATE POLICY "allow_browse_requests"
ON public.help_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() != user_id
);

-- Policy 4: UPDATE - Users can only update their own requests
CREATE POLICY "Users can update their own requests"
ON public.help_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);

-- Policy 5: DELETE - Users can only delete their own requests
CREATE POLICY "Users can delete their own requests"
ON public.help_requests
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
);

-- Step 9: Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.help_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ========================================================================
-- VERIFICATION QUERIES
-- ========================================================================

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'help_requests'
) AS table_exists;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'help_requests';

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'help_requests'
ORDER BY policyname;

-- Count existing records
SELECT COUNT(*) as total_requests FROM public.help_requests;

-- ========================================================================
-- TEST DATA (Optional - Uncomment to insert test records)
-- ========================================================================

/*
-- Insert test request (replace 'your-user-id-here' with actual auth.uid())
INSERT INTO public.help_requests (
  user_id,
  category,
  title,
  description,
  urgency,
  amount_needed,
  name,
  phone,
  city,
  status
) VALUES (
  auth.uid(),  -- This will use the current authenticated user's ID
  'medical-&-healthcare',
  'Medical assistance needed',
  'Urgent medical treatment required for heart condition. Need financial support for surgery.',
  'critical',
  50000,
  'Test User',
  '+91 9876543210',
  'Mumbai',
  'pending'
);
*/

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================
-- If this script runs without errors, your help_requests table is ready!
-- Next steps:
-- 1. Enable Realtime: Dashboard → Database → Replication → Toggle ON for help_requests
-- 2. Test the application by creating a help request
-- 3. Verify it appears in Dashboard → My Requests
-- 4. Log in with another user and check Browse Requests
-- ========================================================================
