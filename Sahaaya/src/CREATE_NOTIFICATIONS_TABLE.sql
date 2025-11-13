-- =====================================================
-- NOTIFICATIONS TABLE
-- Stores all notifications for users in the Sahaaya platform
-- =====================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN (
        'help_offer',
        'offer_accepted', 
        'offer_rejected',
        'offer_completed',
        'request_update',
        'message',
        'system',
        'donation',
        'match'
    )),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    
    -- Related entity references
    request_id UUID REFERENCES public.help_requests(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES public.help_offers(id) ON DELETE CASCADE,
    
    -- Metadata for additional context
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Contact details (denormalized for quick access)
    sender_name TEXT,
    sender_email TEXT,
    sender_phone TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON public.notifications(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_request_id ON public.notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_offer_id ON public.notifications(offer_id);

-- Composite index for common query pattern (recipient + unread)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread 
    ON public.notifications(recipient_id, is_read, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can only SELECT their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = recipient_id);

-- Policy 2: System/Application can INSERT notifications for any user
-- In practice, this will be done through triggers or server-side functions
CREATE POLICY "Authenticated users can create notifications"
    ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- Policy 3: Users can UPDATE their own notifications (mark as read, etc.)
CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = recipient_id)
    WITH CHECK (auth.uid() = recipient_id);

-- Policy 4: Users can DELETE their own notifications
CREATE POLICY "Users can delete their own notifications"
    ON public.notifications
    FOR DELETE
    TO authenticated
    USING (auth.uid() = recipient_id);

-- =====================================================
-- AUTOMATIC NOTIFICATION TRIGGER
-- Trigger to create notification when help offer is created
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_notification_on_help_offer()
RETURNS TRIGGER AS $$
DECLARE
    request_title TEXT;
    request_category TEXT;
BEGIN
    -- Get request details
    SELECT title, category INTO request_title, request_category
    FROM public.help_requests
    WHERE id = NEW.request_id;

    -- Create notification for the requester
    INSERT INTO public.notifications (
        recipient_id,
        sender_id,
        type,
        title,
        content,
        priority,
        request_id,
        offer_id,
        sender_name,
        sender_email,
        sender_phone,
        metadata
    ) VALUES (
        NEW.requester_id,
        NEW.helper_id,
        'help_offer',
        'New Help Offer Received! 🎉',
        COALESCE(NEW.helper_name, 'Someone') || ' has offered to help with your request: "' || request_title || '"',
        'high',
        NEW.request_id,
        NEW.id,
        NEW.helper_name,
        NEW.helper_email,
        NEW.helper_phone,
        jsonb_build_object(
            'request_title', request_title,
            'request_category', request_category,
            'offer_message', NEW.message
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_create_notification_on_help_offer ON public.help_offers;

-- Create trigger
CREATE TRIGGER trigger_create_notification_on_help_offer
    AFTER INSERT ON public.help_offers
    FOR EACH ROW
    EXECUTE FUNCTION public.create_notification_on_help_offer();

-- =====================================================
-- FUNCTION TO MARK ALL NOTIFICATIONS AS READ
-- =====================================================

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE recipient_id = auth.uid() AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION TO GET UNREAD NOTIFICATION COUNT
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.notifications
        WHERE recipient_id = auth.uid() AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENABLE REALTIME
-- =====================================================

-- Enable realtime for the notifications table
-- This allows instant updates when new notifications arrive
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.notifications IS 'Stores all user notifications in the Sahaaya platform';
COMMENT ON COLUMN public.notifications.id IS 'Unique identifier for the notification';
COMMENT ON COLUMN public.notifications.recipient_id IS 'User who will receive this notification';
COMMENT ON COLUMN public.notifications.sender_id IS 'User who triggered this notification (nullable for system notifications)';
COMMENT ON COLUMN public.notifications.type IS 'Type of notification: help_offer, offer_accepted, message, system, etc.';
COMMENT ON COLUMN public.notifications.title IS 'Short title/heading for the notification';
COMMENT ON COLUMN public.notifications.content IS 'Full notification message/content';
COMMENT ON COLUMN public.notifications.is_read IS 'Whether the notification has been read by the recipient';
COMMENT ON COLUMN public.notifications.priority IS 'Notification priority: low, medium, high';
COMMENT ON COLUMN public.notifications.metadata IS 'Additional JSON data for the notification';

-- =====================================================
-- SAMPLE QUERIES FOR TESTING
-- =====================================================

-- Get all notifications for current user
-- SELECT * FROM notifications WHERE recipient_id = auth.uid() ORDER BY created_at DESC;

-- Get unread notifications count
-- SELECT get_unread_notification_count();

-- Mark all as read
-- SELECT mark_all_notifications_read();

-- Get recent help offer notifications
-- SELECT * FROM notifications 
-- WHERE recipient_id = auth.uid() AND type = 'help_offer' 
-- ORDER BY created_at DESC LIMIT 10;

-- =====================================================
-- COMPLETE! ✅
-- =====================================================
-- Run this script in your Supabase SQL Editor to create
-- the notifications table with automatic triggers,
-- RLS policies, and realtime capabilities.
-- =====================================================
