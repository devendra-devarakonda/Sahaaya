-- =====================================================
-- HELP OFFERS TABLE
-- Tracks when users offer help on help requests
-- =====================================================

-- Create help_offers table
CREATE TABLE IF NOT EXISTS public.help_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.help_requests(id) ON DELETE CASCADE,
    helper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
    helper_name TEXT,
    helper_email TEXT,
    helper_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_help_offers_request_id ON public.help_offers(request_id);
CREATE INDEX IF NOT EXISTS idx_help_offers_helper_id ON public.help_offers(helper_id);
CREATE INDEX IF NOT EXISTS idx_help_offers_requester_id ON public.help_offers(requester_id);
CREATE INDEX IF NOT EXISTS idx_help_offers_status ON public.help_offers(status);
CREATE INDEX IF NOT EXISTS idx_help_offers_created_at ON public.help_offers(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_help_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_help_offers_updated_at ON public.help_offers;
CREATE TRIGGER set_help_offers_updated_at
    BEFORE UPDATE ON public.help_offers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_help_offers_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.help_offers ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can INSERT offers where they are the helper
-- This allows logged-in users to create help offers
CREATE POLICY "Users can create help offers"
    ON public.help_offers
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = helper_id);

-- Policy 2: Users can SELECT offers where they are the helper OR requester
-- Helpers can see their own offers, requesters can see offers on their requests
CREATE POLICY "Users can view their own help offers"
    ON public.help_offers
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = helper_id OR 
        auth.uid() = requester_id
    );

-- Policy 3: Requesters can UPDATE status of offers on their requests
-- This allows requesters to accept/reject offers
CREATE POLICY "Requesters can update offer status"
    ON public.help_offers
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = requester_id)
    WITH CHECK (auth.uid() = requester_id);

-- Policy 4: Helpers can UPDATE their own offers (e.g., cancel, add message)
CREATE POLICY "Helpers can update their own offers"
    ON public.help_offers
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = helper_id)
    WITH CHECK (auth.uid() = helper_id);

-- Policy 5: Users can DELETE their own offers (only if status is pending)
CREATE POLICY "Users can delete pending offers"
    ON public.help_offers
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = helper_id AND 
        status = 'pending'
    );

-- =====================================================
-- ENABLE REALTIME
-- =====================================================

-- Enable realtime for the help_offers table
-- This allows instant updates when offers are created/updated
ALTER PUBLICATION supabase_realtime ADD TABLE public.help_offers;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.help_offers IS 'Stores help offers from volunteers/donors to help requesters';
COMMENT ON COLUMN public.help_offers.id IS 'Unique identifier for the help offer';
COMMENT ON COLUMN public.help_offers.request_id IS 'References the help request being offered help for';
COMMENT ON COLUMN public.help_offers.helper_id IS 'User ID of the person offering help';
COMMENT ON COLUMN public.help_offers.requester_id IS 'User ID of the person who created the help request';
COMMENT ON COLUMN public.help_offers.message IS 'Optional message from the helper to the requester';
COMMENT ON COLUMN public.help_offers.status IS 'Current status: pending, accepted, rejected, completed, cancelled';
COMMENT ON COLUMN public.help_offers.helper_name IS 'Name of the helper (denormalized for quick access)';
COMMENT ON COLUMN public.help_offers.helper_email IS 'Email of the helper (denormalized for notifications)';
COMMENT ON COLUMN public.help_offers.helper_phone IS 'Phone number of the helper (denormalized for contact)';

-- =====================================================
-- SAMPLE QUERIES FOR TESTING
-- =====================================================

-- Query to get all help offers for the current user (as helper)
-- SELECT * FROM help_offers WHERE helper_id = auth.uid() ORDER BY created_at DESC;

-- Query to get all help offers received by the current user (as requester)
-- SELECT * FROM help_offers WHERE requester_id = auth.uid() ORDER BY created_at DESC;

-- Query to get all offers for a specific request
-- SELECT * FROM help_offers WHERE request_id = 'request-uuid' ORDER BY created_at DESC;

-- =====================================================
-- COMPLETE! ✅
-- =====================================================
-- Run this script in your Supabase SQL Editor to create
-- the help_offers table with all necessary RLS policies
-- and realtime capabilities.
-- =====================================================
