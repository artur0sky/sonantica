use std::path::Path;

/// Security utilities for file validation and sanitization
pub struct SecurityValidator;

impl SecurityValidator {
    /// Maximum file size for audio files (500 MB)
    const MAX_AUDIO_FILE_SIZE: u64 = 500 * 1024 * 1024;
    
    /// Maximum cover art size (10 MB)
    const MAX_COVER_ART_SIZE: usize = 10 * 1024 * 1024;
    
    /// Maximum metadata string length
    const MAX_METADATA_LENGTH: usize = 1000;
    
    /// Allowed audio file extensions
    const ALLOWED_EXTENSIONS: &'static [&'static str] = &[
        "mp3", "flac", "m4a", "aac", "ogg", "opus", "wav", "aiff"
    ];

    /// Validate that a file is a legitimate audio file
    pub fn validate_audio_file(path: &Path) -> Result<(), String> {
        // Check file exists
        if !path.exists() {
            return Err("File does not exist".to_string());
        }

        // Check it's a file, not a directory
        if !path.is_file() {
            return Err("Path is not a file".to_string());
        }

        // Validate extension
        let extension = path
            .extension()
            .and_then(|e| e.to_str())
            .ok_or("Invalid file extension")?
            .to_lowercase();

        if !Self::ALLOWED_EXTENSIONS.contains(&extension.as_str()) {
            return Err(format!("File type '{}' not allowed", extension));
        }

        // Check file size
        let metadata = std::fs::metadata(path)
            .map_err(|e| format!("Failed to read file metadata: {}", e))?;
        
        if metadata.len() > Self::MAX_AUDIO_FILE_SIZE {
            return Err("File size exceeds maximum allowed (500 MB)".to_string());
        }

        // Prevent path traversal
        Self::validate_path_safety(path)?;

        Ok(())
    }

    /// Validate path doesn't contain traversal attempts
    pub fn validate_path_safety(path: &Path) -> Result<(), String> {
        let path_str = path.to_str().ok_or("Invalid path encoding")?;
        
        // Check for path traversal patterns
        if path_str.contains("..") {
            return Err("Path traversal detected".to_string());
        }

        // Ensure path is absolute (safer)
        if !path.is_absolute() {
            return Err("Only absolute paths are allowed".to_string());
        }

        Ok(())
    }

    /// Sanitize metadata string to prevent XSS/injection
    pub fn sanitize_metadata(input: &str) -> String {
        input
            .chars()
            .filter(|c| {
                // Allow alphanumeric, spaces, and common punctuation
                c.is_alphanumeric() 
                || c.is_whitespace()
                || matches!(c, '-' | '_' | '.' | ',' | '\'' | '(' | ')' | '&' | '!' | '?')
            })
            .take(Self::MAX_METADATA_LENGTH)
            .collect()
    }

    /// Validate and limit cover art size
    pub fn validate_cover_art(data: &[u8]) -> Result<(), String> {
        if data.len() > Self::MAX_COVER_ART_SIZE {
            return Err("Cover art exceeds maximum size (10 MB)".to_string());
        }

        // Validate it's actually an image (basic check)
        if data.len() < 4 {
            return Err("Invalid image data".to_string());
        }

        // Check for common image signatures
        let is_valid_image = 
            // JPEG
            (data[0] == 0xFF && data[1] == 0xD8) ||
            // PNG
            (data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47) ||
            // GIF
            (data[0] == 0x47 && data[1] == 0x49 && data[2] == 0x46) ||
            // WebP
            (data[0] == 0x52 && data[1] == 0x49 && data[2] == 0x46 && data[3] == 0x46);

        if !is_valid_image {
            return Err("Invalid image format".to_string());
        }

        Ok(())
    }

    /// Validate directory path for scanning
    pub fn validate_directory(path: &Path) -> Result<(), String> {
        if !path.exists() {
            return Err("Directory does not exist".to_string());
        }

        if !path.is_dir() {
            return Err("Path is not a directory".to_string());
        }

        Self::validate_path_safety(path)?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_sanitize_metadata() {
        assert_eq!(
            SecurityValidator::sanitize_metadata("Artist <script>alert('xss')</script>"),
            "Artist scriptalert'xss'script"
        );
        
        assert_eq!(
            SecurityValidator::sanitize_metadata("Normal Artist Name"),
            "Normal Artist Name"
        );
    }

    #[test]
    fn test_path_traversal_detection() {
        let bad_path = PathBuf::from("../../../etc/passwd");
        assert!(SecurityValidator::validate_path_safety(&bad_path).is_err());
    }
}
