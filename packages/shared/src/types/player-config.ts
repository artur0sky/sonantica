/**
 * Player Configuration Types
 * 
 * "Respect the intention of the sound and the freedom of the listener."
 */

/**
 * Strategy for pre-buffering upcoming tracks
 */
export enum BufferStrategy {
  /** Only buffer the current track being played */
  CONSERVATIVE = 'conservative',
  
  /** Buffer current track and start loading the next one when current is near end */
  BALANCED = 'balanced',
  
  /** Proactively buffer multiple upcoming tracks and the previous track */
  AGGRESSIVE = 'aggressive',
}

/**
 * Configuration for the audio buffer management
 */
export interface BufferConfig {
  /** Buffering strategy to use */
  strategy: BufferStrategy;
  
  /** Maximum cache size for buffered audio in MB (approximate) */
  maxCacheSize: number;
  
  /** Seconds of audio to pre-buffer for upcoming tracks */
  prebufferSeconds: number;
  
  /** Whether to interrupt ongoing loads when the track changes immediately */
  interruptOnSwitch: boolean;
}

/**
 * Overall player configuration
 */
export interface PlayerConfig {
  /** Buffer settings */
  buffer: BufferConfig;
  
  /** Default volume (0.0 to 1.0) */
  defaultVolume: number;
  
  /** Whether to crossfade between tracks */
  enableCrossfade: boolean;
  
  /** Crossfade duration in seconds */
  crossfadeDuration: number;
}
