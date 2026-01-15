use std::fs;
use std::path::Path;
use tauri::{Emitter, WebviewWindow};
use crate::models::ScanProgress;
use crate::services::SecurityValidator;

/// File scanner service - responsible for recursively scanning directories for audio files
pub struct FileScanner {
    audio_extensions: Vec<&'static str>,
    max_files_per_scan: usize,
}

impl FileScanner {
    /// Maximum number of files to scan in one operation (prevent DoS)
    const DEFAULT_MAX_FILES: usize = 10000;

    pub fn new() -> Self {
        Self {
            audio_extensions: vec!["mp3", "flac", "m4a", "aac", "ogg", "opus", "wav", "aiff"],
            max_files_per_scan: Self::DEFAULT_MAX_FILES,
        }
    }

    /// Scan directory recursively for audio files with security validation
    pub fn scan_directory(
        &self,
        path: &Path,
        window: &WebviewWindow,
    ) -> Result<Vec<String>, String> {
        // Validate directory before scanning
        SecurityValidator::validate_directory(path)?;

        let mut audio_files = Vec::new();
        self.scan_recursive(path, &mut audio_files, window)?;
        
        // Emit completion event
        let _ = window.emit("scan-complete", ScanProgress::completed(audio_files.len()));
        
        Ok(audio_files)
    }

    fn scan_recursive(
        &self,
        dir: &Path,
        files: &mut Vec<String>,
        window: &WebviewWindow,
    ) -> Result<(), String> {
        // Check scan limit
        if files.len() >= self.max_files_per_scan {
            return Err(format!(
                "Maximum file limit reached ({} files). Please scan smaller directories.",
                self.max_files_per_scan
            ));
        }

        if !dir.is_dir() {
            return Ok(());
        }

        let entries = fs::read_dir(dir).map_err(|e| {
            eprintln!("Failed to read directory {:?}: {}", dir, e);
            format!("Failed to read directory: {}", e)
        })?;

        for entry in entries {
            let entry = match entry {
                Ok(e) => e,
                Err(e) => {
                    eprintln!("Failed to read entry: {}", e);
                    continue; // Skip problematic entries
                }
            };

            let path = entry.path();

            if path.is_dir() {
                // Recursively scan subdirectories with error handling
                if let Err(e) = self.scan_recursive(&path, files, window) {
                    eprintln!("Error scanning subdirectory {:?}: {}", path, e);
                    // Continue scanning other directories
                    continue;
                }
            } else if path.is_file() {
                if self.is_audio_file(&path) {
                    // Validate file before adding
                    match SecurityValidator::validate_audio_file(&path) {
                        Ok(_) => {
                            if let Some(path_str) = path.to_str() {
                                files.push(path_str.to_string());

                                // Emit progress every 10 files
                                if files.len() % 10 == 0 {
                                    let _ = window.emit(
                                        "scan-progress",
                                        ScanProgress::new(files.len(), 0, path_str.to_string()),
                                    );
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("Skipping invalid file {:?}: {}", path, e);
                            // Skip invalid files but continue scanning
                        }
                    }
                }
            }
        }

        Ok(())
    }

    fn is_audio_file(&self, path: &Path) -> bool {
        if let Some(ext) = path.extension() {
            if let Some(ext_str) = ext.to_str() {
                return self.audio_extensions.contains(&ext_str.to_lowercase().as_str());
            }
        }
        false
    }
}

impl Default for FileScanner {
    fn default() -> Self {
        Self::new()
    }
}
