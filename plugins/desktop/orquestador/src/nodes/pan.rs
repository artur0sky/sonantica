use espectro::{AudioNode, AudioBuffer, NodeMetadata, NodeCategory, ParameterDescriptor, Result, GraphError};
use std::f32::consts::FRAC_PI_4;

/// Stereo panning node
/// 
/// Implements constant-power panning for smooth stereo imaging.
/// Can be used standalone or as part of a ChannelStripNode.
pub struct PanNode {
    id: String,
    pan: f32,  // -1.0 (left) to 1.0 (right)
}

impl PanNode {
    /// Create a new pan node
    /// 
    /// # Arguments
    /// * `id` - Unique identifier
    pub fn new(id: String) -> Self {
        Self {
            id,
            pan: 0.0,  // Center
        }
    }
    
    /// Calculate constant-power pan gains
    fn calculate_gains(&self) -> (f32, f32) {
        // Constant power panning
        let pan_angle = (self.pan + 1.0) * FRAC_PI_4;  // 0 to PI/2
        let left_gain = pan_angle.cos();
        let right_gain = pan_angle.sin();
        (left_gain, right_gain)
    }
}

impl AudioNode for PanNode {
    fn id(&self) -> &str {
        &self.id
    }
    
    fn metadata(&self) -> NodeMetadata {
        NodeMetadata {
            name: "Pan".to_string(),
            category: NodeCategory::Routing,
            input_channels: 2,
            output_channels: 2,
            parameters: vec![
                ParameterDescriptor::new(
                    "pan",
                    -1.0,
                    1.0,
                    0.0,
                    "",
                    "Pan"
                ),
            ],
            plugin: "orquestador".to_string(),
        }
    }
    
    fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer> {
        let mut output = input.clone();
        let (left_gain, right_gain) = self.calculate_gains();
        
        // Apply panning to stereo samples
        for i in (0..output.samples.len()).step_by(2) {
            let left = output.samples[i];
            let right = output.samples[i + 1];
            
            output.samples[i] = left * left_gain;
            output.samples[i + 1] = right * right_gain;
        }
        
        Ok(output)
    }
    
    fn set_parameter(&mut self, name: &str, value: f32) -> Result<()> {
        match name {
            "pan" => {
                self.pan = value.clamp(-1.0, 1.0);
                Ok(())
            }
            _ => Err(GraphError::ParameterNotFound(name.to_string())),
        }
    }
    
    fn get_parameter(&self, name: &str) -> Option<f32> {
        match name {
            "pan" => Some(self.pan),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_pan_center() {
        let mut node = PanNode::new("pan1".to_string());
        
        let mut input = AudioBuffer::new(2, 48000, 4);
        input.samples = vec![1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
        
        let output = node.process(&input).unwrap();
        
        // Center pan should preserve equal levels
        assert!((output.samples[0] - output.samples[1]).abs() < 0.01);
    }
    
    #[test]
    fn test_pan_left() {
        let mut node = PanNode::new("pan1".to_string());
        node.set_parameter("pan", -1.0).unwrap();  // Full left
        
        let mut input = AudioBuffer::new(2, 48000, 2);
        input.samples = vec![1.0, 1.0, 1.0, 1.0];
        
        let output = node.process(&input).unwrap();
        
        // Left should be louder than right
        assert!(output.samples[0] > output.samples[1]);
    }
    
    #[test]
    fn test_pan_right() {
        let mut node = PanNode::new("pan1".to_string());
        node.set_parameter("pan", 1.0).unwrap();  // Full right
        
        let mut input = AudioBuffer::new(2, 48000, 2);
        input.samples = vec![1.0, 1.0, 1.0, 1.0];
        
        let output = node.process(&input).unwrap();
        
        // Right should be louder than left
        assert!(output.samples[1] > output.samples[0]);
    }
}
