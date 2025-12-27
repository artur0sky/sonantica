/**
 * @sonantica/dsp - DSP Engine
 * 
 * "If a function alters the sound, it must be optional, explainable, and reversible."
 * 
 * Professional DSP engine using Web Audio API.
 * Implements parametric EQ, preamp, and audio chain management.
 * 
 * Security: Hardened against invalid audio parameters and resource exhaustion
 */

import { clamp } from '@sonantica/shared';
import type {
  IDSPEngine,
  IDSPConfig,
  IEQBand,
  IEQPreset,
  IAudioMetrics,
} from './contracts';
import { EQBandType, VocalMode } from './contracts';
import { dbToGain } from './utils/audioUtils';
import { VocalProcessor } from './processors/VocalProcessor';
import { EQProcessor } from './processors/EQProcessor';
import { PresetManager } from './managers/PresetManager';

/**
 * Security constants
 */
const MAX_EQ_BANDS = 31; // Maximum number of EQ bands
const MAX_PREAMP_DB = 20; // Maximum preamp gain in dB
const MIN_PREAMP_DB = -20; // Minimum preamp gain in dB
const MAX_FREQUENCY = 20000; // Maximum frequency in Hz
const MIN_FREQUENCY = 20; // Minimum frequency in Hz
const MAX_Q_VALUE = 20; // Maximum Q value
const MIN_Q_VALUE = 0.1; // Minimum Q value
const MAX_GAIN_DB = 20; // Maximum gain in dB
const MIN_GAIN_DB = -20; // Minimum gain in dB

/**
 * Security validator for DSP operations
 */
class DSPSecurityValidator {
  /**
   * Validates EQ band parameters
   * @throws {Error} If parameters are invalid
   */
  static validateEQBand(band: IEQBand): void {
    if (!band || typeof band !== 'object') {
      throw new Error('Invalid EQ band: Must be an object');
    }

    if (typeof band.frequency !== 'number' || !isFinite(band.frequency)) {
      throw new Error('Invalid frequency: Must be a finite number');
    }

    if (band.frequency < MIN_FREQUENCY || band.frequency > MAX_FREQUENCY) {
      throw new Error(`Frequency out of range: ${band.frequency} (must be ${MIN_FREQUENCY}-${MAX_FREQUENCY} Hz)`);
    }

    if (typeof band.q !== 'number' || !isFinite(band.q)) {
      throw new Error('Invalid Q value: Must be a finite number');
    }

    if (band.q < MIN_Q_VALUE || band.q > MAX_Q_VALUE) {
      throw new Error(`Q value out of range: ${band.q} (must be ${MIN_Q_VALUE}-${MAX_Q_VALUE})`);
    }

    if (typeof band.gain !== 'number' || !isFinite(band.gain)) {
      throw new Error('Invalid gain: Must be a finite number');
    }

    if (band.gain < MIN_GAIN_DB || band.gain > MAX_GAIN_DB) {
      throw new Error(`Gain out of range: ${band.gain} (must be ${MIN_GAIN_DB}-${MAX_GAIN_DB} dB)`);
    }

    if (typeof band.enabled !== 'boolean') {
      throw new Error('Invalid enabled flag: Must be a boolean');
    }
  }

  /**
   * Validates array of EQ bands
   * @throws {Error} If bands array is invalid
   */
  static validateEQBands(bands: IEQBand[]): void {
    if (!Array.isArray(bands)) {
      throw new Error('Invalid bands: Must be an array');
    }

    if (bands.length > MAX_EQ_BANDS) {
      throw new Error(`Too many EQ bands: ${bands.length} (max: ${MAX_EQ_BANDS})`);
    }

    bands.forEach((band, index) => {
      try {
        this.validateEQBand(band);
      } catch (error) {
        throw new Error(`Invalid band at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Validates preamp gain
   * @throws {Error} If gain is invalid
   */
  static validatePreampGain(gainDb: number): number {
    if (typeof gainDb !== 'number' || !isFinite(gainDb)) {
      throw new Error('Invalid preamp gain: Must be a finite number');
    }

    return clamp(gainDb, MIN_PREAMP_DB, MAX_PREAMP_DB);
  }

  /**
   * Validates volume
   * @throws {Error} If volume is invalid
   */
  static validateVolume(volume: number): number {
    if (typeof volume !== 'number' || !isFinite(volume)) {
      throw new Error('Invalid volume: Must be a finite number');
    }

    return clamp(volume, 0, 1);
  }

  /**
   * Validates vocal mode
   * @throws {Error} If mode is invalid
   */
  static validateVocalMode(mode: VocalMode): void {
    const validModes = Object.values(VocalMode);
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid vocal mode: ${mode}`);
    }
  }
}

/**
 * DSP Engine Implementation
 * 
 * Architecture:
 * AudioElement → MediaElementSource → [EQ Bands] → Preamp → Analyzer → MasterGain → Destination
 * 
 * All processing is done in the frequency domain using BiquadFilterNodes.
 */
export class DSPEngine implements IDSPEngine {
  // Web Audio API context and nodes
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private eqNodes: BiquadFilterNode[] = [];
  private vocalNodes: AudioNode[] = [];
  private preampNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private onPlayHandler: (() => void) | null = null;
  
  // Sub-processors
  private vocalProcessor: VocalProcessor;
  private eqProcessor: EQProcessor;
  private presetManager: PresetManager;

  // State
  private config: IDSPConfig;
  private isInitialized = false;
  private isDisposed = false;
  private currentAudioElement: HTMLAudioElement | null = null;

  // Metrics
  private analyzerNode: AnalyserNode | null = null;
  private metricsInterval: number | null = null;

  constructor() {
    try {
      this.vocalProcessor = new VocalProcessor();
      this.eqProcessor = new EQProcessor();
      this.presetManager = new PresetManager();

      // Initialize with flat/disabled config
      this.config = {
        enabled: false,
        currentPreset: 'flat',
        customBands: null,
        preamp: 0,
        replayGainMode: 'off',
        replayGainPreamp: 0,
        crossfeedEnabled: false,
        crossfeedStrength: 0.5,
        vocalMode: VocalMode.NORMAL,
      };

      console.log('🎛️  Sonántica DSP Engine initialized');
      console.log('   "Fidelity should not be imposed, it should be offered."');
    } catch (error) {
      console.error('❌ Failed to construct DSP Engine:', error);
      throw new Error(`DSP Engine construction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize the DSP engine with an audio element
   */
  async initialize(audioElement: HTMLAudioElement): Promise<void> {
    if (this.isDisposed) {
      throw new Error('Cannot initialize: DSP Engine has been disposed');
    }

    try {
      // Validate input
      if (!audioElement || !(audioElement instanceof HTMLAudioElement)) {
        throw new Error('Invalid audio element: Must be an HTMLAudioElement');
      }

      // Clean up previous initialization
      if (this.isInitialized) {
        this.dispose();
      }

      this.currentAudioElement = audioElement;

      // Create AudioContext (user gesture required in some browsers)
      this.audioContext = new AudioContext();

      // Setup Play Handler to resume AudioContext on user gesture
      this.onPlayHandler = () => {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().then(() => {
            console.log('▶️  AudioContext resumed successfully');
          }).catch(err => {
            console.warn('⚠️ Could not resume AudioContext:', err);
          });
        }
      };
      
      this.currentAudioElement.addEventListener('play', this.onPlayHandler);

      // Create source node from audio element
      this.sourceNode = this.audioContext.createMediaElementSource(audioElement);

      // Create analyzer for metrics
      this.analyzerNode = this.audioContext.createAnalyser();
      this.analyzerNode.fftSize = 2048;
      this.analyzerNode.smoothingTimeConstant = 0.8;

      // Create preamp gain node
      this.preampNode = this.audioContext.createGain();
      this.preampNode.gain.value = dbToGain(this.config.preamp);
      
      // Create master gain node
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.gain.value = 1.0;

      // Build the initial chain
      this.rebuildEQChain();

      this.isInitialized = true;
      console.log('✅ DSP Engine initialized successfully');
      console.log(`   Sample Rate: ${this.audioContext.sampleRate} Hz`);
    } catch (error) {
      console.error('❌ Failed to initialize DSP Engine:', error);
      this.dispose(); // Clean up on error
      throw new Error(`DSP initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply an EQ preset
   */
  applyPreset(presetId: string): void {
    if (this.isDisposed) {
      console.warn('Cannot apply preset: DSP Engine has been disposed');
      return;
    }

    if (!this.isInitialized) {
      console.warn('DSP Engine not initialized');
      return;
    }

    try {
      // Validate input
      if (!presetId || typeof presetId !== 'string') {
        throw new Error('Invalid preset ID: Must be a non-empty string');
      }

      // Find preset
      const preset = this.presetManager.getPresetById(presetId);
      
      if (!preset) {
        console.error(`Preset not found: ${presetId}`);
        return;
      }

      // Validate preset bands
      DSPSecurityValidator.validateEQBands(preset.bands);

      this.config.currentPreset = presetId;
      this.config.customBands = null; // Clear custom bands
      this.config.preamp = DSPSecurityValidator.validatePreampGain(preset.preamp);

      this.rebuildEQChain();
      
      console.log(`🎛️  Applied preset: ${preset.name}`);
      console.log(`   ${preset.description}`);
    } catch (error) {
      console.error('❌ Failed to apply preset:', error);
    }
  }

  /**
   * Apply custom EQ bands
   */
  applyCustomEQ(bands: IEQBand[]): void {
    if (this.isDisposed) {
      console.warn('Cannot apply custom EQ: DSP Engine has been disposed');
      return;
    }

    if (!this.isInitialized) {
      console.warn('DSP Engine not initialized');
      return;
    }

    try {
      // Validate bands
      DSPSecurityValidator.validateEQBands(bands);

      this.config.customBands = [...bands];
      this.config.currentPreset = null; // Clear preset selection

      this.rebuildEQChain();
      
      console.log(`🎛️  Applied custom EQ with ${bands.length} bands`);
    } catch (error) {
      console.error('❌ Failed to apply custom EQ:', error);
    }
  }

  /**
   * Update a single EQ band
   */
  updateBand(bandId: string, updates: Partial<IEQBand>): void {
    if (this.isDisposed) {
      console.warn('Cannot update band: DSP Engine has been disposed');
      return;
    }

    if (!this.isInitialized) {
      console.warn('DSP Engine not initialized');
      return;
    }

    try {
      // Validate input
      if (!bandId || typeof bandId !== 'string') {
        throw new Error('Invalid band ID: Must be a non-empty string');
      }

      if (!updates || typeof updates !== 'object') {
        throw new Error('Invalid updates: Must be an object');
      }

      const bands = this.getCurrentBands();
      const bandIndex = bands.findIndex(b => b.id === bandId);

      if (bandIndex === -1) {
        console.error(`Band not found: ${bandId}`);
        return;
      }

      // Update the band
      const updatedBand = { ...bands[bandIndex], ...updates };
      
      // Validate updated band
      DSPSecurityValidator.validateEQBand(updatedBand);
      
      bands[bandIndex] = updatedBand;

      // If we're modifying a preset, convert to custom
      if (this.config.currentPreset) {
        this.config.customBands = bands;
        this.config.currentPreset = null;
      } else if (this.config.customBands) {
        this.config.customBands = bands;
      }

      this.rebuildEQChain();
    } catch (error) {
      console.error('❌ Failed to update band:', error);
    }
  }

  /**
   * Set preamp gain
   */
  setPreamp(gainDb: number): void {
    if (this.isDisposed) {
      console.warn('Cannot set preamp: DSP Engine has been disposed');
      return;
    }

    if (!this.isInitialized || !this.preampNode || !this.audioContext) {
      console.warn('DSP Engine not initialized');
      return;
    }

    try {
      const clampedGain = DSPSecurityValidator.validatePreampGain(gainDb);
      this.config.preamp = clampedGain;
      
      // Smooth transition to avoid clicks
      const now = this.audioContext.currentTime;
      this.preampNode.gain.setValueAtTime(this.preampNode.gain.value, now);
      this.preampNode.gain.linearRampToValueAtTime(
        dbToGain(clampedGain),
        now + 0.05
      );

      console.log(`🔊 Preamp: ${clampedGain.toFixed(1)} dB`);
    } catch (error) {
      console.error('❌ Failed to set preamp:', error);
    }
  }

  /**
   * Set vocal processing mode
   */
  setVocalMode(mode: VocalMode): void {
    if (this.isDisposed) {
      console.warn('Cannot set vocal mode: DSP Engine has been disposed');
      return;
    }

    try {
      // Validate mode
      DSPSecurityValidator.validateVocalMode(mode);

      if (!this.isInitialized) {
        this.config.vocalMode = mode;
        return;
      }

      if (this.config.vocalMode === mode) return;

      this.config.vocalMode = mode;
      console.log(`🎤 Vocal Mode: ${mode}`);
      
      this.rebuildEQChain();
    } catch (error) {
      console.error('❌ Failed to set vocal mode:', error);
    }
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    if (this.isDisposed) {
      console.warn('Cannot set master volume: DSP Engine has been disposed');
      return;
    }

    if (!this.masterGainNode || !this.audioContext) {
      return;
    }
    
    try {
      const clampedVolume = DSPSecurityValidator.validateVolume(volume);
      
      // Smooth transition
      const now = this.audioContext.currentTime;
      this.masterGainNode.gain.cancelScheduledValues(now);
      this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, now);
      this.masterGainNode.gain.linearRampToValueAtTime(clampedVolume, now + 0.1);
    } catch (error) {
      console.error('❌ Failed to set master volume:', error);
    }
  }

  /**
   * Enable or disable DSP processing
   */
  setEnabled(enabled: boolean): void {
    if (this.isDisposed) {
      console.warn('Cannot set enabled: DSP Engine has been disposed');
      return;
    }

    try {
      if (typeof enabled !== 'boolean') {
        throw new Error('Invalid enabled value: Must be a boolean');
      }

      this.config.enabled = enabled;

      if (enabled) {
        this.rebuildEQChain();
        console.log('✅ DSP processing enabled');
      } else {
        this.bypassChain();
        console.log('⏸️  DSP processing bypassed');
      }
    } catch (error) {
      console.error('❌ Failed to set enabled:', error);
    }
  }

  /**
   * Reset to flat response
   */
  reset(): void {
    if (this.isDisposed) {
      console.warn('Cannot reset: DSP Engine has been disposed');
      return;
    }

    try {
      this.config.currentPreset = 'flat';
      this.config.customBands = null;
      this.config.preamp = 0;
      this.config.enabled = false;

      if (this.isInitialized) {
        this.bypassChain();
      }

      console.log('🔄 DSP reset to flat response');
    } catch (error) {
      console.error('❌ Failed to reset:', error);
    }
  }

  /**
   * Get current DSP configuration
   */
  getConfig(): IDSPConfig {
    try {
      return { ...this.config };
    } catch (error) {
      console.error('❌ Failed to get config:', error);
      return {
        enabled: false,
        currentPreset: 'flat',
        customBands: null,
        preamp: 0,
        replayGainMode: 'off',
        replayGainPreamp: 0,
        crossfeedEnabled: false,
        crossfeedStrength: 0.5,
        vocalMode: VocalMode.NORMAL,
      };
    }
  }

  /**
   * Get all available presets
   */
  getPresets(): IEQPreset[] {
    try {
      return this.presetManager.getAllPresets();
    } catch (error) {
      console.error('❌ Failed to get presets:', error);
      return [];
    }
  }

  /**
   * Save a custom preset
   */
  savePreset(preset: Omit<IEQPreset, 'id' | 'isBuiltIn'>): string {
    try {
      // Validate preset bands
      if (preset.bands) {
        DSPSecurityValidator.validateEQBands(preset.bands);
      }

      return this.presetManager.savePreset(preset);
    } catch (error) {
      console.error('❌ Failed to save preset:', error);
      throw error;
    }
  }

  /**
   * Delete a custom preset
   */
  deletePreset(presetId: string): void {
    try {
      if (!presetId || typeof presetId !== 'string') {
        throw new Error('Invalid preset ID');
      }

      const deleted = this.presetManager.deletePreset(presetId);
      if (deleted && this.config.currentPreset === presetId) {
        this.reset();
      }
    } catch (error) {
      console.error('❌ Failed to delete preset:', error);
    }
  }

  /**
   * Restore custom presets from storage
   */
  restoreCustomPresets(presets: IEQPreset[]): void {
    try {
      if (!Array.isArray(presets)) {
        throw new Error('Invalid presets: Must be an array');
      }

      // Validate each preset
      presets.forEach((preset, index) => {
        if (preset.bands) {
          try {
            DSPSecurityValidator.validateEQBands(preset.bands);
          } catch (error) {
            console.warn(`Invalid preset at index ${index}:`, error);
          }
        }
      });

      this.presetManager.restoreCustomPresets(presets);
    } catch (error) {
      console.error('❌ Failed to restore custom presets:', error);
    }
  }

  /**
   * Get current audio metrics
   */
  getMetrics(): IAudioMetrics | null {
    if (this.isDisposed) {
      return null;
    }

    if (!this.audioContext || !this.analyzerNode) {
      return null;
    }

    try {
      const bufferLength = this.analyzerNode.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      this.analyzerNode.getFloatFrequencyData(dataArray);

      // Calculate RMS and peak
      let sum = 0;
      let peak = -Infinity;
      
      for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i];
        if (isFinite(value)) {
          sum += value * value;
          peak = Math.max(peak, value);
        }
      }

      const rms = Math.sqrt(sum / dataArray.length);

      return {
        sampleRate: this.audioContext.sampleRate,
        bitDepth: null, // Not available in Web Audio API
        channels: this.audioContext.destination.channelCount,
        rmsLevel: isFinite(rms) ? 20 * Math.log10(rms) : -Infinity,
        peakLevel: peak,
        isClipping: peak > -0.1, // Close to 0 dBFS
        spectrum: dataArray,
      };
    } catch (error) {
      console.error('❌ Failed to get metrics:', error);
      return null;
    }
  }

  /**
   * Dispose
   */
  dispose(): void {
    if (this.isDisposed) {
      console.warn('DSP Engine already disposed');
      return;
    }

    try {
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
        this.metricsInterval = null;
      }

      if (this.currentAudioElement && this.onPlayHandler) {
        this.currentAudioElement.removeEventListener('play', this.onPlayHandler);
        this.onPlayHandler = null;
      }

      // Disconnect all nodes
      this.eqNodes.forEach(node => {
        try {
          node.disconnect();
        } catch (error) {
          console.warn('Error disconnecting EQ node:', error);
        }
      });
      this.eqNodes = [];
      
      this.vocalNodes.forEach(node => {
        try {
          node.disconnect();
        } catch (error) {
          console.warn('Error disconnecting vocal node:', error);
        }
      });
      this.vocalNodes = [];

      if (this.sourceNode) {
        try {
          this.sourceNode.disconnect();
        } catch (error) {
          console.warn('Error disconnecting source node:', error);
        }
        this.sourceNode = null;
      }

      if (this.preampNode) {
        try {
          this.preampNode.disconnect();
        } catch (error) {
          console.warn('Error disconnecting preamp node:', error);
        }
        this.preampNode = null;
      }

      if (this.analyzerNode) {
        try {
          this.analyzerNode.disconnect();
        } catch (error) {
          console.warn('Error disconnecting analyzer node:', error);
        }
        this.analyzerNode = null;
      }
      
      if (this.masterGainNode) {
        try {
          this.masterGainNode.disconnect();
        } catch (error) {
          console.warn('Error disconnecting master gain node:', error);
        }
        this.masterGainNode = null;
      }

      if (this.audioContext) {
        try {
          this.audioContext.close();
        } catch (error) {
          console.warn('Error closing audio context:', error);
        }
        this.audioContext = null;
      }

      this.isInitialized = false;
      this.isDisposed = true;
      this.currentAudioElement = null;

      console.log('🧹 DSP Engine disposed');
    } catch (error) {
      console.error('❌ Error during disposal:', error);
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Get the current active bands (from preset or custom)
   */
  private getCurrentBands(): IEQBand[] {
    try {
      if (this.config.customBands) {
        return this.config.customBands;
      }

      if (this.config.currentPreset) {
        const preset = this.presetManager.getPresetById(this.config.currentPreset);
        return preset ? preset.bands : [];
      }

      return [];
    } catch (error) {
      console.error('❌ Failed to get current bands:', error);
      return [];
    }
  }

  /**
   * Rebuild the entire EQ chain
   */
  private rebuildEQChain(): void {
    if (!this.audioContext || !this.sourceNode || !this.preampNode || !this.analyzerNode || !this.masterGainNode) {
      return;
    }

    try {
      // Disconnect old nodes
      this.eqNodes.forEach(node => {
        try {
          node.disconnect();
        } catch (error) {
          console.warn('Error disconnecting old EQ node:', error);
        }
      });
      this.eqNodes = [];
      
      this.vocalNodes.forEach(node => {
        try {
          node.disconnect();
        } catch (error) {
          console.warn('Error disconnecting old vocal node:', error);
        }
      });
      this.vocalNodes = [];
      
      this.sourceNode.disconnect();
      this.analyzerNode.disconnect();
      this.masterGainNode.disconnect();

      const bands = this.getCurrentBands();

      if (!this.config.enabled || (bands.length === 0 && this.config.vocalMode === VocalMode.NORMAL)) {
        this.bypassChain();
        return;
      }

      // Create new EQ nodes
      let previousNode: AudioNode = this.sourceNode;

      // 1. Vocal Processing Stage
      previousNode = this.vocalProcessor.buildVocalStage(
        this.audioContext,
        previousNode,
        this.config.vocalMode
      );
      this.vocalNodes = this.vocalProcessor.getCreatedNodes();

      // 2. EQ Stage
      previousNode = this.eqProcessor.buildEQChain(
        this.audioContext,
        previousNode,
        bands
      );
      this.eqNodes = this.eqProcessor.getCreatedNodes();

      // Connect to preamp
      previousNode.connect(this.preampNode);
      
      // Connect preamp to analyzer
      this.preampNode.connect(this.analyzerNode);
      
      // Connect analyzer to master gain
      this.analyzerNode.connect(this.masterGainNode);

      // Connect master gain to destination
      this.masterGainNode.connect(this.audioContext.destination);
    } catch (error) {
      console.error('❌ Failed to rebuild EQ chain:', error);
      // Try to bypass on error
      try {
        this.bypassChain();
      } catch (bypassError) {
        console.error('❌ Failed to bypass chain:', bypassError);
      }
    }
  }

  /**
   * Bypass the EQ chain (direct connection)
   */
  private bypassChain(): void {
    if (!this.audioContext || !this.sourceNode || !this.preampNode || !this.analyzerNode || !this.masterGainNode) {
      return;
    }

    try {
      // Disconnect everything
      this.eqNodes.forEach(node => {
        try {
          node.disconnect();
        } catch (error) {
          console.warn('Error disconnecting EQ node:', error);
        }
      });
      
      this.vocalNodes.forEach(node => {
        try {
          node.disconnect();
        } catch (error) {
          console.warn('Error disconnecting vocal node:', error);
        }
      });
      
      this.sourceNode.disconnect();
      this.preampNode.disconnect();
      this.analyzerNode.disconnect();
      this.masterGainNode.disconnect();

      // Direct connection
      this.sourceNode.connect(this.preampNode);
      this.preampNode.connect(this.analyzerNode);
      this.analyzerNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.audioContext.destination);
    } catch (error) {
      console.error('❌ Failed to bypass chain:', error);
    }
  }
}
