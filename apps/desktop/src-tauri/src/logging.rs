// Logging Infrastructure - Structured logging setup
// Mirrors the Python services logging architecture (JSON/Pretty formatters)

use std::env;
use std::fs;
use std::path::PathBuf;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

/// Initialize structured logging for the Tauri application
/// Follows the same pattern as Python services:
/// - JSON format for production/file logging
/// - Pretty format for development/console logging
/// - Configurable via environment variables
pub fn init_logging() {
    // Determine log directory (fallback to user's local data dir)
    let log_dir = get_log_directory();
    
    // Ensure log directory exists
    if let Err(e) = fs::create_dir_all(&log_dir) {
        eprintln!("Failed to create log directory: {}", e);
    }

    // Get log level from environment (default: INFO)
    let log_level = env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string());
    
    // Get log format from environment (default: json for production)
    let log_format = env::var("LOG_FORMAT").unwrap_or_else(|_| "json".to_string());

    // Build the filter
    let filter = EnvFilter::try_from_default_env()
        .or_else(|_| EnvFilter::try_new(&log_level))
        .unwrap_or_else(|_| EnvFilter::new("info"));

    // File appender for persistent logs
    let log_file = log_dir.join("sonantica-desktop.log");
    let file_appender = tracing_appender::rolling::daily(log_dir, "sonantica-desktop.log");
    
    if log_format.to_lowercase() == "json" {
        // JSON format (production)
        let file_layer = fmt::layer()
            .json()
            .with_writer(file_appender)
            .with_target(true)
            .with_thread_ids(true)
            .with_file(true)
            .with_line_number(true);

        let console_layer = fmt::layer()
            .json()
            .with_target(true)
            .with_thread_ids(true);

        tracing_subscriber::registry()
            .with(filter)
            .with(file_layer)
            .with(console_layer)
            .init();
    } else {
        // Pretty format (development)
        let file_layer = fmt::layer()
            .with_writer(file_appender)
            .with_target(true)
            .with_thread_ids(true)
            .with_file(true)
            .with_line_number(true);

        let console_layer = fmt::layer()
            .pretty()
            .with_target(true)
            .with_thread_ids(true);

        tracing_subscriber::registry()
            .with(filter)
            .with(file_layer)
            .with(console_layer)
            .init();
    }

    tracing::info!(
        log_level = %log_level,
        log_format = %log_format,
        log_file = %log_file.display(),
        "Logging initialized"
    );
}

/// Get the appropriate log directory for the platform
fn get_log_directory() -> PathBuf {
    // Try to use a system log directory first
    #[cfg(target_os = "windows")]
    {
        // Windows: Use LocalAppData/Sonantica/logs
        if let Ok(local_app_data) = env::var("LOCALAPPDATA") {
            return PathBuf::from(local_app_data).join("Sonantica").join("logs");
        }
    }

    #[cfg(target_os = "macos")]
    {
        // macOS: Use ~/Library/Logs/Sonantica
        if let Ok(home) = env::var("HOME") {
            return PathBuf::from(home).join("Library").join("Logs").join("Sonantica");
        }
    }

    #[cfg(target_os = "linux")]
    {
        // Linux: Try /var/log/sonantica first (like Python services)
        let system_log = PathBuf::from("/var/log/sonantica");
        if system_log.exists() || fs::create_dir_all(&system_log).is_ok() {
            return system_log;
        }
        
        // Fallback to ~/.local/share/sonantica/logs
        if let Ok(home) = env::var("HOME") {
            return PathBuf::from(home).join(".local").join("share").join("sonantica").join("logs");
        }
    }

    // Ultimate fallback: current directory
    PathBuf::from("./logs")
}
