/// Folder selection command
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn select_folder(app_handle: AppHandle) -> Result<Option<String>, String> {
    let folder = app_handle.dialog().file().blocking_pick_folder();

    match folder {
        Some(path) => {
            let path_str = path.to_string();
            Ok(Some(path_str))
        }
        None => Ok(None),
    }
}
