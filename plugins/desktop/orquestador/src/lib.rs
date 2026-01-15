//! Orquestador Plugin for Sonántica
//! 
//! Multi-channel audio routing and mixing:
//! - Channel strips (volume, pan, mute, solo)
//! - Routing matrix (N×M)
//! - Buses and submixes
//! - Real-time metering

pub mod nodes;
pub mod core;

pub use nodes::*;
