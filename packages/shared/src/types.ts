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
 * Synchronized lyrics line
 */
export interface LyricsLine {
  /** Time in milliseconds */
  time: number;
  /** Lyric text */
  text: string;
}

/**
 * Lyrics data structure
 */
export interface Lyrics {
  /** Raw lyrics text (unsynchronized) */
  text?: string;
  /** Synchronized lyrics lines (LRC format) */
  synced?: LyricsLine[];
  /** Whether lyrics are synchronized */
  isSynchronized: boolean;
  /** Language code (ISO 639-1) */
  language?: string;
  /** Source of lyrics (embedded, external, user-provided) */
  source?: 'embedded' | 'external' | 'user';
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
  lyrics?: Lyrics; // Embedded lyrics
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
  bufferedRanges: { start: number; end: number }[]; // in seconds
}

/**
 * Event emitted by the player
 */
export interface PlayerEvent {
  type: string;
  timestamp: number;
  data?: unknown;
}

// Library Configuration
export * from './types/library-config';

// Player Configuration
export * from './types/player-config';

// Library Domain (Tracks, Artists, Albums)
export * from './types/library';
