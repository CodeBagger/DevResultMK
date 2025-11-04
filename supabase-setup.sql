-- Supabase Database Setup for Scheduler App
-- Run this SQL in your Supabase SQL Editor

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    start TIMESTAMPTZ NOT NULL,
    "end" TIMESTAMPTZ NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start);
CREATE INDEX IF NOT EXISTS idx_events_end ON events("end");
CREATE INDEX IF NOT EXISTS idx_events_start_end ON events(start, "end");

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- For now, we'll allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on events" ON events
    FOR ALL USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample events (optional)
INSERT INTO events (title, start, "end", description, color) VALUES
    ('Team Meeting', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 1 hour', 'Weekly team standup', '#3b82f6'),
    ('Project Deadline', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 2 hours', 'Final project submission', '#ef4444'),
    ('Client Call', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 30 minutes', 'Discuss project requirements', '#10b981');
