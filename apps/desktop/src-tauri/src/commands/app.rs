/// Application lifecycle commands
use tauri::{AppHandle, WebviewWindow};

#[tauri::command]
pub fn exit_app(app_handle: AppHandle) {
    app_handle.exit(0);
}

#[tauri::command]
pub fn hide_window(window: WebviewWindow) {
    let _ = window.hide();
}
