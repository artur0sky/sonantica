-- Migration 003: Update listening_streaks table structure
-- This migration updates the listening_streaks table to match the Python worker expectations

-- Drop the old table structure
DROP TABLE IF EXISTS listening_streaks CASCADE;

-- Create the new table with correct columns
CREATE TABLE listening_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) UNIQUE NOT NULL,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_played_at TIMESTAMP WITH TIME ZONE,
    total_play_time INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_listening_streaks_user ON listening_streaks(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_listening_streaks_updated_at 
    BEFORE UPDATE ON listening_streaks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant privileges
GRANT ALL PRIVILEGES ON listening_streaks TO sonantica_user;
