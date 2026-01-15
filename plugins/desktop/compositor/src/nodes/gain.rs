use espectro::{AudioNode, AudioBuffer, NodeMetadata, NodeCategory, ParameterDescriptor, Result, GraphError};

/// Simple gain node for volume control
/// 
/// This is a basic building block that can be used standalone or as part
/// of more complex processing chains.
pub struct GainNode {
    id: String,
    gain_db: f32,  // Gain in decibels
    gain_linear: f32,  // Cached linear gain
}

impl GainNode {
    /// Create a new gain node
    /// 
    /// # Arguments
    /// * `id` - Unique identifier for this node
    pub fn new(id: String) -> Self {
        Self {
            id,
            gain_db: 0.0,
            gain_linear: 1.0,
        }
    }
    
    /// Convert dB to linear gain
    fn db_to_linear(db: f32) -> f32 {
        10.0_f32.powf(db / 20.0)
    }
    
    /// Update linear gain from dB value
    fn update_gain(&mut self) {
        self.gain_linear = Self::db_to_linear(self.gain_db);
    }
}

impl AudioNode for GainNode {
    fn id(&self) -> &str {
        &self.id
    }
    
    fn metadata(&self) -> NodeMetadata {
        NodeMetadata {
            name: "Gain".to_string(),
            category: NodeCategory::Effect,
            input_channels: 2,
            output_channels: 2,
            parameters: vec![
                ParameterDescriptor::new(
                    "gain",
                    -60.0,
                    24.0,
                    0.0,
                    "dB",
                    "Gain"
                ),
            ],
            plugin: "compositor".to_string(),
        }
    }
    
    fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer> {
        let mut output = input.clone();
        output.apply_gain(self.gain_linear);
        Ok(output)
    }
    
    fn set_parameter(&mut self, name: &str, value: f32) -> Result<()> {
        match name {
            "gain" => {
                self.gain_db = value.clamp(-60.0, 24.0);
                self.update_gain();
                Ok(())
            }
            _ => Err(GraphError::ParameterNotFound(name.to_string())),
        }
    }
    
    fn get_parameter(&self, name: &str) -> Option<f32> {
        match name {
            "gain" => Some(self.gain_db),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_gain_node() {
        let mut node = GainNode::new("gain1".to_string());
        
        // Test 0 dB (unity gain)
        assert_eq!(node.get_parameter("gain"), Some(0.0));
        assert!((node.gain_linear - 1.0).abs() < 0.001);
        
        // Test +6 dB (2x gain)
        node.set_parameter("gain", 6.0).unwrap();
        assert!((node.gain_linear - 2.0).abs() < 0.01);
        
        // Test -6 dB (0.5x gain)
        node.set_parameter("gain", -6.0).unwrap();
        assert!((node.gain_linear - 0.5).abs() < 0.01);
    }
    
    #[test]
    fn test_gain_processing() {
        let mut node = GainNode::new("gain1".to_string());
        node.set_parameter("gain", 6.0).unwrap(); // +6 dB
        
        let mut input = AudioBuffer::new(2, 48000, 4);
        input.samples = vec![0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
        
        let output = node.process(&input).unwrap();
        
        // Should be approximately doubled
        assert!((output.samples[0] - 1.0).abs() < 0.1);
    }
}
