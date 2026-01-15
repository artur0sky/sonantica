use espectro::{AudioNode, AudioBuffer, NodeMetadata, NodeCategory, ParameterDescriptor, Result, GraphError};
use std::f32::consts::FRAC_PI_4;

/// Channel strip node combining volume, pan, mute, and solo
/// 
/// This is a key component of the Orquestador plugin that demonstrates
/// how multiple processing functions can be combined in a single node.
/// It can work in conjunction with Compositor effects nodes.
pub struct ChannelStripNode {
    id: String,
    gain_db: f32,
    gain_linear: f32,
    pan: f32,
    mute: bool,
    solo: bool,
}

impl ChannelStripNode {
    /// Create a new channel strip node
    pub fn new(id: String) -> Self {
        Self {
            id,
            gain_db: 0.0,
            gain_linear: 1.0,
            pan: 0.0,
            mute: false,
            solo: false,
        }
    }
    
    fn db_to_linear(db: f32) -> f32 {
        10.0_f32.powf(db / 20.0)
    }
    
    fn update_gain(&mut self) {
        self.gain_linear = Self::db_to_linear(self.gain_db);
    }
    
    fn calculate_pan_gains(&self) -> (f32, f32) {
        let pan_angle = (self.pan + 1.0) * FRAC_PI_4;
        (pan_angle.cos(), pan_angle.sin())
    }
}

impl AudioNode for ChannelStripNode {
    fn id(&self) -> &str {
        &self.id
    }
    
    fn metadata(&self) -> NodeMetadata {
        NodeMetadata {
            name: "Channel Strip".to_string(),
            category: NodeCategory::Routing,
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
                ParameterDescriptor::new(
                    "pan",
                    -1.0,
                    1.0,
                    0.0,
                    "",
                    "Pan"
                ),
                ParameterDescriptor::new(
                    "mute",
                    0.0,
                    1.0,
                    0.0,
                    "",
                    "Mute"
                ),
                ParameterDescriptor::new(
                    "solo",
                    0.0,
                    1.0,
                    0.0,
                    "",
                    "Solo"
                ),
            ],
            plugin: "orquestador".to_string(),
        }
    }
    
    fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer> {
        // If muted, return silence
        if self.mute {
            return Ok(AudioBuffer::silence(input.channels, input.sample_rate, input.num_frames()));
        }
        
        let mut output = input.clone();
        let (left_pan, right_pan) = self.calculate_pan_gains();
        
        // Apply gain and pan
        for i in (0..output.samples.len()).step_by(2) {
            let left = output.samples[i];
            let right = output.samples[i + 1];
            
            output.samples[i] = left * self.gain_linear * left_pan;
            output.samples[i + 1] = right * self.gain_linear * right_pan;
        }
        
        Ok(output)
    }
    
    fn set_parameter(&mut self, name: &str, value: f32) -> Result<()> {
        match name {
            "gain" => {
                self.gain_db = value.clamp(-60.0, 24.0);
                self.update_gain();
            }
            "pan" => {
                self.pan = value.clamp(-1.0, 1.0);
            }
            "mute" => {
                self.mute = value > 0.5;
            }
            "solo" => {
                self.solo = value > 0.5;
            }
            _ => return Err(GraphError::ParameterNotFound(name.to_string())),
        }
        Ok(())
    }
    
    fn get_parameter(&self, name: &str) -> Option<f32> {
        match name {
            "gain" => Some(self.gain_db),
            "pan" => Some(self.pan),
            "mute" => Some(if self.mute { 1.0 } else { 0.0 }),
            "solo" => Some(if self.solo { 1.0 } else { 0.0 }),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_channel_strip_creation() {
        let strip = ChannelStripNode::new("ch1".to_string());
        assert_eq!(strip.id(), "ch1");
        assert_eq!(strip.get_parameter("gain"), Some(0.0));
        assert_eq!(strip.get_parameter("pan"), Some(0.0));
    }
    
    #[test]
    fn test_mute() {
        let mut strip = ChannelStripNode::new("ch1".to_string());
        
        let input = AudioBuffer::new(2, 48000, 4);
        
        // Not muted
        let output1 = strip.process(&input).unwrap();
        assert_eq!(output1.samples.len(), input.samples.len());
        
        // Muted
        strip.set_parameter("mute", 1.0).unwrap();
        let output2 = strip.process(&input).unwrap();
        assert!(output2.samples.iter().all(|&s| s == 0.0));
    }
    
    #[test]
    fn test_gain_and_pan() {
        let mut strip = ChannelStripNode::new("ch1".to_string());
        
        strip.set_parameter("gain", 6.0).unwrap();  // +6 dB
        strip.set_parameter("pan", 0.5).unwrap();   // Pan right
        
        assert_eq!(strip.get_parameter("gain"), Some(6.0));
        assert_eq!(strip.get_parameter("pan"), Some(0.5));
    }
}
