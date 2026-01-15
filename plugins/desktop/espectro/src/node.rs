use crate::{AudioBuffer, Result};
use serde::{Deserialize, Serialize};

/// Category of audio node
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum NodeCategory {
    /// Input source (microphone, file player, etc.)
    Source,
    
    /// Audio effect (EQ, compressor, reverb, etc.)
    Effect,
    
    /// Routing/mixing (splitter, merger, router, etc.)
    Routing,
    
    /// Output sink (speakers, file recorder, etc.)
    Sink,
}

/// Parameter descriptor for a node
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ParameterDescriptor {
    /// Parameter name (e.g., "gain", "frequency", "threshold")
    pub name: String,
    
    /// Minimum value
    pub min: f32,
    
    /// Maximum value
    pub max: f32,
    
    /// Default value
    pub default: f32,
    
    /// Unit of measurement (e.g., "dB", "Hz", "%", "ms")
    pub unit: String,
    
    /// Human-readable label
    pub label: String,
}

impl ParameterDescriptor {
    /// Create a new parameter descriptor
    pub fn new(name: &str, min: f32, max: f32, default: f32, unit: &str, label: &str) -> Self {
        Self {
            name: name.to_string(),
            min,
            max,
            default,
            unit: unit.to_string(),
            label: label.to_string(),
        }
    }
    
    /// Clamp a value to the parameter's range
    pub fn clamp(&self, value: f32) -> f32 {
        value.clamp(self.min, self.max)
    }
}

/// Metadata describing a node's capabilities
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct NodeMetadata {
    /// Human-readable name
    pub name: String,
    
    /// Node category
    pub category: NodeCategory,
    
    /// Number of input channels
    pub input_channels: usize,
    
    /// Number of output channels
    pub output_channels: usize,
    
    /// Available parameters
    pub parameters: Vec<ParameterDescriptor>,
    
    /// Plugin that provides this node (e.g., "compositor", "orquestador")
    pub plugin: String,
}

/// Base trait for all audio processing nodes
/// 
/// This trait enables plugin interoperability by providing a common interface
/// for all audio processing nodes, regardless of which plugin they come from.
pub trait AudioNode: Send + Sync {
    /// Unique node identifier
    fn id(&self) -> &str;
    
    /// Node metadata
    fn metadata(&self) -> NodeMetadata;
    
    /// Process audio (in-place or return new buffer)
    /// 
    /// # Arguments
    /// * `input` - Input audio buffer
    /// 
    /// # Returns
    /// Processed audio buffer
    fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer>;
    
    /// Handle parameter changes from UI
    /// 
    /// # Arguments
    /// * `name` - Parameter name
    /// * `value` - New parameter value
    fn set_parameter(&mut self, name: &str, value: f32) -> Result<()>;
    
    /// Get current parameter value
    /// 
    /// # Arguments
    /// * `name` - Parameter name
    /// 
    /// # Returns
    /// Current parameter value, or None if parameter doesn't exist
    fn get_parameter(&self, name: &str) -> Option<f32>;
    
    /// Latency introduced by this node (in samples)
    /// 
    /// Default implementation returns 0 (no latency)
    fn latency(&self) -> usize {
        0
    }
    
    /// Reset node state (clear buffers, reset filters, etc.)
    fn reset(&mut self) {
        // Default implementation does nothing
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parameter_clamp() {
        let param = ParameterDescriptor::new("gain", -24.0, 24.0, 0.0, "dB", "Gain");
        
        assert_eq!(param.clamp(0.0), 0.0);
        assert_eq!(param.clamp(30.0), 24.0);
        assert_eq!(param.clamp(-30.0), -24.0);
    }
    
    #[test]
    fn test_node_category() {
        let category = NodeCategory::Effect;
        assert_eq!(category, NodeCategory::Effect);
    }
}
