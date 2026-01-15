use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioMetadata {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub album_artist: Option<String>,
    pub year: Option<u32>,
    pub genre: Option<String>,
    pub track_number: Option<u32>,
    pub duration: Option<f64>,
    pub cover_art: Option<String>,
    pub bitrate: Option<u32>,
    pub sample_rate: Option<u32>,
    pub lyrics: Option<String>,
}

impl Default for AudioMetadata {
    fn default() -> Self {
        Self {
            title: None,
            artist: None,
            album: None,
            album_artist: None,
            year: None,
            genre: None,
            track_number: None,
            duration: None,
            cover_art: None,
            bitrate: None,
            sample_rate: None,
            lyrics: None,
        }
    }
}
