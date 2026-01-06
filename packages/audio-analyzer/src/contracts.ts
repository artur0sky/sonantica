/**
 * Contracts (Interfaces) for the Audio Analyzer
 * 
 * These define the public API for audio analysis capabilities.
 * Following the same pattern as player-core.
 */

/**
 * Frequency band data for spectrum analysis
 */
export interface FrequencyBand {
  /** Frequency range start (Hz) */
  minFreq: number;
  /** Frequency range end (Hz) */
  maxFreq: number;
  /** Normalized amplitude (0.0 to 1.0) */
  amplitude: number;
  /** Raw decibel value */
  db: number;
}

/**
 * Spectrum analysis result
 */
export interface SpectrumData {
  /** Timestamp of analysis */
  timestamp: number;
  /** Frequency bands */
  bands: FrequencyBand[];
  /** Peak frequency (Hz) */
  peakFrequency: number;
  /** Overall RMS level (0.0 to 1.0) */
  rmsLevel: number;
}

/**
 * Waveform analysis result
 */
export interface WaveformData {
  /** Timestamp of analysis */
  timestamp: number;
  /** Time-domain samples (normalized -1.0 to 1.0) */
  samples: Float32Array;
  /** Peak amplitude */
  peak: number;
  /** RMS level */
  rms: number;
}

/**
 * Audio quality metadata based on analysis
 */
export interface AudioQualityInfo {
  /** Sample rate (Hz) */
  sampleRate: number;
  /** Bit depth (estimated from dynamic range) */
  estimatedBitDepth: number;
  /** Detected frequency range (Hz) */
  frequencyRange: {
    min: number;
    max: number;
  };
  /** Dynamic range (dB) */
  dynamicRange: number;
  /** Quality tier: 'lossy', 'cd', 'hires' */
  qualityTier: 'lossy' | 'cd' | 'hires';
}

/**
 * Analyzer configuration
 */
export interface AnalyzerConfig {
  /** FFT size (must be power of 2: 256, 512, 1024, 2048, 4096, 8192) */
  fftSize: number;
  /** Smoothing time constant (0.0 to 1.0) */
  smoothingTimeConstant: number;
  /** Minimum decibels for normalization */
  minDecibels: number;
  /** Maximum decibels for normalization */
  maxDecibels: number;
  /** Number of frequency bands to output */
  bandCount: number;
}

/**
 * Main interface for the audio analyzer engine
 */
export interface IAudioAnalyzer {
  /**
   * Connect to an audio source
   * @param audioElement HTML Audio element or MediaStream
   */
  connect(audioElement: HTMLAudioElement): void;

  /**
   * Disconnect from current source
   */
  disconnect(): void;

  /**
   * Get current spectrum data
   */
  getSpectrum(): SpectrumData;

  /**
   * Get current waveform data
   */
  getWaveform(): WaveformData;

  /**
   * Get audio quality information
   */
  getQualityInfo(): AudioQualityInfo | null;

  /**
   * Update analyzer configuration
   */
  updateConfig(config: Partial<AnalyzerConfig>): void;

  /**
   * Get current configuration
   */
  getConfig(): AnalyzerConfig;

  /**
   * Check if analyzer is connected
   */
  isConnected(): boolean;

  /**
   * Cleanup and release resources
   */
  dispose(): void;
}
