use espectro::{AudioNode, AudioBuffer, NodeMetadata, NodeCategory, ParameterDescriptor, Result, GraphError};
use std::f32::consts::PI;

/// Parametric equalizer node with multiple bands
/// 
/// This node demonstrates more complex audio processing that can work
/// in conjunction with other plugins (e.g., Orquestador routing).
pub struct EqualizerNode {
    id: String,
    bands: Vec<EQBand>,
    sample_rate: f32,
}

struct EQBand {
    frequency: f32,
    gain_db: f32,
    q: f32,
    filter: BiquadFilter,
}

impl EqualizerNode {
    /// Create a new parametric EQ with the specified number of bands
    /// 
    /// # Arguments
    /// * `id` - Unique identifier
    /// * `num_bands` - Number of EQ bands (typically 3, 5, or 10)
    pub fn new(id: String, num_bands: usize) -> Self {
        let default_frequencies = [
            60.0, 170.0, 310.0, 600.0, 1000.0, 
            3000.0, 6000.0, 12000.0, 14000.0, 16000.0
        ];
        
        let mut bands = Vec::new();
        for i in 0..num_bands {
            let freq = if i < default_frequencies.len() {
                default_frequencies[i]
            } else {
                1000.0
            };
            
            bands.push(EQBand {
                frequency: freq,
                gain_db: 0.0,
                q: 1.0,
                filter: BiquadFilter::new(),
            });
        }
        
        Self {
            id,
            bands,
            sample_rate: 48000.0,
        }
    }
    
    /// Update all filter coefficients
    fn update_filters(&mut self) {
        for band in &mut self.bands {
            band.filter.update_peaking_eq(
                band.frequency,
                band.gain_db,
                band.q,
                self.sample_rate,
            );
        }
    }
}

impl AudioNode for EqualizerNode {
    fn id(&self) -> &str {
        &self.id
    }
    
    fn metadata(&self) -> NodeMetadata {
        let mut parameters = Vec::new();
        
        for (i, band) in self.bands.iter().enumerate() {
            parameters.push(ParameterDescriptor::new(
                &format!("band_{}_gain", i),
                -24.0,
                24.0,
                0.0,
                "dB",
                &format!("Band {} Gain ({:.0} Hz)", i + 1, band.frequency),
            ));
            
            parameters.push(ParameterDescriptor::new(
                &format!("band_{}_freq", i),
                20.0,
                20000.0,
                band.frequency,
                "Hz",
                &format!("Band {} Frequency", i + 1),
            ));
            
            parameters.push(ParameterDescriptor::new(
                &format!("band_{}_q", i),
                0.1,
                10.0,
                1.0,
                "",
                &format!("Band {} Q", i + 1),
            ));
        }
        
        NodeMetadata {
            name: format!("{}-Band Parametric EQ", self.bands.len()),
            category: NodeCategory::Effect,
            input_channels: 2,
            output_channels: 2,
            parameters,
            plugin: "compositor".to_string(),
        }
    }
    
    fn process(&mut self, input: &AudioBuffer) -> Result<AudioBuffer> {
        let mut output = input.clone();
        
        // Apply each band sequentially
        for band in &mut self.bands {
            if band.gain_db.abs() > 0.01 {  // Only process if gain is significant
                band.filter.process_stereo(&mut output.samples);
            }
        }
        
        Ok(output)
    }
    
    fn set_parameter(&mut self, name: &str, value: f32) -> Result<()> {
        // Parse parameter name (e.g., "band_0_gain", "band_1_freq")
        let parts: Vec<&str> = name.split('_').collect();
        
        if parts.len() != 3 || parts[0] != "band" {
            return Err(GraphError::ParameterNotFound(name.to_string()));
        }
        
        let band_idx: usize = parts[1].parse()
            .map_err(|_| GraphError::ParameterNotFound(name.to_string()))?;
        
        if band_idx >= self.bands.len() {
            return Err(GraphError::ParameterNotFound(name.to_string()));
        }
        
        let param_type = parts[2];
        let band = &mut self.bands[band_idx];
        
        match param_type {
            "gain" => {
                band.gain_db = value.clamp(-24.0, 24.0);
            }
            "freq" => {
                band.frequency = value.clamp(20.0, 20000.0);
            }
            "q" => {
                band.q = value.clamp(0.1, 10.0);
            }
            _ => return Err(GraphError::ParameterNotFound(name.to_string())),
        }
        
        self.update_filters();
        Ok(())
    }
    
    fn get_parameter(&self, name: &str) -> Option<f32> {
        let parts: Vec<&str> = name.split('_').collect();
        
        if parts.len() != 3 || parts[0] != "band" {
            return None;
        }
        
        let band_idx: usize = parts[1].parse().ok()?;
        
        if band_idx >= self.bands.len() {
            return None;
        }
        
        let band = &self.bands[band_idx];
        
        match parts[2] {
            "gain" => Some(band.gain_db),
            "freq" => Some(band.frequency),
            "q" => Some(band.q),
            _ => None,
        }
    }
    
    fn reset(&mut self) {
        for band in &mut self.bands {
            band.filter.reset();
        }
    }
}

/// Biquad filter implementation (Peaking EQ)
/// Based on RBJ Audio EQ Cookbook
struct BiquadFilter {
    // Filter coefficients
    a0: f32,
    a1: f32,
    a2: f32,
    b1: f32,
    b2: f32,
    
    // State variables (for left channel)
    x1_l: f32,
    x2_l: f32,
    y1_l: f32,
    y2_l: f32,
    
    // State variables (for right channel)
    x1_r: f32,
    x2_r: f32,
    y1_r: f32,
    y2_r: f32,
}

impl BiquadFilter {
    fn new() -> Self {
        Self {
            a0: 1.0,
            a1: 0.0,
            a2: 0.0,
            b1: 0.0,
            b2: 0.0,
            x1_l: 0.0,
            x2_l: 0.0,
            y1_l: 0.0,
            y2_l: 0.0,
            x1_r: 0.0,
            x2_r: 0.0,
            y1_r: 0.0,
            y2_r: 0.0,
        }
    }
    
    fn update_peaking_eq(&mut self, freq: f32, gain_db: f32, q: f32, sample_rate: f32) {
        let w0 = 2.0 * PI * freq / sample_rate;
        let alpha = w0.sin() / (2.0 * q);
        let a = 10.0_f32.powf(gain_db / 40.0);
        
        let b0 = 1.0 + alpha * a;
        let b1 = -2.0 * w0.cos();
        let b2 = 1.0 - alpha * a;
        let a0 = 1.0 + alpha / a;
        let a1 = -2.0 * w0.cos();
        let a2 = 1.0 - alpha / a;
        
        // Normalize
        self.a0 = b0 / a0;
        self.a1 = b1 / a0;
        self.a2 = b2 / a0;
        self.b1 = a1 / a0;
        self.b2 = a2 / a0;
    }
    
    fn process_stereo(&mut self, samples: &mut [f32]) {
        // Process interleaved stereo samples [L, R, L, R, ...]
        for i in (0..samples.len()).step_by(2) {
            // Left channel
            let x_l = samples[i];
            let y_l = self.a0 * x_l + self.a1 * self.x1_l + self.a2 * self.x2_l
                    - self.b1 * self.y1_l - self.b2 * self.y2_l;
            
            self.x2_l = self.x1_l;
            self.x1_l = x_l;
            self.y2_l = self.y1_l;
            self.y1_l = y_l;
            
            samples[i] = y_l;
            
            // Right channel
            if i + 1 < samples.len() {
                let x_r = samples[i + 1];
                let y_r = self.a0 * x_r + self.a1 * self.x1_r + self.a2 * self.x2_r
                        - self.b1 * self.y1_r - self.b2 * self.y2_r;
                
                self.x2_r = self.x1_r;
                self.x1_r = x_r;
                self.y2_r = self.y1_r;
                self.y1_r = y_r;
                
                samples[i + 1] = y_r;
            }
        }
    }
    
    fn reset(&mut self) {
        self.x1_l = 0.0;
        self.x2_l = 0.0;
        self.y1_l = 0.0;
        self.y2_l = 0.0;
        self.x1_r = 0.0;
        self.x2_r = 0.0;
        self.y1_r = 0.0;
        self.y2_r = 0.0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_eq_creation() {
        let eq = EqualizerNode::new("eq1".to_string(), 5);
        assert_eq!(eq.bands.len(), 5);
        assert_eq!(eq.id(), "eq1");
    }
    
    #[test]
    fn test_eq_parameters() {
        let mut eq = EqualizerNode::new("eq1".to_string(), 3);
        
        // Set band 0 gain to +6 dB
        eq.set_parameter("band_0_gain", 6.0).unwrap();
        assert_eq!(eq.get_parameter("band_0_gain"), Some(6.0));
        
        // Set band 1 frequency to 1000 Hz
        eq.set_parameter("band_1_freq", 1000.0).unwrap();
        assert_eq!(eq.get_parameter("band_1_freq"), Some(1000.0));
        
        // Set band 2 Q to 2.0
        eq.set_parameter("band_2_q", 2.0).unwrap();
        assert_eq!(eq.get_parameter("band_2_q"), Some(2.0));
    }
    
    #[test]
    fn test_eq_processing() {
        let mut eq = EqualizerNode::new("eq1".to_string(), 3);
        
        let input = AudioBuffer::new(2, 48000, 512);
        let output = eq.process(&input).unwrap();
        
        assert_eq!(output.channels, 2);
        assert_eq!(output.sample_rate, 48000);
    }
}
