use espectro::{AudioNode, AudioBuffer, NodeMetadata, NodeCategory, ParameterDescriptor, Result, GraphError};

/// Dynamic range compressor node
/// 
/// Reduces the dynamic range of audio by attenuating signals above a threshold.
/// Essential for professional audio production and can work in chains with
/// Orquestador routing nodes.
pub struct CompressorNode {
    id: String,
    threshold_db: f32,
    ratio: f32,
    attack_ms: f32,
    release_ms: f32,
    makeup_gain_db: f32,
    
    // Internal state
    envelope: f32,
    sample_rate: f32,
}

impl CompressorNode {
    /// Create a new compressor node
    pub fn new(id: String) -> Self {
        Self {
            id,
            threshold_db: -20.0,
            ratio: 4.0,
            attack_ms: 10.0,
            release_ms: 100.0,
            makeup_gain_db: 0.0,
            envelope: 0.0,
            sample_rate: 48000.0,
        }
    }
    
    fn db_to_linear(db: f32) -> f32 {
        10.0_f32.powf(db / 20.0)
    }
    
    fn linear_to_db(linear: f32) -> f32 {
        20.0 * linear.max(0.0001).log10()
    }
}

impl AudioNode for CompressorNode {
    fn id(&self) -> &str {
        &self.id
    }
    
    fn metadata(&self) -> NodeMetadata {
        NodeMetadata {
            name: "Compressor".to_string(),
            category: NodeCategory::Effect,
            input_channels: 2,
            output_channels: 2,
            parameters: vec![
                ParameterDescriptor::new(
                    "threshold",
                    -60.0,
                    0.0,
                    -20.0,
                    "dB",
                    "Threshold"
                ),
                ParameterDescriptor::new(
                    "ratio",
                    1.0,
                    20.0,
                    4.0,
                    ":1",
                    "Ratio"
                ),
                ParameterDescriptor::new(
                    "attack",
                    0.1,
                    100.0,
                    10.0,
                    "ms",
                    "Attack"
                ),
                ParameterDescriptor::new(
                    "release",
                    10.0,
                    1000.0,
                    100.0,
                    "ms",
                    "Release"
                ),
                ParameterDescriptor::new(
                    "makeup",
                    0.0,
                    24.0,
                    0.0,
                    "dB",
                    "Makeup Gain"
                ),
            ],
            plugin: "compositor".to_string(),
        }
    }
    
    fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer> {
        let mut output = input.clone();
        
        let attack_coeff = (-1.0 / (self.attack_ms * self.sample_rate / 1000.0)).exp();
        let release_coeff = (-1.0 / (self.release_ms * self.sample_rate / 1000.0)).exp();
        let threshold_linear = Self::db_to_linear(self.threshold_db);
        let makeup_linear = Self::db_to_linear(self.makeup_gain_db);
        
        // Process stereo samples
        for i in (0..output.samples.len()).step_by(2) {
            let left = output.samples[i];
            let right = output.samples[i + 1];
            
            // Peak detection (max of left and right)
            let peak = left.abs().max(right.abs());
            
            // Envelope follower
            let coeff = if peak > self.envelope { attack_coeff } else { release_coeff };
            self.envelope = peak + coeff * (self.envelope - peak);
            
            // Gain reduction calculation
            let gain_reduction = if self.envelope > threshold_linear {
                let over_db = Self::linear_to_db(self.envelope) - self.threshold_db;
                let compressed_db = over_db / self.ratio;
                let reduction_db = over_db - compressed_db;
                Self::db_to_linear(-reduction_db)
            } else {
                1.0
            };
            
            // Apply gain reduction and makeup gain
            output.samples[i] = left * gain_reduction * makeup_linear;
            output.samples[i + 1] = right * gain_reduction * makeup_linear;
        }
        
        Ok(output)
    }
    
    fn set_parameter(&mut self, name: &str, value: f32) -> Result<()> {
        match name {
            "threshold" => self.threshold_db = value.clamp(-60.0, 0.0),
            "ratio" => self.ratio = value.clamp(1.0, 20.0),
            "attack" => self.attack_ms = value.clamp(0.1, 100.0),
            "release" => self.release_ms = value.clamp(10.0, 1000.0),
            "makeup" => self.makeup_gain_db = value.clamp(0.0, 24.0),
            _ => return Err(GraphError::ParameterNotFound(name.to_string())),
        }
        Ok(())
    }
    
    fn get_parameter(&self, name: &str) -> Option<f32> {
        match name {
            "threshold" => Some(self.threshold_db),
            "ratio" => Some(self.ratio),
            "attack" => Some(self.attack_ms),
            "release" => Some(self.release_ms),
            "makeup" => Some(self.makeup_gain_db),
            _ => None,
        }
    }
    
    fn reset(&mut self) {
        self.envelope = 0.0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_compressor_creation() {
        let comp = CompressorNode::new("comp1".to_string());
        assert_eq!(comp.id(), "comp1");
        assert_eq!(comp.get_parameter("threshold"), Some(-20.0));
        assert_eq!(comp.get_parameter("ratio"), Some(4.0));
    }
    
    #[test]
    fn test_compressor_parameters() {
        let mut comp = CompressorNode::new("comp1".to_string());
        
        comp.set_parameter("threshold", -10.0).unwrap();
        assert_eq!(comp.get_parameter("threshold"), Some(-10.0));
        
        comp.set_parameter("ratio", 8.0).unwrap();
        assert_eq!(comp.get_parameter("ratio"), Some(8.0));
    }
}
