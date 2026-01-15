// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[tauri::command]
fn exit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

#[tauri::command]
fn hide_window(window: tauri::WebviewWindow) {
    let _ = window.hide();
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ScanProgress {
    current: usize,
    total: usize,
    current_file: String,
}

/// Open folder picker dialog and return selected path
#[tauri::command]
async fn select_folder(app_handle: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    
    let folder = app_handle
        .dialog()
        .file()
        .blocking_pick_folder();
    
    match folder {
        Some(path) => {
            // Convert FilePath to String
            let path_str = path.to_string();
            Ok(Some(path_str))
        },
        None => Ok(None),
    }
}

/// Get list of audio files in a directory (recursive)
#[tauri::command]
async fn scan_directory(
    path: String,
    window: tauri::WebviewWindow,
) -> Result<Vec<String>, String> {
    use std::fs;
    use std::path::Path;
    
    let audio_extensions = vec!["mp3", "flac", "m4a", "aac", "ogg", "opus", "wav", "aiff"];
    let mut audio_files = Vec::new();
    
    fn scan_dir_recursive(
        dir: &Path,
        extensions: &[&str],
        files: &mut Vec<String>,
        window: &tauri::WebviewWindow,
    ) -> Result<(), String> {
        if !dir.is_dir() {
            return Ok(());
        }
        
        let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
        
        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            
            if path.is_dir() {
                // Recursively scan subdirectories
                scan_dir_recursive(&path, extensions, files, window)?;
            } else if path.is_file() {
                // Check if file has audio extension
                if let Some(ext) = path.extension() {
                    if let Some(ext_str) = ext.to_str() {
                        if extensions.contains(&ext_str.to_lowercase().as_str()) {
                            if let Some(path_str) = path.to_str() {
                                files.push(path_str.to_string());
                                
                                // Emit progress event every 10 files
                                if files.len() % 10 == 0 {
                                    let _ = window.emit("scan-progress", ScanProgress {
                                        current: files.len(),
                                        total: 0, // Unknown until complete
                                        current_file: path_str.to_string(),
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        
        Ok(())
    }
    
    let path_buf = PathBuf::from(&path);
    scan_dir_recursive(&path_buf, &audio_extensions, &mut audio_files, &window)?;
    
    // Emit completion event
    let _ = window.emit("scan-complete", ScanProgress {
        current: audio_files.len(),
        total: audio_files.len(),
        current_file: String::new(),
    });
    
    Ok(audio_files)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show Sonántica", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // We emit an event to the frontend
                let _ = window.emit("close-requested", ());
                // We prevent the window from closing by default
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            exit_app,
            hide_window,
            select_folder,
            scan_directory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
