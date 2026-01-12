/**
 * @sonantica/dsp - Contracts
 * 
 * "If a function alters the sound, it must be optional, explainable, and reversible."
 * 
 * Core interfaces for DSP processing following the Dependency Inversion Principle.
 */

/**
 * EQ Band Type - defines the filter characteristic
 */
export enum EQBandType {
  LOWSHELF = 'lowshelf',
  PEAKING = 'peaking',
  HIGHSHELF = 'highshelf',
  LOWPASS = 'lowpass',
  HIGHPASS = 'highpass',
  NOTCH = 'notch',
  ALLPASS = 'allpass',
}

/**
 * Single EQ Band Configuration
 */
export interface IEQBand {
  /** Unique identifier for the band */
  id: string;
  /** Band type (lowshelf, peaking, etc.) */
  type: EQBandType;
  /** Center frequency in Hz */
  frequency: number;
  /** Gain in dB (-20 to +20) */
  gain: number;
  /** Q factor (quality/bandwidth) - typically 0.1 to 10 */
  q: number;
  /** Whether this band is active */
  enabled: boolean;
}

/**
 * EQ Preset Configuration
 */
export interface IEQPreset {
  /** Preset identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of the preset's purpose */
  description: string;
  /** Band configurations */
  bands: IEQBand[];
  /** Preamp gain in dB */
  preamp: number;
  /** Whether this is a built-in or user preset */
  isBuiltIn: boolean;
}

/**
 * Vocal Processing Mode
 */
export enum VocalMode {
  NORMAL = 'normal',
  KARAOKE = 'karaoke',   // Remove vocals (Side channel only)
  MUSICIAN = 'musician', // Isolate vocals (Center channel + Bandpass)
  AI_KARAOKE = 'ai_karaoke', // Remove vocals using Demucs stems
  AI_VOCALS = 'ai_vocals',   // Isolate vocals using Demucs stems
}

/**
 * DSP Chain Configuration
 */
export interface IDSPConfig {
  /** Whether DSP processing is enabled globally */
  enabled: boolean;
  /** Current EQ preset (null = flat/disabled) */
  currentPreset: string | null;
  /** Custom EQ bands (overrides preset if set) */
  customBands: IEQBand[] | null;
  /** Preamp gain in dB (-20 to +20) */
  preamp: number;
  /** ReplayGain mode */
  replayGainMode: 'off' | 'track' | 'album';
  /** ReplayGain preamp in dB */
  replayGainPreamp: number;
  /** Crossfeed enabled (for headphones) */
  crossfeedEnabled: boolean;
  /** Crossfeed strength (0-1) */
  crossfeedStrength: number;
  /** Vocal processing mode */
  vocalMode: VocalMode;
}

/**
 * DSP Engine Interface
 * 
 * Follows the Open/Closed Principle:
 * - Open for extension (new effects can be added)
 * - Closed for modification (core interface is stable)
 */
export interface IDSPEngine {
  /**
   * Initialize the DSP engine with an audio element
   * @param audioElement - The HTML audio element to process
   * @returns Promise that resolves when initialization is complete
   */
  initialize(audioElement: HTMLAudioElement): Promise<void>;

  /**
   * Apply an EQ preset
   * @param presetId - ID of the preset to apply
   */
  applyPreset(presetId: string): void;

  /**
   * Apply custom EQ bands
   * @param bands - Array of EQ band configurations
   */
  applyCustomEQ(bands: IEQBand[]): void;

  /**
   * Update a single EQ band
   * @param bandId - ID of the band to update
   * @param updates - Partial band configuration to update
   */
  updateBand(bandId: string, updates: Partial<IEQBand>): void;

  /**
   * Set preamp gain
   * @param gainDb - Gain in dB (-20 to +20)
   */
  setPreamp(gainDb: number): void;

  /**
   * Set vocal processing mode
   * @param mode - The vocal mode (normal, karaoke, musician)
   */
  setVocalMode(mode: VocalMode): void;

  /**
   * Enable or disable DSP processing
   * @param enabled - Whether DSP should be active
   */
  setEnabled(enabled: boolean): void;

  /**
   * Reset to flat response (bypass all processing)
   */
  reset(): void;

  /**
   * Get current DSP configuration
   */
  getConfig(): IDSPConfig;

  /**
   * Get all available presets
   */
  getPresets(): IEQPreset[];

  /**
   * Save a custom preset
   * @param preset - Preset configuration to save
   */
  savePreset(preset: Omit<IEQPreset, 'id' | 'isBuiltIn'>): string;

  /**
   * Delete a custom preset
   * @param presetId - ID of the preset to delete
   */
  deletePreset(presetId: string): void;

  /**
   * Restore custom presets from storage
   * @param presets - Array of custom presets to restore
   */
  restoreCustomPresets(presets: IEQPreset[]): void;

  /**
   * Set master volume (0.0 to 1.0)
   * Essential when MediaElementAudioSourceNode ignores the wrapper's volume.
   */
  setMasterVolume(volume: number): void;

  /**
   * Cleanup and disconnect all nodes
   */
  dispose(): void;
}

/**
 * Audio Metrics for technical transparency
 * "Technical Inspector" feature from roadmap
 */
export interface IAudioMetrics {
  /** Sample rate in Hz */
  sampleRate: number;
  /** Bit depth (if available) */
  bitDepth: number | null;
  /** Number of channels */
  channels: number;
  /** Current RMS level (dB) */
  rmsLevel: number;
  /** Peak level (dB) */
  peakLevel: number;
  /** Whether clipping is detected */
  isClipping: boolean;
  /** Current frequency spectrum (for visualization) */
  spectrum: Float32Array | null;
}
