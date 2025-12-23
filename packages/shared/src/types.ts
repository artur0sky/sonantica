/**
 * Core domain types for Sonántica
 * 
 * These types represent the fundamental concepts of audio playback.
 * They are platform-agnostic and framework-agnostic.
 */

/**
 * Represents the state of the audio player
 */
export enum PlaybackState {
  IDLE = 'idle',
  LOADING = 'loading',
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped',
  ERROR = 'error',
}

/**
 * Represents an audio source
 */
export interface MediaSource {
  /** Unique identifier for this media */
  id: string;
  
  /** URL or path to the audio file */
  url: string;
  
  /** MIME type (e.g., 'audio/flac', 'audio/mpeg') */
  mimeType?: string;
  
  /** Optional metadata */
  metadata?: MediaMetadata;
}

/**
 * Basic metadata for a media file
 */
export interface MediaMetadata {
  title?: string;
  artist?: string | string[]; // Single artist or multiple artists
  album?: string;
  duration?: number; // in seconds
  coverArt?: string; // URL or data URI
  year?: number; // Release year
  trackNumber?: number; // Track number in album
  genre?: string | string[]; // Single genre or multiple genres
  albumArtist?: string; // Primary album artist (for compilations)
  bitrate?: number; // in kbps
  sampleRate?: number; // in Hz
  bitsPerSample?: number; // bit depth
}

/**
 * Playback status information
 */
export interface PlaybackStatus {
  state: PlaybackState;
  currentTime: number; // in seconds
  duration: number; // in seconds
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
}

/**
 * Event emitted by the player
 */
export interface PlayerEvent {
  type: string;
  timestamp: number;
  data?: unknown;
}
