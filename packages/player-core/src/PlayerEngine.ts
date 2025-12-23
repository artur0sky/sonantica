/**
 * PlayerEngine - Core audio playback implementation
 * 
 * This is a minimal "Hello World" implementation using Web Audio API.
 * It demonstrates the architecture without full functionality.
 * 
 * Philosophy: "Audio playback is the core, UI is a consequence."
 */

import {
  PlaybackState,
  type MediaSource,
  type PlaybackStatus,
  type PlayerEvent,
  PLAYER_EVENTS,
  DEFAULT_VOLUME,
  clamp,
} from '@sonantica/shared';
import type { IPlayerEngine } from './contracts';

/**
 * Event listener type
 */
type EventListener = (event: PlayerEvent) => void;

/**
 * Core player engine implementation
 * 
 * Responsibilities:
 * - Audio decoding and playback
 * - State management
 * - Event emission
 * 
 * Does NOT:
 * - Render UI
 * - Make platform-specific calls directly
 * - Contain business logic
 */
export class PlayerEngine implements IPlayerEngine {
  private audio: HTMLAudioElement | null = null;
  private state: PlaybackState = PlaybackState.IDLE;
  private volume: number = DEFAULT_VOLUME;
  private isMuted: boolean = false;
  private listeners: Map<string, Set<EventListener>> = new Map();

  constructor() {
    console.log('🎵 Sonántica Player Core initialized');
    console.log('   "Every file has an intention."');
  }

  /**
   * Load a media source
   */
  async load(source: MediaSource): Promise<void> {
    try {
      this.setState(PlaybackState.LOADING);

      // Clean up previous audio element (but keep listeners!)
      if (this.audio) {
        this.cleanupAudio();
      }

      // Create new audio element
      this.audio = new Audio(source.url);
      this.audio.volume = this.volume;
      this.audio.muted = this.isMuted;

      // Attach event listeners
      this.attachAudioListeners();

      // Wait for metadata to load
      await new Promise<void>((resolve, reject) => {
        if (!this.audio) {
          reject(new Error('Audio element not initialized'));
          return;
        }

        this.audio.addEventListener('loadedmetadata', () => resolve(), { once: true });
        this.audio.addEventListener('error', () => reject(new Error('Failed to load audio')), { once: true });
      });

      this.setState(PlaybackState.STOPPED);
      this.emit(PLAYER_EVENTS.LOADED, { source });

      console.log(`✅ Loaded: ${source.metadata?.title || source.url}`);
    } catch (error) {
      this.setState(PlaybackState.ERROR);
      this.emit(PLAYER_EVENTS.ERROR, { error });
      throw error;
    }
  }

  /**
   * Start playback
   */
  async play(): Promise<void> {
    if (!this.audio) {
      throw new Error('No media loaded');
    }

    try {
      await this.audio.play();
      this.setState(PlaybackState.PLAYING);
      console.log('▶️  Playing');
    } catch (error) {
      this.setState(PlaybackState.ERROR);
      this.emit(PLAYER_EVENTS.ERROR, { error });
      throw error;
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.audio) {
      return;
    }

    this.audio.pause();
    this.setState(PlaybackState.PAUSED);
    console.log('⏸️  Paused');
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (!this.audio) {
      return;
    }

    this.audio.pause();
    this.audio.currentTime = 0;
    this.setState(PlaybackState.STOPPED);
    console.log('⏹️  Stopped');
  }

  /**
   * Seek to time
   */
  seek(time: number): void {
    if (!this.audio) {
      return;
    }

    const clampedTime = clamp(time, 0, this.audio.duration || 0);
    this.audio.currentTime = clampedTime;
    this.emit(PLAYER_EVENTS.TIME_UPDATE, { currentTime: clampedTime });
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    this.volume = clamp(volume, 0, 1);

    if (this.audio) {
      this.audio.volume = this.volume;
    }

    this.emit(PLAYER_EVENTS.VOLUME_CHANGE, { volume: this.volume });
    console.log(`🔊 Volume: ${Math.round(this.volume * 100)}%`);
  }

  /**
   * Set muted state
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;

    if (this.audio) {
      this.audio.muted = muted;
    }

    this.emit(PLAYER_EVENTS.VOLUME_CHANGE, { muted });
    console.log(muted ? '🔇 Muted' : '🔊 Unmuted');
  }

  /**
   * Get current status
   */
  getStatus(): PlaybackStatus {
    return {
      state: this.state,
      currentTime: this.audio?.currentTime || 0,
      duration: this.audio?.duration || 0,
      volume: this.volume,
      isMuted: this.isMuted,
    };
  }

  /**
   * Subscribe to events
   */
  on(eventType: string, callback: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  /**
   * Cleanup audio element only (keeps event listeners)
   */
  private cleanupAudio(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }

  /**
   * Get the internal audio element
   */
  getAudioElement(): HTMLAudioElement | null {
    return this.audio;
  }

  /**
   * Full cleanup (including listeners)
   */
  dispose(): void {
    this.cleanupAudio();
    this.listeners.clear();
    this.setState(PlaybackState.IDLE);
    console.log('🧹 Player disposed');
  }

  /**
   * Attach listeners to audio element
   */
  private attachAudioListeners(): void {
    if (!this.audio) {
      return;
    }

    this.audio.addEventListener('timeupdate', () => {
      this.emit(PLAYER_EVENTS.TIME_UPDATE, {
        currentTime: this.audio!.currentTime,
        duration: this.audio!.duration,
      });
    });

    this.audio.addEventListener('ended', () => {
      this.setState(PlaybackState.STOPPED);
      this.emit(PLAYER_EVENTS.ENDED, {});
      console.log('✅ Playback ended');
    });

    this.audio.addEventListener('error', (e) => {
      this.setState(PlaybackState.ERROR);
      this.emit(PLAYER_EVENTS.ERROR, { error: e });
      console.error('❌ Playback error:', e);
    });
  }

  /**
   * Update state and emit event
   */
  private setState(newState: PlaybackState): void {
    const oldState = this.state;
    this.state = newState;

    if (oldState !== newState) {
      this.emit(PLAYER_EVENTS.STATE_CHANGE, { oldState, newState });
    }
  }

  /**
   * Emit an event to all listeners
   */
  private emit(eventType: string, data?: unknown): void {
    const event: PlayerEvent = {
      type: eventType,
      timestamp: Date.now(),
      data,
    };

    this.listeners.get(eventType)?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    });
  }
}
