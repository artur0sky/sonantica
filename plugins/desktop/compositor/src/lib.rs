//! Compositor Plugin for Sonántica
//! 
//! DAW-like audio editing and mixing capabilities:
//! - Multi-track timeline
//! - Audio effects (EQ, compressor, reverb)
//! - Recording and playback
//! - Export/render

pub mod nodes;
pub mod core;
pub mod effects;

pub use nodes::*;
