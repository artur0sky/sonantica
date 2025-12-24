/**
 * @sonantica/dsp - Built-in EQ Presets
 * 
 * "Fidelity should not be imposed, it should be offered."
 * 
 * Professional EQ presets designed with care.
 * Each preset has a clear purpose and transparent effect.
 */

import { EQBandType, type IEQPreset, type IEQBand } from './contracts';

/**
 * Create a standard 10-band parametric EQ structure
 */
const createStandardBands = (gains: number[]): IEQBand[] => {
  const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  
  return frequencies.map((freq, index) => ({
    id: `band-${index}`,
    type: index === 0 ? EQBandType.LOWSHELF :
          index === frequencies.length - 1 ? EQBandType.HIGHSHELF :
          EQBandType.PEAKING,
    frequency: freq,
    gain: gains[index] || 0,
    q: 1.0,
    enabled: true,
  }));
};

/**
 * Flat Response - Reference preset
 * "Respect the intention of the sound."
 */
export const PRESET_FLAT: IEQPreset = {
  id: 'flat',
  name: 'Flat',
  description: 'No processing. Pure, unaltered sound as the artist intended.',
  bands: createStandardBands([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  preamp: 0,
  isBuiltIn: true,
};

/**
 * Bass Boost - Enhanced low-end
 * For when you need that extra thump without muddiness.
 */
export const PRESET_BASS_BOOST: IEQPreset = {
  id: 'bass-boost',
  name: 'Bass Boost',
  description: 'Enhanced low frequencies for impactful bass without sacrificing clarity.',
  bands: createStandardBands([6, 5, 3, 1, 0, 0, 0, 0, 0, 0]),
  preamp: -3, // Compensate for added gain
  isBuiltIn: true,
};

/**
 * V-Shape - Modern "smile curve"
 * Popular for electronic music and modern productions.
 */
export const PRESET_V_SHAPE: IEQPreset = {
  id: 'v-shape',
  name: 'V-Shape',
  description: 'Boosted lows and highs with recessed mids. Popular for electronic and modern music.',
  bands: createStandardBands([5, 4, 2, 0, -2, -3, -2, 2, 4, 5]),
  preamp: -3,
  isBuiltIn: true,
};

/**
 * Vocal Presence - Clarity for voice
 * Emphasizes the human voice frequency range.
 */
export const PRESET_VOCAL: IEQPreset = {
  id: 'vocal',
  name: 'Vocal Presence',
  description: 'Enhanced clarity and presence for vocals, podcasts, and spoken word.',
  bands: createStandardBands([0, 0, 0, 2, 3, 4, 3, 1, 0, 0]),
  preamp: -2,
  isBuiltIn: true,
};

/**
 * Acoustic - Natural warmth
 * For acoustic instruments and organic recordings.
 */
export const PRESET_ACOUSTIC: IEQPreset = {
  id: 'acoustic',
  name: 'Acoustic',
  description: 'Warm, natural sound ideal for acoustic instruments and live recordings.',
  bands: createStandardBands([2, 1, 0, 1, 2, 1, 0, 1, 2, 1]),
  preamp: -1,
  isBuiltIn: true,
};

/**
 * Rock - Punchy and aggressive
 * Emphasizes guitar and drum frequencies.
 */
export const PRESET_ROCK: IEQPreset = {
  id: 'rock',
  name: 'Rock',
  description: 'Punchy mids and crisp highs for rock, metal, and aggressive music.',
  bands: createStandardBands([3, 2, 0, 1, 3, 4, 3, 2, 3, 2]),
  preamp: -2,
  isBuiltIn: true,
};

/**
 * Classical - Balanced and refined
 * Preserves the natural dynamics of orchestral music.
 */
export const PRESET_CLASSICAL: IEQPreset = {
  id: 'classical',
  name: 'Classical',
  description: 'Balanced response that preserves the natural dynamics of orchestral music.',
  bands: createStandardBands([0, 0, 0, 1, 1, 0, 1, 1, 2, 1]),
  preamp: 0,
  isBuiltIn: true,
};

/**
 * Electronic - Modern and bright
 * For EDM, synthwave, and electronic productions.
 */
export const PRESET_ELECTRONIC: IEQPreset = {
  id: 'electronic',
  name: 'Electronic',
  description: 'Bright, energetic sound for EDM, synthwave, and electronic music.',
  bands: createStandardBands([4, 3, 1, 0, -1, 0, 2, 3, 4, 5]),
  preamp: -3,
  isBuiltIn: true,
};

/**
 * Jazz - Smooth and warm
 * Emphasizes the warmth of brass and the clarity of upright bass.
 */
export const PRESET_JAZZ: IEQPreset = {
  id: 'jazz',
  name: 'Jazz',
  description: 'Warm mids and smooth highs perfect for jazz, blues, and soul.',
  bands: createStandardBands([1, 2, 2, 3, 2, 1, 2, 2, 1, 0]),
  preamp: -1,
  isBuiltIn: true,
};

/**
 * Treble Boost - Crisp highs
 * For adding air and sparkle to dull recordings.
 */
export const PRESET_TREBLE_BOOST: IEQPreset = {
  id: 'treble-boost',
  name: 'Treble Boost',
  description: 'Enhanced high frequencies for added clarity and air.',
  bands: createStandardBands([0, 0, 0, 0, 0, 0, 2, 4, 5, 6]),
  preamp: -3,
  isBuiltIn: true,
};

/**
 * Headphone Compensation - Reduced harshness
 * Compensates for typical headphone frequency response.
 */
export const PRESET_HEADPHONE: IEQPreset = {
  id: 'headphone',
  name: 'Headphone',
  description: 'Reduces harshness and fatigue for extended headphone listening.',
  bands: createStandardBands([1, 1, 0, 0, -1, -2, -1, 0, 1, 0]),
  preamp: 0,
  isBuiltIn: true,
};

/**
 * All built-in presets
 */
export const BUILTIN_PRESETS: IEQPreset[] = [
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
];

/**
 * Get a preset by ID
 */
export function getPresetById(id: string): IEQPreset | undefined {
  return BUILTIN_PRESETS.find(preset => preset.id === id);
}

/**
 * Get preset names for UI
 */
export function getPresetNames(): Array<{ id: string; name: string; description: string }> {
  return BUILTIN_PRESETS.map(({ id, name, description }) => ({ id, name, description }));
}
