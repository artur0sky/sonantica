-- Complete Database Schema for Sonantica
-- All tables created in proper order with correct FK relationships

-- ============================================
-- CORE TABLES
-- ============================================

-- Artists Table
CREATE TABLE IF NOT EXISTS artists (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    cover_art TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Albums Table
CREATE TABLE IF NOT EXISTS albums (
    id UUID PRIMARY KEY,
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
    id UUID PRIMARY KEY,
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
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'MANUAL', 'SMART', 'GENERATED', 'HISTORY_SNAPSHOT'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    snapshot_date TIMESTAMP WITH TIME ZONE, -- For HISTORY_SNAPSHOT
    rules JSONB -- For SMART playlists
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
-- INDEXES
-- ============================================

-- Artist indexes
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);

-- Album indexes
CREATE INDEX IF NOT EXISTS idx_albums_artist ON albums(artist_id);
CREATE INDEX IF NOT EXISTS idx_albums_title ON albums(title);

-- Track indexes
CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album_id);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks(title);
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);
CREATE INDEX IF NOT EXISTS idx_tracks_year ON tracks(year);

-- Playlist indexes
CREATE INDEX IF NOT EXISTS idx_playlists_type ON playlists(type);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_artists_updated_at ON artists;
CREATE TRIGGER update_artists_updated_at
    BEFORE UPDATE ON artists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_albums_updated_at ON albums;
CREATE TRIGGER update_albums_updated_at
    BEFORE UPDATE ON albums
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tracks_updated_at ON tracks;
CREATE TRIGGER update_tracks_updated_at
    BEFORE UPDATE ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_playlists_updated_at ON playlists;
CREATE TRIGGER update_playlists_updated_at
    BEFORE UPDATE ON playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
