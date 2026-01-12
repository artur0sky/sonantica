-- AI Metadata Migration
-- Description: Add AI-related columns to tracks table
-- Order: 005

-- 1. Add AI columns to tracks table
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS has_stems BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_embeddings BOOLEAN DEFAULT FALSE;

-- 2. Create index for AI metadata performance
-- Allows fast querying for tracks that have specific AI properties
CREATE INDEX IF NOT EXISTS idx_tracks_ai_metadata ON tracks USING gin (ai_metadata);
CREATE INDEX IF NOT EXISTS idx_tracks_has_stems ON tracks (has_stems) WHERE has_stems = TRUE;
CREATE INDEX IF NOT EXISTS idx_tracks_has_embeddings ON tracks (has_embeddings) WHERE has_embeddings = TRUE;

-- 3. Add commentary
COMMENT ON COLUMN tracks.ai_metadata IS 'Stores AI-generated metadata, tags, and processing history';
COMMENT ON COLUMN tracks.has_stems IS 'Indicates if the track has been processed by Demucs and has available stems';
COMMENT ON COLUMN tracks.has_embeddings IS 'Indicates if the track has audio embeddings stored in track_embeddings table';
