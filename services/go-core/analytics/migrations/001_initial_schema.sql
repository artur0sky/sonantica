-- Analytics Schema Migration Script
-- Version: 1.0.0
-- Date: 2026-01-05
-- Description: Initial analytics schema for Sonántica

-- ============================================================================
-- Pre-Migration Checks
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting Analytics Schema Migration v1.0.0';
    RAISE NOTICE 'Timestamp: %', NOW();
END $$;

-- ============================================================================
-- Create Tables
-- ============================================================================

-- Sessions Table
CREATE TABLE IF NOT EXISTS analytics_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255),
    platform VARCHAR(50) NOT NULL,
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    os VARCHAR(100),
    os_version VARCHAR(50),
    locale VARCHAR(10),
    timezone VARCHAR(50),
    ip_hash VARCHAR(64),
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    last_heartbeat TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Events Table (Raw events)
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID UNIQUE NOT NULL,
    session_id VARCHAR(255) NOT NULL REFERENCES analytics_sessions(session_id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Playback Sessions (Aggregated)
CREATE TABLE IF NOT EXISTS playback_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    track_id VARCHAR(255) NOT NULL,
    album_id VARCHAR(255),
    artist_id VARCHAR(255),
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    duration_played INTEGER,
    completion_percentage DECIMAL(5,2),
    source VARCHAR(50),
    source_id VARCHAR(255),
    codec VARCHAR(50),
    bitrate INTEGER,
    eq_enabled BOOLEAN DEFAULT FALSE,
    eq_preset VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Track Statistics (Pre-aggregated)
CREATE TABLE IF NOT EXISTS track_statistics (
    track_id VARCHAR(255) PRIMARY KEY,
    play_count INTEGER DEFAULT 0,
    complete_count INTEGER DEFAULT 0,
    skip_count INTEGER DEFAULT 0,
    total_play_time INTEGER DEFAULT 0,
    average_completion DECIMAL(5,2) DEFAULT 0,
    last_played_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Listening Heatmap
CREATE TABLE IF NOT EXISTS listening_heatmap (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour < 24),
    play_count INTEGER DEFAULT 0,
    unique_tracks INTEGER DEFAULT 0,
    total_duration INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, hour)
);

-- Track Segments
CREATE TABLE IF NOT EXISTS track_segments (
    id BIGSERIAL PRIMARY KEY,
    track_id VARCHAR(255) NOT NULL,
    segment_start INTEGER NOT NULL,
    segment_end INTEGER NOT NULL,
    play_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(track_id, segment_start, segment_end)
);

-- Genre Statistics
CREATE TABLE IF NOT EXISTS genre_statistics (
    genre VARCHAR(100) PRIMARY KEY,
    play_count INTEGER DEFAULT 0,
    total_play_time INTEGER DEFAULT 0,
    unique_tracks INTEGER DEFAULT 0,
    unique_artists INTEGER DEFAULT 0,
    last_played_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Listening Streaks
CREATE TABLE IF NOT EXISTS listening_streaks (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    date DATE NOT NULL,
    tracks_played INTEGER DEFAULT 0,
    play_time INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, date)
);

DO $$
BEGIN
    RAISE NOTICE 'Tables created successfully';
END $$;

-- ============================================================================
-- Create Indexes
-- ============================================================================

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON analytics_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_platform ON analytics_sessions(platform);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_data_gin ON analytics_events USING GIN (data);

-- Playback sessions indexes
CREATE INDEX IF NOT EXISTS idx_playback_track ON playback_sessions(track_id);
CREATE INDEX IF NOT EXISTS idx_playback_album ON playback_sessions(album_id);
CREATE INDEX IF NOT EXISTS idx_playback_artist ON playback_sessions(artist_id);
CREATE INDEX IF NOT EXISTS idx_playback_started ON playback_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_playback_session ON playback_sessions(session_id);

-- Track statistics indexes
CREATE INDEX IF NOT EXISTS idx_track_stats_play_count ON track_statistics(play_count DESC);
CREATE INDEX IF NOT EXISTS idx_track_stats_last_played ON track_statistics(last_played_at DESC);

-- Heatmap indexes
CREATE INDEX IF NOT EXISTS idx_heatmap_date ON listening_heatmap(date);
CREATE INDEX IF NOT EXISTS idx_heatmap_date_hour ON listening_heatmap(date, hour);

-- Segments indexes
CREATE INDEX IF NOT EXISTS idx_segments_track ON track_segments(track_id);
CREATE INDEX IF NOT EXISTS idx_segments_play_count ON track_segments(play_count DESC);

-- Genre statistics indexes
CREATE INDEX IF NOT EXISTS idx_genre_stats_play_count ON genre_statistics(play_count DESC);

-- Streaks indexes
CREATE INDEX IF NOT EXISTS idx_streaks_user ON listening_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_date ON listening_streaks(date DESC);

DO $$
BEGIN
    RAISE NOTICE 'Indexes created successfully';
END $$;

-- ============================================================================
-- Create Functions and Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_track_statistics_updated_at ON track_statistics;
CREATE TRIGGER update_track_statistics_updated_at 
    BEFORE UPDATE ON track_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_listening_heatmap_updated_at ON listening_heatmap;
CREATE TRIGGER update_listening_heatmap_updated_at 
    BEFORE UPDATE ON listening_heatmap
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_track_segments_updated_at ON track_segments;
CREATE TRIGGER update_track_segments_updated_at 
    BEFORE UPDATE ON track_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_genre_statistics_updated_at ON genre_statistics;
CREATE TRIGGER update_genre_statistics_updated_at 
    BEFORE UPDATE ON genre_statistics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
    RAISE NOTICE 'Triggers created successfully';
END $$;

-- ============================================================================
-- Create Views
-- ============================================================================

-- View: Top Tracks with metadata
CREATE OR REPLACE VIEW v_top_tracks AS
SELECT 
    ts.track_id,
    COALESCE(t.title, 'Unknown') as track_title,
    COALESCE(ar.name, 'Unknown Artist') as artist_name,
    COALESCE(al.title, 'Unknown Album') as album_title,
    al.cover_path as album_art,
    ts.play_count,
    ts.total_play_time,
    ts.average_completion,
    ts.last_played_at
FROM track_statistics ts
LEFT JOIN tracks t ON ts.track_id = t.id
LEFT JOIN artists ar ON t.artist_id = ar.id
LEFT JOIN albums al ON t.album_id = al.id
ORDER BY ts.play_count DESC;

-- View: Platform usage summary
CREATE OR REPLACE VIEW v_platform_summary AS
SELECT 
    platform,
    COUNT(*) as session_count,
    COUNT(DISTINCT DATE(started_at)) as active_days,
    MAX(started_at) as last_used
FROM analytics_sessions
GROUP BY platform
ORDER BY session_count DESC;

-- View: Daily listening activity
CREATE OR REPLACE VIEW v_daily_activity AS
SELECT 
    date,
    SUM(play_count) as total_plays,
    SUM(total_duration) as total_duration,
    SUM(unique_tracks) as unique_tracks
FROM listening_heatmap
GROUP BY date
ORDER BY date DESC;

DO $$
BEGIN
    RAISE NOTICE 'Views created successfully';
END $$;

-- ============================================================================
-- Add Comments
-- ============================================================================

COMMENT ON TABLE analytics_sessions IS 'User sessions with platform and browser information';
COMMENT ON TABLE analytics_events IS 'Raw analytics events with JSONB data for flexibility';
COMMENT ON TABLE playback_sessions IS 'Aggregated playback sessions for track listening analysis';
COMMENT ON TABLE track_statistics IS 'Pre-aggregated statistics per track for performance';
COMMENT ON TABLE listening_heatmap IS 'Time-based listening patterns (hourly)';
COMMENT ON TABLE track_segments IS 'Most listened parts within tracks';
COMMENT ON TABLE genre_statistics IS 'Aggregated statistics by genre';
COMMENT ON TABLE listening_streaks IS 'Daily listening activity for streak calculation';

-- ============================================================================
-- Migration Complete
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Analytics Schema Migration COMPLETED';
    RAISE NOTICE 'Version: 1.0.0';
    RAISE NOTICE 'Tables: 8';
    RAISE NOTICE 'Indexes: 17';
    RAISE NOTICE 'Triggers: 4';
    RAISE NOTICE 'Views: 3';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE '========================================';
END $$;
