use serde::{Deserialize, Serialize};

/// Audio buffer containing interleaved samples
/// 
/// For stereo: [L, R, L, R, L, R, ...]
/// For mono: [M, M, M, ...]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AudioBuffer {
    /// Number of channels (1 = mono, 2 = stereo, etc.)
    pub channels: usize,
    
    /// Sample rate in Hz (e.g., 44100, 48000, 96000)
    pub sample_rate: u32,
    
    /// Interleaved audio samples (32-bit float, -1.0 to 1.0)
    pub samples: Vec<f32>,
}

impl AudioBuffer {
    /// Create a new audio buffer
    pub fn new(channels: usize, sample_rate: u32, num_samples: usize) -> Self {
        Self {
            channels,
            sample_rate,
            samples: vec![0.0; num_samples * channels],
        }
    }
    
    /// Create a silent buffer
    pub fn silence(channels: usize, sample_rate: u32, num_samples: usize) -> Self {
        Self::new(channels, sample_rate, num_samples)
    }
    
    /// Get the number of frames (samples per channel)
    pub fn num_frames(&self) -> usize {
        if self.channels == 0 {
            0
        } else {
            self.samples.len() / self.channels
        }
    }
    
    /// Clear the buffer (set all samples to 0.0)
    pub fn clear(&mut self) {
        self.samples.fill(0.0);
    }
    
    /// Mix another buffer into this one
    pub fn mix(&mut self, other: &AudioBuffer) {
        let len = self.samples.len().min(other.samples.len());
        for i in 0..len {
            self.samples[i] += other.samples[i];
        }
    }
    
    /// Apply gain to all samples
    pub fn apply_gain(&mut self, gain: f32) {
        for sample in &mut self.samples {
            *sample *= gain;
        }
    }
    
    /// Get peak level (maximum absolute value)
    pub fn peak_level(&self) -> f32 {
        self.samples
            .iter()
            .map(|s| s.abs())
            .fold(0.0f32, f32::max)
    }
    
    /// Get RMS (Root Mean Square) level
    pub fn rms_level(&self) -> f32 {
        if self.samples.is_empty() {
            return 0.0;
        }
        
        let sum: f32 = self.samples.iter().map(|s| s * s).sum();
        (sum / self.samples.len() as f32).sqrt()
    }
    
    /// Resize the buffer (preserving existing samples, filling with silence if growing)
    pub fn resize(&mut self, num_samples: usize) {
        self.samples.resize(num_samples * self.channels, 0.0);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_buffer_creation() {
        let buffer = AudioBuffer::new(2, 48000, 1024);
        assert_eq!(buffer.channels, 2);
        assert_eq!(buffer.sample_rate, 48000);
        assert_eq!(buffer.num_frames(), 1024);
        assert_eq!(buffer.samples.len(), 2048);
    }
    
    #[test]
    fn test_silence() {
        let buffer = AudioBuffer::silence(2, 48000, 512);
        assert!(buffer.samples.iter().all(|&s| s == 0.0));
    }
    
    #[test]
    fn test_mix() {
        let mut buf1 = AudioBuffer::new(2, 48000, 4);
        buf1.samples = vec![0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
        
        let mut buf2 = AudioBuffer::new(2, 48000, 4);
        buf2.samples = vec![0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3];
        
        buf1.mix(&buf2);
        
        assert!((buf1.samples[0] - 0.8).abs() < 0.001);
    }
    
    #[test]
    fn test_gain() {
        let mut buffer = AudioBuffer::new(1, 48000, 4);
        buffer.samples = vec![1.0, 0.5, -0.5, -1.0];
        
        buffer.apply_gain(0.5);
        
        assert!((buffer.samples[0] - 0.5).abs() < 0.001);
        assert!((buffer.samples[1] - 0.25).abs() < 0.001);
        assert!((buffer.samples[2] + 0.25).abs() < 0.001);
        assert!((buffer.samples[3] + 0.5).abs() < 0.001);
    }
    
    #[test]
    fn test_peak_level() {
        let mut buffer = AudioBuffer::new(1, 48000, 4);
        buffer.samples = vec![0.5, -0.8, 0.3, -0.2];
        
        assert!((buffer.peak_level() - 0.8).abs() < 0.001);
    }
}
