-- Playlist Table
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

-- Index for fast retrieval
CREATE INDEX idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);
