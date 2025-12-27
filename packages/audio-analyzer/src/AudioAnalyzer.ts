/**
 * AudioAnalyzer - Professional audio analysis implementation
 * 
 * Uses Web Audio API's AnalyserNode for real-time frequency and waveform analysis.
 * Designed to work with various audio formats and quality levels.
 * 
 * Philosophy: "Sound deserves respect" - Professional-grade analysis
 * for audiophiles and sound engineers.
 * 
 * Security: Hardened against resource exhaustion and invalid parameters
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
 * Security constants
 */
const MAX_FFT_SIZE = 32768;
const MIN_FFT_SIZE = 32;
const MAX_BUFFER_SIZE = 50 * 1024 * 1024; // 50MB max buffer for offline analysis
const MAX_SAMPLES = 10000; // Max output samples for waveform

/**
 * Security validator for Analyzer operations
 */
class AnalyzerSecurityValidator {
  static validateConfig(config: AnalyzerConfig): void {
    if (config.smoothingTimeConstant < 0 || config.smoothingTimeConstant > 1) {
      throw new Error(`Invalid smoothingTimeConstant: ${config.smoothingTimeConstant} (must be 0-1)`);
    }

    if (config.minDecibels >= config.maxDecibels) {
      throw new Error(`minDecibels (${config.minDecibels}) must be less than maxDecibels (${config.maxDecibels})`);
    }

    if (config.bandCount <= 0 || config.bandCount > 1024) {
        throw new Error(`Invalid bandCount: ${config.bandCount} (must be 1-1024)`);
    }
  }

  static validateBuffer(buffer: ArrayBuffer): void {
    if (!buffer) {
        throw new Error('Buffer is null or undefined');
    }
    if (buffer.byteLength > MAX_BUFFER_SIZE) {
        throw new Error(`Buffer too large: ${buffer.byteLength} bytes (max ${MAX_BUFFER_SIZE})`);
    }
  }
}

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
  private isDisposed: boolean = false;

  // Reusable buffers to avoid allocations
  private frequencyData: Uint8Array<ArrayBuffer> | null = null;
  private timeDomainData: Uint8Array<ArrayBuffer> | null = null;

  // PERFORMANCE: Throttling cache to prevent excessive FFT calls
  private lastSpectrumTime: number = 0;
  private lastWaveformTime: number = 0;
  private cachedSpectrum: SpectrumData | null = null;
  private cachedWaveform: WaveformData | null = null;
  private throttleMs: number = 16; // 60fps default (can be increased when hidden)

  constructor(config?: Partial<AnalyzerConfig>) {
    if (config) {
      try {
        // Validate partial config merged with default
        const mergedConfig = { ...DEFAULT_CONFIG, ...config };
        AnalyzerSecurityValidator.validateConfig(mergedConfig);
        this.updateConfig(config);
      } catch (e) {
        console.warn('Invalid initial config, using defaults:', e);
        // Fallback to defaults already set
      }
    }
    console.log('🎛️ Sonántica Audio Analyzer initialized');
    console.log('   "Sound deserves respect."');
  }

  /**
   * Connect to an audio element
   */
  connect(audioElement: HTMLAudioElement): void {
    if (this.isDisposed) {
        throw new Error('Cannot connect: AudioAnalyzer is disposed');
    }

    try {
      if (!audioElement || !(audioElement instanceof HTMLAudioElement)) {
          throw new Error('Invalid audio element');
      }

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
        this.audioContext.resume().catch(e => console.warn('Could not resume AudioContext:', e));
      }

      // Create source node from audio element
      // Handle case where element already has a source node (might error in some browsers)
      try {
          this.sourceNode = this.audioContext.createMediaElementSource(audioElement);
      } catch (e) {
          // If already connected to another context, this might fail.
          // In a real app we might need to recycle the source node, but here we just error safe.
          console.error('Failed to create MediaElementSource (possibly already connected):', e);
          throw e;
      }

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
      // Ensure specific cleanup if partial connection failed
      this.disconnect(); 
      throw error;
    }
  }

  /**
   * Disconnect from audio source
   * SAFELY restores the audio path to speakers
   */
  disconnect(): void {
    try {
        if (this.sourceNode && this.audioContext) {
            // 1. Disconnect source from analyser
            try {
                this.sourceNode.disconnect();
            } catch (e) {
                // Ignore if already disconnected
            }
            
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
            try {
                this.analyserNode.disconnect();
            } catch { /* ignore */ }
            this.analyserNode = null;
        }

        this.frequencyData = null;
        this.timeDomainData = null;
        this.connected = false;
        this.qualityInfo = null;
        
        console.log('🔌 Audio analyzer disconnected (Audio path restored)');
    } catch (e) {
        console.error('Error during disconnect:', e);
    }
  }

  /**
   * Get current spectrum data
   * PERFORMANCE: Throttled to prevent excessive FFT calculations
   */
  getSpectrum(): SpectrumData {
    if (this.isDisposed || !this.analyserNode || !this.frequencyData) {
      return this.getEmptySpectrum();
    }

    // THROTTLE: Return cached data if within throttle window
    const now = Date.now();
    if (this.cachedSpectrum && (now - this.lastSpectrumTime) < this.throttleMs) {
      return this.cachedSpectrum;
    }

    try {
        // Get frequency data from analyser
        this.analyserNode.getByteFrequencyData(this.frequencyData);

        // Calculate bands
        const bands = this.calculateFrequencyBands(this.frequencyData);

        // Find peak frequency
        const peakFrequency = this.findPeakFrequency(this.frequencyData);

        // Calculate RMS level
        const rmsLevel = this.calculateRMS(this.frequencyData);

        const spectrum = {
            timestamp: now,
            bands,
            peakFrequency,
            rmsLevel,
        };

        // Cache result
        this.cachedSpectrum = spectrum;
        this.lastSpectrumTime = now;

        return spectrum;
    } catch (e) {
        console.warn('Error getting spectrum:', e);
        return this.getEmptySpectrum();
    }
  }

  /**
   * Get current waveform data
   * PERFORMANCE: Throttled to prevent excessive calculations
   */
  getWaveform(): WaveformData {
    if (this.isDisposed || !this.analyserNode || !this.timeDomainData) {
      return this.getEmptyWaveform();
    }

    // THROTTLE: Return cached data if within throttle window
    const now = Date.now();
    if (this.cachedWaveform && (now - this.lastWaveformTime) < this.throttleMs) {
      return this.cachedWaveform;
    }

    try {
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

        const waveform = {
        timestamp: now,
        samples,
        peak,
        rms,
        };

        // Cache result
        this.cachedWaveform = waveform;
        this.lastWaveformTime = now;

        return waveform;
    } catch (e) {
        console.warn('Error getting waveform:', e);
        return this.getEmptyWaveform();
    }
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
    if (this.isDisposed) return;

    try {
        const potentialConfig = { ...this.config, ...config };
        
        // Validation
        AnalyzerSecurityValidator.validateConfig(potentialConfig);
        
        this.config = potentialConfig;

        // Validate FFT size (must be power of 2)
        if (!this.isPowerOfTwo(this.config.fftSize)) {
            console.warn(`⚠️ FFT size ${this.config.fftSize} is not a power of 2, using 2048`);
            this.config.fftSize = 2048;
        }
        
        // Bounds check FFT size
        if (this.config.fftSize > MAX_FFT_SIZE) this.config.fftSize = MAX_FFT_SIZE;
        if (this.config.fftSize < MIN_FFT_SIZE) this.config.fftSize = MIN_FFT_SIZE;


        // Apply to analyser if connected
        if (this.analyserNode) {
            this.applyConfig();
            // Recreate buffers with new size
            // We use try-catch here as allocating large buffers could fail
            try {
                 this.frequencyData = new Uint8Array(new ArrayBuffer(this.analyserNode.frequencyBinCount));
                 this.timeDomainData = new Uint8Array(new ArrayBuffer(this.analyserNode.fftSize));
            } catch (allocError) {
                console.error('Failed to allocate buffers for new config:', allocError);
                // Revert or safe defaults?
                // For now, disconnect to prevent invalid state
                this.disconnect();
            }
        }
    } catch (e) {
        console.error('Failed to update config:', e);
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
   * Set analysis throttle (useful for visibility optimization)
   * @param ms - Milliseconds between analysis updates (16ms = 60fps, 100ms = 10fps)
   * 
   * PERFORMANCE TIP: Increase throttle when visualizer is hidden
   * Example: setThrottle(100) when hidden, setThrottle(16) when visible
   */
  setThrottle(ms: number): void {
    if (typeof ms !== 'number' || ms < 0) {
      console.warn('Invalid throttle value, must be positive number');
      return;
    }
    
    // Clamp between 0 (no throttle) and 1000ms (1fps)
    this.throttleMs = Math.min(Math.max(ms, 0), 1000);
    
    // Clear cache when changing throttle to force fresh data
    this.cachedSpectrum = null;
    this.cachedWaveform = null;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.isDisposed) return;
    
    this.disconnect();

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(e => console.warn('Error closing AudioContext:', e));
      this.audioContext = null;
    }

    this.isDisposed = true;
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
    let tempContext: AudioContext | null = null;
    try {
        AnalyzerSecurityValidator.validateBuffer(arrayBuffer);
        
        // Limit output samples
        if (samples > MAX_SAMPLES) samples = MAX_SAMPLES;
        if (samples <= 0) samples = 200;

        tempContext = new AudioContext();
        
        // Decode can fail or take long.
        // It's a heavy operation.
        const audioBuffer = await tempContext.decodeAudioData(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0); // Use Left channel
        
        const step = Math.floor(channelData.length / samples);
        const waveform: number[] = [];
        
        // 1. Calculate RMS per window + Find Global Peak RMS
        let maxRms = 0;
        const rawRmsValues: number[] = [];

        // Optimize loop to avoid blocking main thread too long if buffer is huge
        // Note: decodeAudioData is async, but this loop is sync.
        // channelData can be large (e.g. 50MB buffer => millions of samples).
        // Since we step through it, it should be O(samples * step) = O(total_length).
        // This is fast enough for typical songs in JS, but we must ensure correctness.

        for (let i = 0; i < samples; i++) {
            let sumSquares = 0;
            let count = 0;
            
            // Safe bounds for inner loop
            const startIdx = i * step;
            const endIdx = Math.min(startIdx + step, channelData.length);

            for (let j = startIdx; j < endIdx; j++) {
                const datum = channelData[j];
                sumSquares += datum * datum;
                count++;
            }
            
            // Avoid division by zero
            const rms = Math.sqrt(sumSquares / (count || 1));
            if (rms > maxRms) maxRms = rms;
            rawRmsValues.push(rms);
        }

        // 2. Normalize and apply contrast
        const normalizationFactor = maxRms > 0 ? (1 / maxRms) : 1;

        for (const val of rawRmsValues) {
            // Linear normalization
            let normalized = val * normalizationFactor;
            
            // Apply power curve to expand dynamic range visuals
            normalized = Math.pow(normalized, 1.5);
            
            // Ensure minimum visibility for "quiet" but existing parts
            waveform.push(Math.max(0.05, Math.min(1.0, normalized)));
        }
        
        return waveform;
    } catch (error) {
        console.error('Error generating waveform:', error);
        return [];
    } finally {
        if (tempContext) {
            try {
                // Ensure we don't leak contexts
                await tempContext.close();
            } catch (e) { /* ignore */ }
        }
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Apply current config to analyser node
   */
  private applyConfig(): void {
    if (!this.analyserNode) return;
    
    // Bounds check again before applying
    const safeMin = Math.min(this.config.minDecibels, -10); // Max allowed min is -10
    const safeMax = Math.max(this.config.maxDecibels, -100); // Min allowed max is -100
    
    if (safeMin >= safeMax) {
        // Fallback protection
        this.analyserNode.minDecibels = -90;
        this.analyserNode.maxDecibels = -10;
    } else {
        this.analyserNode.minDecibels = safeMin;
        this.analyserNode.maxDecibels = safeMax;
    }
    
    this.analyserNode.fftSize = this.config.fftSize;
    this.analyserNode.smoothingTimeConstant = Math.max(0, Math.min(1, this.config.smoothingTimeConstant));
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
      
      if (startBin >= endBin) continue; // Safety check

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
      let amplitude = average / 255;
      
      // Apply contrast curve for visual dynamics (prevents 'brick' look on loud tracks)
      amplitude = Math.pow(amplitude, 1.5);

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
