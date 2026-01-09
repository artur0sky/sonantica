-- ============================================================================
-- SONANTICA UNIFIED INITIAL SCHEMA (v1.0.0)
-- ============================================================================
-- All entities use UUIDs for IDs and Foreign Keys.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE LIBRARY TABLES
-- ============================================================================

-- Artists Table
CREATE TABLE IF NOT EXISTS artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    bio TEXT,
    cover_art TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Albums Table
CREATE TABLE IF NOT EXISTS albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
    release_date DATE,
    cover_art TEXT,
    genre TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracks Table
CREATE TABLE IF NOT EXISTS tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
    artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
    file_path TEXT NOT NULL,
    duration_seconds REAL NOT NULL DEFAULT 0,
    format TEXT,
    bitrate INTEGER,
    sample_rate INTEGER,
    channels INTEGER,
    track_number INTEGER,
    disc_number INTEGER,
    genre TEXT,
    year INTEGER,
    play_count INTEGER DEFAULT 0,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PLAYLIST TABLES
-- ============================================

-- Playlists Table
CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    snapshot_date TIMESTAMP WITH TIME ZONE,
    rules JSONB
);

-- Playlist Tracks (Many-to-Many)
CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (playlist_id, track_id)
);

-- ============================================
-- ANALYTICS TABLES
-- ============================================

-- Analytics Sessions
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

-- Analytics Events (Raw)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID UNIQUE NOT NULL,
    session_id VARCHAR(255) NOT NULL REFERENCES analytics_sessions(session_id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Playback Sessions (Aggregated)
CREATE TABLE IF NOT EXISTS playback_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
    artist_id UUID REFERENCES artists(id) ON DELETE SET NULL,
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

-- Track Statistics
CREATE TABLE IF NOT EXISTS track_statistics (
    track_id UUID PRIMARY KEY REFERENCES tracks(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    segment_start INTEGER NOT NULL,
    segment_end INTEGER NOT NULL,
    play_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(track_id, segment_start, segment_end)
);

-- Genre Statistics
CREATE TABLE IF NOT EXISTS genre_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    genre VARCHAR(100) UNIQUE NOT NULL,
    play_count INTEGER DEFAULT 0,
    total_play_time INTEGER DEFAULT 0,
    unique_tracks INTEGER DEFAULT 0,
    unique_artists INTEGER DEFAULT 0,
    last_played_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Listening Streaks
CREATE TABLE IF NOT EXISTS listening_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    date DATE NOT NULL,
    tracks_played INTEGER DEFAULT 0,
    play_time INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);
CREATE INDEX IF NOT EXISTS idx_albums_artist ON albums(artist_id);
CREATE INDEX IF NOT EXISTS idx_albums_title ON albums(title);
CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks(title);
CREATE INDEX IF NOT EXISTS idx_playlists_type ON playlists(type);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_playback_track ON playback_sessions(track_id);
CREATE INDEX IF NOT EXISTS idx_track_stats_play_count ON track_statistics(play_count DESC);
CREATE INDEX IF NOT EXISTS idx_heatmap_date ON listening_heatmap(date);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_track_statistics_updated_at BEFORE UPDATE ON track_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listening_heatmap_updated_at BEFORE UPDATE ON listening_heatmap FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_genre_statistics_updated_at BEFORE UPDATE ON genre_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW v_top_tracks AS
SELECT 
    ts.track_id,
    COALESCE(t.title, 'Unknown') as track_title,
    COALESCE(ar.name, 'Unknown Artist') as artist_name,
    COALESCE(al.title, 'Unknown Album') as album_title,
    al.cover_art as album_art,
    ts.play_count,
    ts.total_play_time,
    ts.average_completion,
    ts.last_played_at
FROM track_statistics ts
LEFT JOIN tracks t ON ts.track_id = t.id
LEFT JOIN artists ar ON t.artist_id = ar.id
LEFT JOIN albums al ON t.album_id = al.id
ORDER BY ts.play_count DESC;
