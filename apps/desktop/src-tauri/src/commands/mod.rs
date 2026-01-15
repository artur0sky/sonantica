pub mod app;
pub mod folder;
pub mod scanner;
pub mod metadata;

pub use app::{exit_app, hide_window};
pub use folder::select_folder;
pub use scanner::scan_directory;
pub use metadata::extract_metadata;
