-- Supabase Database Setup for Scheduler App with Authentication
-- Run this SQL in your Supabase SQL Editor
-- This script updates the existing events table to support user authentication

-- Add user_id column to events table if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);

-- Drop the old policy that allowed all operations
DROP POLICY IF EXISTS "Allow all operations on events" ON events;

-- Create new RLS policies for user-specific access
-- Users can only see their own events
CREATE POLICY "Users can view their own events" ON events
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert their own events" ON events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own events
CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own events
CREATE POLICY "Users can delete their own events" ON events
    FOR DELETE USING (auth.uid() = user_id);

-- Update existing events to have NULL user_id (optional - you may want to delete them instead)
-- Uncomment the line below if you want to keep existing events visible to all users
-- UPDATE events SET user_id = NULL WHERE user_id IS NULL;



