use lofty::{read_from_path, Accessor, AudioFile, ItemKey, TaggedFileExt};
use std::path::Path;
use crate::models::AudioMetadata;

/// Metadata extractor service - responsible for reading audio file metadata
pub struct MetadataExtractor;

impl MetadataExtractor {
    pub fn new() -> Self {
        Self
    }

    /// Extract metadata from an audio file
    pub fn extract(&self, file_path: &str) -> Result<AudioMetadata, String> {
        let path = Path::new(file_path);
        let tagged_file = read_from_path(path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        let mut metadata = AudioMetadata::default();

        // Extract tag metadata
        if let Some(tag) = tagged_file.primary_tag().or_else(|| tagged_file.first_tag()) {
            self.extract_tags(tag, &mut metadata);
            self.extract_cover_art(tag, &mut metadata);
        }

        // Extract audio properties
        if let Some(properties) = tagged_file.properties() {
            self.extract_properties(properties, &mut metadata);
        }

        Ok(metadata)
    }

    fn extract_tags(&self, tag: &lofty::Tag, metadata: &mut AudioMetadata) {
        metadata.title = tag.title().map(|s| s.to_string());
        metadata.artist = tag.artist().map(|s| s.to_string());
        metadata.album = tag.album().map(|s| s.to_string());
        metadata.album_artist = tag.get_string(&ItemKey::AlbumArtist).map(|s| s.to_string());
        metadata.year = tag.year();
        metadata.genre = tag.genre().map(|s| s.to_string());
        metadata.track_number = tag.track();
    }

    fn extract_cover_art(&self, tag: &lofty::Tag, metadata: &mut AudioMetadata) {
        if let Some(pictures) = tag.pictures() {
            if let Some(picture) = pictures.first() {
                let base64_image = base64::Engine::encode(
                    &base64::engine::general_purpose::STANDARD,
                    picture.data(),
                );
                let mime_type = picture.mime_type()
                    .map(|m| m.as_str())
                    .unwrap_or("image/jpeg");
                metadata.cover_art = Some(format!("data:{};base64,{}", mime_type, base64_image));
            }
        }
    }

    fn extract_properties(&self, properties: &lofty::properties::FileProperties, metadata: &mut AudioMetadata) {
        metadata.duration = Some(properties.duration().as_secs_f64());
        metadata.bitrate = properties.audio_bitrate();
        metadata.sample_rate = properties.sample_rate();
    }
}

impl Default for MetadataExtractor {
    fn default() -> Self {
        Self::new()
    }
}
