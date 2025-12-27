/**
 * Constants for Sonántica
 * 
 * "Fidelity is not a fad."
 */

/**
 * Application metadata
 */
export const APP_NAME = 'Sonántica';
export const APP_VERSION = '0.1.0';
export const APP_DESCRIPTION = 'Audio-first multimedia player';

/**
 * Default audio settings
 */
export const DEFAULT_VOLUME = 0.7;
export const MIN_VOLUME = 0.0;
export const MAX_VOLUME = 1.0;

/**
 * Supported audio formats (MIME types)
 */
export const SUPPORTED_FORMATS = [
  // High Fidelity
  'audio/flac',
  'audio/x-flac',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/aiff',
  'audio/x-aiff',
  
  // Common
  'audio/mpeg',
  'audio/mp3',
  'audio/aac',
  'audio/ogg',
  'audio/opus',
] as const;

/**
 * Player event types
 */
export const PLAYER_EVENTS = {
  STATE_CHANGE: 'player:state-change',
  TIME_UPDATE: 'player:time-update',
  VOLUME_CHANGE: 'player:volume-change',
  ERROR: 'player:error',
  LOADED: 'player:loaded',
  ENDED: 'player:ended',
} as const;

// Re-export animation constants
export * from './constants/animations';
