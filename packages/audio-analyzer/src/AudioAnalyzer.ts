/**
 * AudioAnalyzer - Professional audio analysis implementation
 * 
 * Uses Web Audio API's AnalyserNode for real-time frequency and waveform analysis.
 * Designed to work with various audio formats and quality levels.
 * 
 * Philosophy: "Sound deserves respect" - Professional-grade analysis
 * for audiophiles and sound engineers.
 */

import type {
  IAudioAnalyzer,
  AnalyzerConfig,
  SpectrumData,
  WaveformData,
  AudioQualityInfo,
  FrequencyBand,
} from './contracts';

/**
 * Default analyzer configuration
 * Balanced for performance and quality
 */
const DEFAULT_CONFIG: AnalyzerConfig = {
  fftSize: 2048, // Good balance for frequency resolution
  smoothingTimeConstant: 0.75, // Smooth but responsive
  minDecibels: -90,
  maxDecibels: -10,
  bandCount: 32, // Standard for visualizations
};

/**
 * Core audio analyzer implementation
 * 
 * Responsibilities:
 * - Real-time frequency spectrum analysis
 * - Waveform capture
 * - Audio quality detection
 * 
 * Does NOT:
 * - Render visualizations (that's UI's job)
 * - Store historical data (stateless)
 * - Modify audio signal (analysis only)
 */
export class AudioAnalyzer implements IAudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private config: AnalyzerConfig = { ...DEFAULT_CONFIG };
  private connected: boolean = false;
  private qualityInfo: AudioQualityInfo | null = null;

  // Reusable buffers to avoid allocations
  private frequencyData: Uint8Array<ArrayBuffer> | null = null;
  private timeDomainData: Uint8Array<ArrayBuffer> | null = null;

  constructor(config?: Partial<AnalyzerConfig>) {
    if (config) {
      this.updateConfig(config);
    }
    console.log('🎛️ Sonántica Audio Analyzer initialized');
    console.log('   "Sound deserves respect."');
  }

  /**
   * Connect to an audio element
   */
  connect(audioElement: HTMLAudioElement): void {
    try {
      // Disconnect if already connected
      if (this.connected) {
        this.disconnect();
      }

      // Create audio context if needed
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // Resume context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Create source node from audio element
      this.sourceNode = this.audioContext.createMediaElementSource(audioElement);

      // Create and configure analyser node
      this.analyserNode = this.audioContext.createAnalyser();
      this.applyConfig();

      // Connect: source -> analyser -> destination
      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);

      // Initialize buffers
      this.frequencyData = new Uint8Array(new ArrayBuffer(this.analyserNode.frequencyBinCount));
      this.timeDomainData = new Uint8Array(new ArrayBuffer(this.analyserNode.fftSize));

      // Detect audio quality
      this.detectQuality();

      this.connected = true;
      console.log('✅ Audio analyzer connected');
      console.log(`   Sample rate: ${this.audioContext.sampleRate} Hz`);
      console.log(`   FFT size: ${this.config.fftSize}`);
    } catch (error) {
      console.error('❌ Failed to connect audio analyzer:', error);
      throw error;
    }
  }

  /**
   * Disconnect from audio source
   */
  /**
   * Disconnect from audio source
   * SAFELY restores the audio path to speakers
   */
  disconnect(): void {
    if (this.sourceNode && this.audioContext) {
      // 1. Disconnect source from analyser
      this.sourceNode.disconnect();
      
      // 2. CRITICAL: Reconnect source directly to destination to keep audio playing
      // This fixes the "glitch" where audio stops after analyzer disconnects
      try {
        this.sourceNode.connect(this.audioContext.destination);
      } catch (e) {
        console.warn('Could not restore audio connection:', e);
      }
      
      this.sourceNode = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    this.frequencyData = null;
    this.timeDomainData = null;
    this.connected = false;
    this.qualityInfo = null;

    console.log('🔌 Audio analyzer disconnected (Audio path restored)');
  }

  /**
   * Get current spectrum data
   */
  getSpectrum(): SpectrumData {
    if (!this.analyserNode || !this.frequencyData) {
      return this.getEmptySpectrum();
    }

    // Get frequency data from analyser
    this.analyserNode.getByteFrequencyData(this.frequencyData);

    // Calculate bands
    const bands = this.calculateFrequencyBands(this.frequencyData);

    // Find peak frequency
    const peakFrequency = this.findPeakFrequency(this.frequencyData);

    // Calculate RMS level
    const rmsLevel = this.calculateRMS(this.frequencyData);

    return {
      timestamp: Date.now(),
      bands,
      peakFrequency,
      rmsLevel,
    };
  }

  /**
   * Get current waveform data
   */
  getWaveform(): WaveformData {
    if (!this.analyserNode || !this.timeDomainData) {
      return this.getEmptyWaveform();
    }

    // Get time-domain data
    this.analyserNode.getByteTimeDomainData(this.timeDomainData);

    // Convert to normalized float array
    const samples = new Float32Array(this.timeDomainData.length);
    let peak = 0;
    let sumSquares = 0;

    for (let i = 0; i < this.timeDomainData.length; i++) {
      // Convert from 0-255 to -1.0 to 1.0
      const normalized = (this.timeDomainData[i] - 128) / 128;
      samples[i] = normalized;

      const abs = Math.abs(normalized);
      if (abs > peak) peak = abs;
      sumSquares += normalized * normalized;
    }

    const rms = Math.sqrt(sumSquares / samples.length);

    return {
      timestamp: Date.now(),
      samples,
      peak,
      rms,
    };
  }

  /**
   * Get audio quality information
   */
  getQualityInfo(): AudioQualityInfo | null {
    return this.qualityInfo;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AnalyzerConfig>): void {
    this.config = { ...this.config, ...config };

    // Validate FFT size (must be power of 2)
    if (!this.isPowerOfTwo(this.config.fftSize)) {
      console.warn(`⚠️ FFT size ${this.config.fftSize} is not a power of 2, using 2048`);
      this.config.fftSize = 2048;
    }

    // Apply to analyser if connected
    if (this.analyserNode) {
      this.applyConfig();
      // Recreate buffers with new size
      this.frequencyData = new Uint8Array(new ArrayBuffer(this.analyserNode.frequencyBinCount));
      this.timeDomainData = new Uint8Array(new ArrayBuffer(this.analyserNode.fftSize));
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AnalyzerConfig {
    return { ...this.config };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Cleanup resources
   */
  /**
   * Cleanup resources
   */
  dispose(): void {
    this.disconnect();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    console.log('🧹 Audio analyzer disposed');
  }

  /**
   * Generate waveform data from a full audio buffer (Offline Analysis)
   * Used for the WaveformScrubber ("The real faithful representation")
   */
  static async generateWaveformFromBuffer(
    arrayBuffer: ArrayBuffer, 
    samples: number = 200
  ): Promise<number[]> {
    const tempContext = new AudioContext();
    const audioBuffer = await tempContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0); // Use Left channel
    
    const step = Math.floor(channelData.length / samples);
    const waveform: number[] = [];
    
    // 1. Calculate RMS per window + Find Global Peak RMS
    let maxRms = 0;
    const rawRmsValues: number[] = [];

    for (let i = 0; i < samples; i++) {
        let sumSquares = 0;
        let count = 0;
        
        for (let j = 0; j < step; j++) {
            const idx = (i * step) + j;
            if (idx < channelData.length) {
                const datum = channelData[idx];
                sumSquares += datum * datum;
                count++;
            }
        }
        
        const rms = Math.sqrt(sumSquares / (count || 1));
        if (rms > maxRms) maxRms = rms;
        rawRmsValues.push(rms);
    }

    // 2. Normalize and apply contrast
    // Avoid division by zero
    const normalizationFactor = maxRms > 0 ? (1 / maxRms) : 1;

    for (const val of rawRmsValues) {
        // Linear normalization
        let normalized = val * normalizationFactor;
        
        // Apply power curve to expand dynamic range visuals
        // Low volume parts get lower, peaks stay high
        normalized = Math.pow(normalized, 1.5);
        
        // Ensure minimum visibility for "quiet" but existing parts
        waveform.push(Math.max(0.05, Math.min(1.0, normalized)));
    }
    
    tempContext.close();
    return waveform;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Apply current config to analyser node
   */
  private applyConfig(): void {
    if (!this.analyserNode) return;

    this.analyserNode.fftSize = this.config.fftSize;
    this.analyserNode.smoothingTimeConstant = this.config.smoothingTimeConstant;
    this.analyserNode.minDecibels = this.config.minDecibels;
    this.analyserNode.maxDecibels = this.config.maxDecibels;
  }

  /**
   * Calculate frequency bands from raw FFT data
   */
  private calculateFrequencyBands(frequencyData: Uint8Array<ArrayBuffer>): FrequencyBand[] {
    const bands: FrequencyBand[] = [];
    const binCount = frequencyData.length;
    const sampleRate = this.audioContext?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    const binsPerBand = Math.floor(binCount / this.config.bandCount);

    for (let i = 0; i < this.config.bandCount; i++) {
      const startBin = i * binsPerBand;
      const endBin = Math.min(startBin + binsPerBand, binCount);

      // Average bins in this band
      let sum = 0;
      for (let j = startBin; j < endBin; j++) {
        sum += frequencyData[j];
      }
      const average = sum / (endBin - startBin);

      // Calculate frequency range
      const minFreq = (startBin / binCount) * nyquist;
      const maxFreq = (endBin / binCount) * nyquist;

      // Normalize amplitude (0-255 -> 0.0-1.0)
      const amplitude = average / 255;

      // Convert to dB (approximate)
      const db = this.config.minDecibels + 
                 (amplitude * (this.config.maxDecibels - this.config.minDecibels));

      bands.push({
        minFreq,
        maxFreq,
        amplitude,
        db,
      });
    }

    return bands;
  }

  /**
   * Find peak frequency in spectrum
   */
  private findPeakFrequency(frequencyData: Uint8Array<ArrayBuffer>): number {
    let maxValue = 0;
    let maxIndex = 0;

    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > maxValue) {
        maxValue = frequencyData[i];
        maxIndex = i;
      }
    }

    const sampleRate = this.audioContext?.sampleRate || 44100;
    const nyquist = sampleRate / 2;
    return (maxIndex / frequencyData.length) * nyquist;
  }

  /**
   * Calculate RMS level
   */
  private calculateRMS(data: Uint8Array<ArrayBuffer>): number {
    let sumSquares = 0;
    for (let i = 0; i < data.length; i++) {
      const normalized = data[i] / 255;
      sumSquares += normalized * normalized;
    }
    return Math.sqrt(sumSquares / data.length);
  }

  /**
   * Detect audio quality based on analysis
   */
  private detectQuality(): void {
    if (!this.audioContext) return;

    const sampleRate = this.audioContext.sampleRate;

    // Estimate quality tier based on sample rate
    // Note: This is a simplified heuristic
    let qualityTier: 'lossy' | 'cd' | 'hires';
    let estimatedBitDepth: number;

    if (sampleRate >= 88200) {
      qualityTier = 'hires';
      estimatedBitDepth = 24;
    } else if (sampleRate >= 44100) {
      qualityTier = 'cd';
      estimatedBitDepth = 16;
    } else {
      qualityTier = 'lossy';
      estimatedBitDepth = 16;
    }

    // Frequency range based on Nyquist theorem
    const nyquist = sampleRate / 2;

    this.qualityInfo = {
      sampleRate,
      estimatedBitDepth,
      frequencyRange: {
        min: 20, // Human hearing lower limit
        max: Math.min(nyquist, 20000), // Human hearing upper limit or Nyquist
      },
      dynamicRange: estimatedBitDepth * 6, // Approximate: 6dB per bit
      qualityTier,
    };

    console.log('🎯 Audio quality detected:', this.qualityInfo);
  }

  /**
   * Check if number is power of 2
   */
  private isPowerOfTwo(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
  }

  /**
   * Get empty spectrum data (fallback)
   */
  private getEmptySpectrum(): SpectrumData {
    return {
      timestamp: Date.now(),
      bands: Array(this.config.bandCount).fill(null).map((_, i) => ({
        minFreq: 0,
        maxFreq: 0,
        amplitude: 0,
        db: this.config.minDecibels,
      })),
      peakFrequency: 0,
      rmsLevel: 0,
    };
  }

  /**
   * Get empty waveform data (fallback)
   */
  private getEmptyWaveform(): WaveformData {
    return {
      timestamp: Date.now(),
      samples: new Float32Array(this.config.fftSize),
      peak: 0,
      rms: 0,
    };
  }
}
