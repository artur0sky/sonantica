/// Metadata extraction command
use crate::models::AudioMetadata;
use crate::services::MetadataExtractor;

#[tauri::command]
pub async fn extract_metadata(file_path: String) -> Result<AudioMetadata, String> {
    let extractor = MetadataExtractor::new();
    extractor.extract(&file_path)
}
