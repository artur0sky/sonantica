use std::fs;
use std::path::Path;
use tauri::{Emitter, WebviewWindow};
use crate::models::ScanProgress;

/// File scanner service - responsible for recursively scanning directories for audio files
pub struct FileScanner {
    audio_extensions: Vec<&'static str>,
}

impl FileScanner {
    pub fn new() -> Self {
        Self {
            audio_extensions: vec!["mp3", "flac", "m4a", "aac", "ogg", "opus", "wav", "aiff"],
        }
    }

    /// Scan directory recursively for audio files
    pub fn scan_directory(
        &self,
        path: &Path,
        window: &WebviewWindow,
    ) -> Result<Vec<String>, String> {
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
        if !dir.is_dir() {
            return Ok(());
        }

        let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;

        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();

            if path.is_dir() {
                self.scan_recursive(&path, files, window)?;
            } else if path.is_file() {
                if self.is_audio_file(&path) {
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
