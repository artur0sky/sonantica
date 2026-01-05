/**
 * Contracts (Interfaces) for the Player Core
 * 
 * These define the public API that the core exposes.
 * All communication between layers is by contract.
 */

import type { MediaSource, PlaybackStatus, PlayerEvent, BufferConfig } from '@sonantica/shared';

/**
 * Main interface for the audio player engine
 * 
 * This is the contract that all player implementations must follow.
 */
export interface IPlayerEngine {
  /**
   * Load a media source for playback
   */
  load(source: MediaSource): Promise<void>;

  /**
   * Proactively pre-buffer upcoming tracks
   */
  prebuffer(sources: MediaSource[]): void;

  /**
   * Update buffer configuration at runtime
   */
  updateBufferConfig(config: Partial<BufferConfig>): void;

  /**
   * Start or resume playback
   */
  play(): Promise<void>;

  /**
   * Pause playback
   */
  pause(): void;

  /**
   * Stop playback and reset position
   */
  stop(): void;

  /**
   * Seek to a specific time (in seconds)
   */
  seek(time: number): void;

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void;

  /**
   * Mute or unmute audio
   */
  setMuted(muted: boolean): void;

  /**
   * Get current playback status
   */
  getStatus(): PlaybackStatus;

  /**
   * Subscribe to player events
   * @returns Unsubscribe function
   */
  on(eventType: string, callback: (event: PlayerEvent) => void): () => void;

  /**
   * Get the internal audio element (for analysis/visualization)
   */
  getAudioElement(): HTMLAudioElement | null;

  /**
   * Cleanup and release resources
   */
  dispose(): void;
}
