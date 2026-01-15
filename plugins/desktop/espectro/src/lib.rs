//! Audio Graph System for Sonántica
//! 
//! This crate provides the core audio processing graph infrastructure that enables
//! plugin interoperability. Plugins (Compositor, Orquestador) are nodes in this graph
//! that can be connected to form complex audio processing chains.

pub mod buffer;
pub mod node;
pub mod graph;
pub mod connection;
pub mod error;

pub use buffer::AudioBuffer;
pub use node::{AudioNode, NodeMetadata, NodeCategory, ParameterDescriptor};
pub use graph::AudioGraph;
pub use connection::Connection;
pub use error::{GraphError, Result};
