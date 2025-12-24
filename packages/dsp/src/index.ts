/**
 * @sonantica/dsp
 * 
 * Professional DSP (Digital Signal Processing) engine.
 * Parametric EQ, preamp, and audio effects.
 * 
 * "If a function alters the sound, it must be optional, explainable, and reversible."
 * "Fidelity should not be imposed, it should be offered."
 */

// Core engine
export { DSPEngine } from './DSPEngine';

// Contracts and types
export * from './contracts';
export type {
  IDSPEngine,
  IDSPConfig,
  IEQBand,
  IEQPreset,
  IAudioMetrics,
} from './contracts';
export { EQBandType } from './contracts';

// Presets
export {
  BUILTIN_PRESETS,
  PRESET_FLAT,
  PRESET_BASS_BOOST,
  PRESET_V_SHAPE,
  PRESET_VOCAL,
  PRESET_ACOUSTIC,
  PRESET_ROCK,
  PRESET_CLASSICAL,
  PRESET_ELECTRONIC,
  PRESET_JAZZ,
  PRESET_TREBLE_BOOST,
  PRESET_HEADPHONE,
  getPresetById,
  getPresetNames,
} from './presets';

// Store
export { useDSPStore } from './stores/dspStore';
export type { DSPState } from './stores/dspStore';
