/// Directory scanning command
use std::path::PathBuf;
use tauri::WebviewWindow;
use crate::services::FileScanner;

#[tauri::command]
pub async fn scan_directory(
    path: String,
    window: WebviewWindow,
) -> Result<Vec<String>, String> {
    let path_buf = PathBuf::from(&path);
    let scanner = FileScanner::new();
    scanner.scan_directory(&path_buf, &window)
}
