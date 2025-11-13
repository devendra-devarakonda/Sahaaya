-- ========================================================================
-- SAHAAYA PLATFORM - AUTO-FILL COMMUNITY HELP REQUEST CATEGORY
-- ========================================================================
-- This script creates a trigger to automatically set the category
-- of community help requests based on their parent community's category
-- Run this in Supabase SQL Editor
-- ========================================================================

-- ========================================================================
-- STEP 1: CREATE TRIGGER FUNCTION
-- ========================================================================

CREATE OR REPLACE FUNCTION set_community_help_request_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-fill category from parent community
  NEW.category := (
    SELECT category 
    FROM public.communities 
    WHERE id = NEW.community_id
  );
  
  -- If category is still null (community not found), set a default
  IF NEW.category IS NULL THEN
    NEW.category := 'other';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- STEP 2: DROP EXISTING TRIGGER (IF ANY)
-- ========================================================================

DROP TRIGGER IF EXISTS trg_set_community_category ON public.community_help_requests;

-- ========================================================================
-- STEP 3: CREATE TRIGGER
-- ========================================================================

CREATE TRIGGER trg_set_community_category
BEFORE INSERT ON public.community_help_requests
FOR EACH ROW
EXECUTE FUNCTION set_community_help_request_category();

-- ========================================================================
-- STEP 4: VERIFICATION QUERY
-- ========================================================================

-- Check if the trigger was created successfully
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trg_set_community_category'
  AND event_object_schema = 'public'
  AND event_object_table = 'community_help_requests';

-- ========================================================================
-- STEP 5: TEST THE TRIGGER (OPTIONAL)
-- ========================================================================

-- To test, you can try inserting a test record (make sure you have a valid community_id)
-- The category should be auto-filled from the community

/*
-- Example test (replace with actual IDs):
INSERT INTO public.community_help_requests (
  community_id,
  user_id,
  title,
  description,
  urgency,
  amount_needed
) VALUES (
  'YOUR_COMMUNITY_ID_HERE',
  auth.uid(),
  'Test Request',
  'This is a test request to verify auto-category',
  'medium',
  1000
) RETURNING *;

-- The returned record should have the category field auto-filled
-- from the parent community's category

-- Clean up test data:
-- DELETE FROM public.community_help_requests WHERE title = 'Test Request';
*/

-- ========================================================================
-- SUCCESS MESSAGE
-- ========================================================================
-- If this script runs without errors, your trigger is ready!
-- Community help requests will now automatically inherit their category
-- from the parent community.
-- ========================================================================
