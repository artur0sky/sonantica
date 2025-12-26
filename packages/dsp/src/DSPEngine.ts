/**
 * @sonantica/dsp - DSP Engine
 * 
 * "If a function alters the sound, it must be optional, explainable, and reversible."
 * 
 * Professional DSP engine using Web Audio API.
 * Implements parametric EQ, preamp, and audio chain management.
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
import { BUILTIN_PRESETS, getPresetById } from './presets';

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
  
  // State
  private config: IDSPConfig;
  private customPresets: IEQPreset[] = [];
  private isInitialized = false;
  private currentAudioElement: HTMLAudioElement | null = null;

  // Metrics
  private analyzerNode: AnalyserNode | null = null;
  private metricsInterval: number | null = null;

  constructor() {
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
  }

  /**
   * Initialize the DSP engine with an audio element
   */
  async initialize(audioElement: HTMLAudioElement): Promise<void> {
    try {
      // Clean up previous initialization
      if (this.isInitialized) {
        this.dispose();
      }

      this.currentAudioElement = audioElement;

      // Create AudioContext (user gesture required in some browsers)
      // We don't call resume() immediately here to avoid warnings if no gesture is active.
      // Instead we rely on the play handler.
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
      this.preampNode.gain.value = this.dbToGain(this.config.preamp);
      
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
      throw error;
    }
  }

  /**
   * Apply an EQ preset
   */
  applyPreset(presetId: string): void {
    if (!this.isInitialized) {
      console.warn('DSP Engine not initialized');
      return;
    }

    // Find preset (check both built-in and custom)
    const preset = this.getPresets().find(p => p.id === presetId);
    
    if (!preset) {
      console.error(`Preset not found: ${presetId}`);
      return;
    }

    this.config.currentPreset = presetId;
    this.config.customBands = null; // Clear custom bands
    this.config.preamp = preset.preamp;

    this.rebuildEQChain();
    
    console.log(`🎛️  Applied preset: ${preset.name}`);
    console.log(`   ${preset.description}`);
  }

  /**
   * Apply custom EQ bands
   */
  applyCustomEQ(bands: IEQBand[]): void {
    if (!this.isInitialized) {
      console.warn('DSP Engine not initialized');
      return;
    }

    this.config.customBands = [...bands];
    this.config.currentPreset = null; // Clear preset selection

    this.rebuildEQChain();
    
    console.log(`🎛️  Applied custom EQ with ${bands.length} bands`);
  }

  /**
   * Update a single EQ band
   */
  updateBand(bandId: string, updates: Partial<IEQBand>): void {
    if (!this.isInitialized) {
      console.warn('DSP Engine not initialized');
      return;
    }

    const bands = this.getCurrentBands();
    const bandIndex = bands.findIndex(b => b.id === bandId);

    if (bandIndex === -1) {
      console.error(`Band not found: ${bandId}`);
      return;
    }

    // Update the band
    const updatedBand = { ...bands[bandIndex], ...updates };
    bands[bandIndex] = updatedBand;

    // If we're modifying a preset, convert to custom
    if (this.config.currentPreset) {
      this.config.customBands = bands;
      this.config.currentPreset = null;
    } else if (this.config.customBands) {
      this.config.customBands = bands;
    }

    this.rebuildEQChain();
  }

  /**
   * Set preamp gain
   */
  setPreamp(gainDb: number): void {
    if (!this.isInitialized || !this.preampNode) {
      console.warn('DSP Engine not initialized');
      return;
    }

    const clampedGain = clamp(gainDb, -20, 20);
    this.config.preamp = clampedGain;
    
    // Smooth transition to avoid clicks
    const now = this.audioContext!.currentTime;
    this.preampNode.gain.setValueAtTime(this.preampNode.gain.value, now);
    this.preampNode.gain.linearRampToValueAtTime(
      this.dbToGain(clampedGain),
      now + 0.05
    );

    console.log(`🔊 Preamp: ${clampedGain.toFixed(1)} dB`);
  }

  /**
   * Set vocal processing mode
   */
  setVocalMode(mode: VocalMode): void {
    if (!this.isInitialized) {
      this.config.vocalMode = mode;
      return;
    }

    if (this.config.vocalMode === mode) return;

    this.config.vocalMode = mode;
    console.log(`🎤 Vocal Mode: ${mode}`);
    
    this.rebuildEQChain();
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    if (!this.masterGainNode || !this.audioContext) {
      return;
    }
    
    // Smooth transition
    const now = this.audioContext.currentTime;
    this.masterGainNode.gain.cancelScheduledValues(now);
    this.masterGainNode.gain.setValueAtTime(this.masterGainNode.gain.value, now);
    this.masterGainNode.gain.linearRampToValueAtTime(clamp(volume, 0, 1), now + 0.1);
  }

  /**
   * Enable or disable DSP processing
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    if (enabled) {
      this.rebuildEQChain();
      console.log('✅ DSP processing enabled');
    } else {
      this.bypassChain();
      console.log('⏸️  DSP processing bypassed');
    }
  }

  /**
   * Reset to flat response
   */
  reset(): void {
    this.config.currentPreset = 'flat';
    this.config.customBands = null;
    this.config.preamp = 0;
    this.config.enabled = false;

    if (this.isInitialized) {
      this.bypassChain();
    }

    console.log('🔄 DSP reset to flat response');
  }

  /**
   * Get current DSP configuration
   */
  getConfig(): IDSPConfig {
    return { ...this.config };
  }

  /**
   * Get all available presets
   */
  getPresets(): IEQPreset[] {
    return [...BUILTIN_PRESETS, ...this.customPresets];
  }

  /**
   * Save a custom preset
   */
  savePreset(preset: Omit<IEQPreset, 'id' | 'isBuiltIn'>): string {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newPreset: IEQPreset = {
      ...preset,
      id,
      isBuiltIn: false,
    };

    this.customPresets.push(newPreset);
    
    console.log(`💾 Saved custom preset: ${preset.name}`);
    return id;
  }

  /**
   * Delete a custom preset
   */
  deletePreset(presetId: string): void {
    const index = this.customPresets.findIndex(p => p.id === presetId);
    
    if (index === -1) {
      console.error(`Cannot delete: preset not found or is built-in`);
      return;
    }

    const deleted = this.customPresets.splice(index, 1)[0];
    
    // If this was the active preset, reset
    if (this.config.currentPreset === presetId) {
      this.reset();
    }

    console.log(`🗑️  Deleted custom preset: ${deleted.name}`);
  }

  /**
   * Restore custom presets from storage
   */
  restoreCustomPresets(presets: IEQPreset[]): void {
    this.customPresets = [...presets];
    console.log(`♻️  Restored ${presets.length} custom presets`);
  }

  /**
   * Get current audio metrics
   */
  getMetrics(): IAudioMetrics | null {
    if (!this.audioContext || !this.analyzerNode) {
      return null;
    }

    const bufferLength = this.analyzerNode.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    this.analyzerNode.getFloatFrequencyData(dataArray);

    // Calculate RMS and peak
    let sum = 0;
    let peak = -Infinity;
    
    for (let i = 0; i < dataArray.length; i++) {
      const value = dataArray[i];
      sum += value * value;
      peak = Math.max(peak, value);
    }

    const rms = Math.sqrt(sum / dataArray.length);

    return {
      sampleRate: this.audioContext.sampleRate,
      bitDepth: null, // Not available in Web Audio API
      channels: this.audioContext.destination.channelCount,
      rmsLevel: 20 * Math.log10(rms),
      peakLevel: peak,
      isClipping: peak > -0.1, // Close to 0 dBFS
      spectrum: dataArray,
    };
  }

  /**
   * Dispose
   */
  dispose(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.currentAudioElement && this.onPlayHandler) {
      this.currentAudioElement.removeEventListener('play', this.onPlayHandler);
      this.onPlayHandler = null;
    }

    // Disconnect all nodes
    this.eqNodes.forEach(node => node.disconnect());
    this.eqNodes = [];

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.preampNode) {
      this.preampNode.disconnect();
      this.preampNode = null;
    }

    if (this.analyzerNode) {
      this.analyzerNode.disconnect();
      this.analyzerNode = null;
    }
    
    if (this.masterGainNode) {
      this.masterGainNode.disconnect();
      this.masterGainNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isInitialized = false;
    this.currentAudioElement = null;

    console.log('🧹 DSP Engine disposed');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Get the current active bands (from preset or custom)
   */
  private getCurrentBands(): IEQBand[] {
    if (this.config.customBands) {
      return this.config.customBands;
    }

    if (this.config.currentPreset) {
      const preset = getPresetById(this.config.currentPreset);
      return preset ? preset.bands : [];
    }

    return [];
  }

  /**
   * Rebuild the entire EQ chain
   */
  private rebuildEQChain(): void {
    if (!this.audioContext || !this.sourceNode || !this.preampNode || !this.analyzerNode || !this.masterGainNode) {
      return;
    }

    // Disconnect old nodes
    this.eqNodes.forEach(node => node.disconnect());
    this.eqNodes = [];
    this.vocalNodes.forEach(node => node.disconnect());
    this.vocalNodes = [];
    
    this.sourceNode.disconnect();
    this.analyzerNode.disconnect();
    this.masterGainNode.disconnect();

    const bands = this.getCurrentBands();

    if (!this.config.enabled || bands.length === 0) {
      this.bypassChain();
      return;
    }

    // Create new EQ nodes
    let previousNode: AudioNode = this.sourceNode;

    // 1. Vocal Processing Stage
    if (this.config.vocalMode !== VocalMode.NORMAL) {
      previousNode = this.buildVocalStage(previousNode);
    }

    // 2. EQ Stage

    for (const band of bands) {
      if (!band.enabled) continue;

      const filter = this.audioContext.createBiquadFilter();
      
      // Configure filter
      filter.type = this.mapBandTypeToFilterType(band.type);
      filter.frequency.value = band.frequency;
      filter.Q.value = band.q;
      
      // Gain only applies to peaking, lowshelf, and highshelf
      if (band.type === EQBandType.PEAKING || 
          band.type === EQBandType.LOWSHELF || 
          band.type === EQBandType.HIGHSHELF) {
        filter.gain.value = band.gain;
      }

      // Connect to chain
      previousNode.connect(filter);
      previousNode = filter;
      
      this.eqNodes.push(filter);
    }

    // Connect to preamp
    previousNode.connect(this.preampNode);
    
    // Connect preamp to analyzer
    this.preampNode.connect(this.analyzerNode);
    
    // Connect analyzer to master gain
    this.analyzerNode.connect(this.masterGainNode);

    // Connect master gain to destination
    this.masterGainNode.connect(this.audioContext.destination);
  }

  /**
   * Bypass the EQ chain (direct connection)
   */
  private bypassChain(): void {
    if (!this.audioContext || !this.sourceNode || !this.preampNode || !this.analyzerNode || !this.masterGainNode) {
      return;
    }

    // Disconnect everything
    this.eqNodes.forEach(node => node.disconnect());
    this.sourceNode.disconnect();
    this.preampNode.disconnect();
    this.analyzerNode.disconnect();
    this.masterGainNode.disconnect();

    // Direct connection
    this.sourceNode.connect(this.preampNode);
    this.preampNode.connect(this.analyzerNode);
    this.analyzerNode.connect(this.masterGainNode);
    this.masterGainNode.connect(this.audioContext.destination);
  }

  /**
   * Map EQBandType to BiquadFilterType
   */
  private mapBandTypeToFilterType(type: EQBandType): BiquadFilterType {
    switch (type) {
      case EQBandType.LOWSHELF:
        return 'lowshelf';
      case EQBandType.HIGHSHELF:
        return 'highshelf';
      case EQBandType.PEAKING:
        return 'peaking';
      case EQBandType.LOWPASS:
        return 'lowpass';
      case EQBandType.HIGHPASS:
        return 'highpass';
      case EQBandType.NOTCH:
        return 'notch';
      case EQBandType.ALLPASS:
        return 'allpass';
      default:
        return 'peaking';
    }
  }

  /**
   * Convert dB to linear gain
   */
  private dbToGain(db: number): number {
    return Math.pow(10, db / 20);
  }

  /**
   * Build the vocal processing stage
   */
  private buildVocalStage(inputNode: AudioNode): AudioNode {
    if (!this.audioContext) return inputNode;

    const splitter = this.audioContext.createChannelSplitter(2);
    const merger = this.audioContext.createChannelMerger(2);
    
    this.vocalNodes.push(splitter, merger);
    inputNode.connect(splitter);

    if (this.config.vocalMode === VocalMode.KARAOKE) {
      // KARAOKE: Remove Center (Mid) by using Side signal (L-R)
      // L_out = L - R
      // R_out = R - L
      
      const lPos = this.audioContext.createGain();
      const rNeg = this.audioContext.createGain();
      const rPos = this.audioContext.createGain();
      const lNeg = this.audioContext.createGain();
      
      lPos.gain.value = 1;
      rNeg.gain.value = -1;
      rPos.gain.value = 1;
      lNeg.gain.value = -1;
      
      this.vocalNodes.push(lPos, rNeg, rPos, lNeg);
      
      // Creating L - R for Left Output
      splitter.connect(lPos, 0); // L -> lPos
      splitter.connect(rNeg, 1); // R -> rNeg
      lPos.connect(merger, 0, 0);
      rNeg.connect(merger, 0, 0);
      
      // Creating R - L for Right Output
      splitter.connect(rPos, 1); // R -> rPos
      splitter.connect(lNeg, 0); // L -> lNeg
      rPos.connect(merger, 0, 1);
      lNeg.connect(merger, 0, 1);
      
      return merger;

    } else if (this.config.vocalMode === VocalMode.MUSICIAN) {
      // MUSICIAN: Isolate Center (Mid) = (L+R)/2 + Bandpass
      
      const sumGain = this.audioContext.createGain();
      sumGain.gain.value = 0.5; // Average L+R
      
      // Bandpass to focus on vocal range (approx 300Hz - 3400Hz)
      // Using 1kHz Center with wide Q
      const bandpass = this.audioContext.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1000;
      bandpass.Q.value = 0.5; 

      // Highpass to remove low rumble
      const highpass = this.audioContext.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 200;

      this.vocalNodes.push(sumGain, bandpass, highpass);
      
      // Mix L and R into sumGain
      splitter.connect(sumGain, 0);
      splitter.connect(sumGain, 1);
      
      sumGain.connect(highpass);
      highpass.connect(bandpass);
      
      // Output Mono to both channels
      bandpass.connect(merger, 0, 0);
      bandpass.connect(merger, 0, 1);
      
      return merger;
    }
    
    return inputNode;
  }
}
