// Sonantica Desktop - Tauri Backend
// Clean architecture with separated concerns following SOLID principles

mod commands;
mod models;
mod services;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};

use commands::{exit_app, hide_window, select_folder, scan_directory, extract_metadata};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Initialize plugins
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        // Setup system tray and window behavior
        .setup(setup_app)
        // Handle window events
        .on_window_event(handle_window_event)
        // Register commands
        .invoke_handler(tauri::generate_handler![
            exit_app,
            hide_window,
            select_folder,
            scan_directory,
            extract_metadata
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Setup application with system tray
fn setup_app(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let show_i = MenuItem::with_id(app, "show", "Show Sonántica", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(handle_tray_menu_event)
        .on_tray_icon_event(handle_tray_icon_event)
        .build(app)?;

    Ok(())
}

/// Handle system tray menu events
fn handle_tray_menu_event(app: &tauri::AppHandle, event: tauri::menu::MenuEvent) {
    match event.id.as_ref() {
        "quit" => app.exit(0),
        "show" => show_main_window(app),
        _ => {}
    }
}

/// Handle system tray icon events (clicks)
fn handle_tray_icon_event(tray: &tauri::tray::TrayIcon, event: tauri::tray::TrayIconEvent) {
    if let TrayIconEvent::Click {
        button: tauri::tray::MouseButton::Left,
        ..
    } = event
    {
        show_main_window(tray.app_handle());
    }
}

/// Handle window events
fn handle_window_event(window: &tauri::Window, event: &WindowEvent) {
    if let WindowEvent::CloseRequested { api, .. } = event {
        let _ = window.emit("close-requested", ());
        api.prevent_close();
    }
}

/// Show and focus main window
fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}
