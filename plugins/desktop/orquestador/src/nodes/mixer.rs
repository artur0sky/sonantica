use espectro::{AudioNode, AudioBuffer, NodeMetadata, NodeCategory, Result};

/// Mixer node that combines multiple inputs
/// 
/// This node demonstrates how the audio graph system enables multiple
/// connections to flow into a single node, essential for mixing scenarios.
pub struct MixerNode {
    id: String,
    num_inputs: usize,
}

impl MixerNode {
    /// Create a new mixer node
    /// 
    /// # Arguments
    /// * `id` - Unique identifier
    /// * `num_inputs` - Expected number of inputs (for metadata)
    pub fn new(id: String, num_inputs: usize) -> Self {
        Self {
            id,
            num_inputs,
        }
    }
}

impl AudioNode for MixerNode {
    fn id(&self) -> &str {
        &self.id
    }
    
    fn metadata(&self) -> NodeMetadata {
        NodeMetadata {
            name: format!("{}-Input Mixer", self.num_inputs),
            category: NodeCategory::Routing,
            input_channels: 2,
            output_channels: 2,
            parameters: vec![],  // Mixer has no parameters, just sums inputs
            plugin: "orquestador".to_string(),
        }
    }
    
    fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer> {
        // The audio graph system handles mixing multiple inputs before
        // calling this function, so we just pass through the mixed result
        Ok(input.clone())
    }
    
    fn set_parameter(&mut self, _name: &str, _value: f32) -> Result<()> {
        // No parameters
        Ok(())
    }
    
    fn get_parameter(&self, _name: &str) -> Option<f32> {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_mixer_creation() {
        let mixer = MixerNode::new("mixer1".to_string(), 4);
        assert_eq!(mixer.id(), "mixer1");
        assert_eq!(mixer.num_inputs, 4);
    }
    
    #[test]
    fn test_mixer_passthrough() {
        let mut mixer = MixerNode::new("mixer1".to_string(), 2);
        
        let input = AudioBuffer::new(2, 48000, 512);
        let output = mixer.process(&input).unwrap();
        
        assert_eq!(output.channels, input.channels);
        assert_eq!(output.sample_rate, input.sample_rate);
        assert_eq!(output.samples.len(), input.samples.len());
    }
}
