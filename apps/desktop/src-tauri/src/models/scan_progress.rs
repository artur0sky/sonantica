use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanProgress {
    pub current: usize,
    pub total: usize,
    pub current_file: String,
}

impl ScanProgress {
    pub fn new(current: usize, total: usize, current_file: String) -> Self {
        Self {
            current,
            total,
            current_file,
        }
    }

    pub fn completed(total: usize) -> Self {
        Self {
            current: total,
            total,
            current_file: String::new(),
        }
    }
}
