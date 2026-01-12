-- Multimodal Embeddings Migration
-- Description: Create dedicated embedding tables for Audio, Stems, Lyrics, and Visuals
-- Identity: The Wise Craftsman (Scientific Organization)
-- Order: 007

-- 1. Rename generic track_embeddings to specific audio spectral table
-- This preserves existing audio analysis data while aligning with the new architecture.
ALTER TABLE IF EXISTS track_embeddings RENAME TO embeddings_audio_spectral;

-- Update the index name for consistency if it exists
ALTER INDEX IF EXISTS idx_track_embeddings_vector RENAME TO idx_embeddings_audio_spectral_vector;

-- 2. Create Lyrics Embeddings (Semantic)
-- Captures the narrative and emotional essence of the song.
-- Dimension: 768 (Standard for MPNet/BERT based models)
CREATE TABLE IF NOT EXISTS embeddings_lyrics_semantic (
    track_id UUID PRIMARY KEY REFERENCES tracks(id) ON DELETE CASCADE,
    embedding vector(768),
    model_name TEXT DEFAULT 'all-mpnet-base-v2',
    sentiment_data JSONB DEFAULT '{}'::jsonb, -- Detailed sentiment/emotion scores
    topics TEXT[], -- Extracted topics/themes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Visual Embeddings (Aesthetic)
-- Captures the vibe of the cover art.
-- Dimension: 512 (Standard for CLIP)
CREATE TABLE IF NOT EXISTS embeddings_visual_aesthetic (
    track_id UUID PRIMARY KEY REFERENCES tracks(id) ON DELETE CASCADE,
    embedding vector(512),
    model_name TEXT DEFAULT 'clip-vit-base-patch32',
    color_palette JSONB DEFAULT '[]'::jsonb, -- Dominant colors
    style_tags TEXT[], -- AI-detected style tags (e.g., 'minimalist', 'dark', 'abstract')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Stems Embeddings (Structural)
-- Stores vectors for individual components (The "Critical Ear" Phase).
-- One row per stem type per track allows granular comparison (e.g., "Find songs with similar Bass").
CREATE TABLE IF NOT EXISTS embeddings_audio_stems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    stem_type VARCHAR(20) NOT NULL CHECK (stem_type IN ('bass', 'drums', 'vocals', 'other', 'piano', 'guitar')),
    embedding vector(512),
    model_name TEXT DEFAULT 'clap-htsat-unfused',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(track_id, stem_type)
);

-- 5. Create HNSW Indexes for fast similarity search
-- Audio Spectral index is already handled by the rename.

CREATE INDEX IF NOT EXISTS idx_embeddings_lyrics_vector ON embeddings_lyrics_semantic 
USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_embeddings_visual_vector ON embeddings_visual_aesthetic 
USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_embeddings_stems_vector ON embeddings_audio_stems 
USING hnsw (embedding vector_cosine_ops);

-- 6. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_multimodal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_lyrics_timestamp
    BEFORE UPDATE ON embeddings_lyrics_semantic
    FOR EACH ROW EXECUTE FUNCTION update_multimodal_timestamp();

CREATE TRIGGER trigger_update_visual_timestamp
    BEFORE UPDATE ON embeddings_visual_aesthetic
    FOR EACH ROW EXECUTE FUNCTION update_multimodal_timestamp();

CREATE TRIGGER trigger_update_stems_timestamp
    BEFORE UPDATE ON embeddings_audio_stems
    FOR EACH ROW EXECUTE FUNCTION update_multimodal_timestamp();

-- Comments
COMMENT ON TABLE embeddings_audio_spectral IS 'Global audio spectral analysis (Timbre, Rhythm). Was track_embeddings.';
COMMENT ON TABLE embeddings_lyrics_semantic IS 'Semantic vector representation of lyrics and extracted narrative data.';
COMMENT ON TABLE embeddings_visual_aesthetic IS 'Visual vector representation of album cover art.';
COMMENT ON TABLE embeddings_audio_stems IS 'Vectors for isolated audio stems (Bass, Drums, Vocals) for granular similarity.';
