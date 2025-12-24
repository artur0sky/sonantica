/**
 * @sonantica/dsp - DSP Store
 * 
 * Zustand store for DSP state management.
 * Provides reactive state for UI components.
 */

import { create } from 'zustand';
import type { IDSPConfig, IEQPreset, IEQBand, IAudioMetrics } from '../contracts';
import { DSPEngine } from '../DSPEngine';
import { BUILTIN_PRESETS } from '../presets';

/**
 * DSP Store State
 */
export interface DSPState {
  // Engine instance
  engine: DSPEngine | null;
  
  // Configuration
  config: IDSPConfig;
  
  // Available presets
  presets: IEQPreset[];
  
  // Current metrics
  metrics: IAudioMetrics | null;
  
  // Initialization state
  isInitialized: boolean;
  
  // Actions
  initialize: (audioElement: HTMLAudioElement) => Promise<void>;
  applyPreset: (presetId: string) => void;
  applyCustomEQ: (bands: IEQBand[]) => void;
  updateBand: (bandId: string, updates: Partial<IEQBand>) => void;
  setPreamp: (gainDb: number) => void;
  setEnabled: (enabled: boolean) => void;
  reset: () => void;
  savePreset: (preset: Omit<IEQPreset, 'id' | 'isBuiltIn'>) => string;
  deletePreset: (presetId: string) => void;
  updateMetrics: () => void;
  dispose: () => void;
}

/**
 * Create DSP store
 */
export const useDSPStore = create<DSPState>((set, get) => ({
  engine: null,
  config: {
    enabled: false,
    currentPreset: 'flat',
    customBands: null,
    preamp: 0,
    replayGainMode: 'off',
    replayGainPreamp: 0,
    crossfeedEnabled: false,
    crossfeedStrength: 0.5,
  },
  presets: BUILTIN_PRESETS,
  metrics: null,
  isInitialized: false,

  /**
   * Initialize the DSP engine
   */
  initialize: async (audioElement: HTMLAudioElement) => {
    const engine = new DSPEngine();
    await engine.initialize(audioElement);
    
    // Apply current store config to the new engine
    const { config } = get();
    
    // 1. Set Preamp
    engine.setPreamp(config.preamp);
    
    // 2. Apply Preset or Custom Bands
    if (config.currentPreset) {
      engine.applyPreset(config.currentPreset);
    } else if (config.customBands) {
      engine.applyCustomEQ(config.customBands);
    }
    
    // 3. Set Enabled State
    engine.setEnabled(config.enabled);

    set({
      engine,
      isInitialized: true,
      // We don't overwrite config here to preserve user settings
      presets: engine.getPresets(),
    });
  },

  /**
   * Apply an EQ preset
   */
  applyPreset: (presetId: string) => {
    const { engine, presets } = get();
    
    // Update local state immediately
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    set(state => ({
      config: {
        ...state.config,
        currentPreset: presetId,
        customBands: null,
        preamp: preset.preamp
      }
    }));

    // Sync to engine if available
    if (engine) {
      engine.applyPreset(presetId);
    }
  },

  /**
   * Apply custom EQ bands
   */
  applyCustomEQ: (bands: IEQBand[]) => {
    const { engine } = get();

    // Update local state
    set(state => ({
      config: {
        ...state.config,
        customBands: bands,
        currentPreset: null
      }
    }));

    // Sync to engine
    if (engine) {
      engine.applyCustomEQ(bands);
    }
  },

  /**
   * Update a single EQ band
   */
  updateBand: (bandId: string, updates: Partial<IEQBand>) => {
    const { engine, config, presets } = get();
    let newBands: IEQBand[] = [];

    // Determine current bands logic (duplicated from DSPEngine/EQSidebar to allow offline editing)
    if (config.customBands) {
      newBands = [...config.customBands];
    } else if (config.currentPreset) {
      const preset = presets.find(p => p.id === config.currentPreset);
      if (preset) {
        // Deep copy to detach from preset reference
        newBands = JSON.parse(JSON.stringify(preset.bands));
      }
    }

    if (newBands.length === 0) return;

    const bandIndex = newBands.findIndex(b => b.id === bandId);
    if (bandIndex === -1) return;

    // Apply update
    newBands[bandIndex] = { ...newBands[bandIndex], ...updates };

    // Update State (Switching to custom mode automatically)
    set(state => ({
      config: {
        ...state.config,
        customBands: newBands,
        currentPreset: null
      }
    }));

    // Sync Engine
    if (engine) {
      // We essentially just applied a custom EQ
      engine.applyCustomEQ(newBands);
    }
  },

  /**
   * Set preamp gain
   */
  setPreamp: (gainDb: number) => {
    const { engine } = get();

    set(state => ({
      config: {
        ...state.config,
        preamp: gainDb
      }
    }));

    if (engine) {
      engine.setPreamp(gainDb);
    }
  },

  /**
   * Enable or disable DSP processing
   */
  setEnabled: (enabled: boolean) => {
    const { engine } = get();

    set(state => ({
      config: {
        ...state.config,
        enabled
      }
    }));

    if (engine) {
      engine.setEnabled(enabled);
    }
  },

  /**
   * Reset to flat response
   */
  reset: () => {
    const { engine } = get();

    set(state => ({
      config: {
        ...state.config,
        enabled: false,
        currentPreset: 'flat',
        customBands: null,
        preamp: 0
      }
    }));

    if (engine) {
      engine.reset();
    }
  },

  /**
   * Save a custom preset
   */
  savePreset: (preset: Omit<IEQPreset, 'id' | 'isBuiltIn'>) => {
    const { engine } = get();
    // This requires engine for ID generation logic currently in DSPEngine
    // For now we keep it engine-dependent or move logic here.
    // Ideally logic moves here, but strictly following refactor:
    if (!engine) return ''; 

    const id = engine.savePreset(preset);
    
    set({
      presets: engine.getPresets(),
    });

    return id;
  },

  /**
   * Delete a custom preset
   */
  deletePreset: (presetId: string) => {
    const { engine } = get();
    if (!engine) return;

    engine.deletePreset(presetId);
    
    set({
      config: engine.getConfig(),
      presets: engine.getPresets(),
    });
  },

  /**
   * Update audio metrics
   */
  updateMetrics: () => {
    const { engine } = get();
    if (!engine) return;

    const metrics = engine.getMetrics();
    
    set({ metrics });
  },

  /**
   * Cleanup and dispose
   */
  dispose: () => {
    const { engine } = get();
    if (!engine) return;

    engine.dispose();
    
    set({
      engine: null,
      isInitialized: false,
      metrics: null,
    });
  },
}));
