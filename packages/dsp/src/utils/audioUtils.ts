import { EQBandType } from '../contracts';

/**
 * Convert dB to linear gain
 */
export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Map EQBandType to BiquadFilterType
 */
export function mapBandTypeToFilterType(type: EQBandType): BiquadFilterType {
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
