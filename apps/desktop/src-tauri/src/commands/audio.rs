// Audio Commands - Tauri interface for audio operations
// Exposes audio device management to the frontend

use crate::services::{AudioDevice, DeviceManager};

/// Get all available audio devices (inputs and outputs)
#[tauri::command]
pub fn get_audio_devices() -> Result<Vec<AudioDevice>, String> {
    let manager = DeviceManager::new();
    manager
        .list_devices()
        .map_err(|e| format!("Failed to enumerate audio devices: {}", e))
}

/// Get the default input device
#[tauri::command]
pub fn get_default_input_device() -> Result<Option<AudioDevice>, String> {
    let manager = DeviceManager::new();
    manager
        .default_input_device()
        .map_err(|e| format!("Failed to get default input device: {}", e))
}

/// Get the default output device
#[tauri::command]
pub fn get_default_output_device() -> Result<Option<AudioDevice>, String> {
    let manager = DeviceManager::new();
    manager
        .default_output_device()
        .map_err(|e| format!("Failed to get default output device: {}", e))
}
