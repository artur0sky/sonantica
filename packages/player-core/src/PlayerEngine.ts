/**
 * PlayerEngine - Core audio playback implementation
 * 
 * This is a minimal "Hello World" implementation using Web Audio API.
 * It demonstrates the architecture without full functionality.
 * 
 * Philosophy: "Audio playback is the core, UI is a consequence."
 * 
 * Security: Hardened against URL injection, XSS, and resource exhaustion
 */

import {
  PlaybackState,
  type MediaSource,
  type PlaybackStatus,
  type PlayerEvent,
  PLAYER_EVENTS,
  DEFAULT_VOLUME,
  clamp,
  BufferStrategy,
  type BufferConfig,
} from '@sonantica/shared';
import type { IPlayerEngine } from './contracts';
import { BufferManager } from './services/BufferManager';

/**
 * Event listener type
 */
type EventListener = (event: PlayerEvent) => void;

/**
 * Security constants
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'blob:'];
const MAX_URL_LENGTH = 2048;
const LOAD_TIMEOUT_MS = 30000; // 30 seconds
const MAX_LISTENERS_PER_EVENT = 100;

/**
 * Security utilities
 */
class SecurityValidator {
  /**
   * Validates a media source URL to prevent injection attacks
   * @throws {Error} If URL is invalid or potentially malicious
   */
  static validateMediaURL(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL: URL must be a non-empty string');
    }

    if (url.length > MAX_URL_LENGTH) {
      throw new Error(`Invalid URL: URL exceeds maximum length of ${MAX_URL_LENGTH} characters`);
    }

    // Prevent javascript:, data:, and other potentially dangerous protocols
    try {
      const urlObj = new URL(url, window.location.origin);
      
      if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
        throw new Error(`Invalid URL protocol: ${urlObj.protocol}. Allowed protocols: ${ALLOWED_PROTOCOLS.join(', ')}`);
      }
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(`Malformed URL: ${url}`);
      }
      throw error;
    }
  }

  /**
   * Validates a MediaSource object
   * @throws {Error} If MediaSource is invalid
   */
  static validateMediaSource(source: unknown): asserts source is MediaSource {
    if (!source || typeof source !== 'object') {
      throw new Error('Invalid MediaSource: Must be an object');
    }

    const src = source as Partial<MediaSource>;
    
    if (!src.url || typeof src.url !== 'string') {
      throw new Error('Invalid MediaSource: Missing or invalid URL');
    }

    this.validateMediaURL(src.url);
  }

  /**
   * Validates numeric input
   */
  static validateNumber(value: unknown, name: string, min?: number, max?: number): number {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      throw new Error(`Invalid ${name}: Must be a finite number`);
    }

    if (min !== undefined && value < min) {
      throw new Error(`Invalid ${name}: Must be >= ${min}`);
    }

    if (max !== undefined && value > max) {
      throw new Error(`Invalid ${name}: Must be <= ${max}`);
    }

    return value;
  }
}

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
  private isDisposed: boolean = false;
  private currentLoadController: AbortController | null = null;
  private bufferManager: BufferManager;
  private highFreqLoopId: number | null = null;

  constructor(bufferConfig: Partial<BufferConfig> = {}) {
    try {
      console.log('🎵 Sonántica Player Core initialized');
      console.log('   "Every file has an intention."');
      
      this.bufferManager = new BufferManager(bufferConfig);
      
      // Initialize single audio element instance
      this.audio = new Audio();
      this.audio.crossOrigin = 'anonymous'; // Enable CORS for Web Audio API
      
      // Attach persistent listeners
      this.attachAudioListeners();
      
      // Bind methods
      this.highFreqUpdate = this.highFreqUpdate.bind(this);
    } catch (error) {
      console.error('❌ Failed to initialize PlayerEngine:', error);
      throw new Error(`PlayerEngine initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load a media source
   * @throws {Error} If source is invalid or loading fails
   */
  async load(source: MediaSource): Promise<void> {
    if (this.isDisposed) {
      throw new Error('Cannot load media: PlayerEngine has been disposed');
    }

    // Cancel any ongoing load operation in the player and buffer manager
    if (this.currentLoadController) {
      this.currentLoadController.abort();
    }
    
    this.bufferManager.cancelAllFetches();

    this.currentLoadController = new AbortController();
    const { signal } = this.currentLoadController;

    try {
      // Validate input
      SecurityValidator.validateMediaSource(source);

      this.setState(PlaybackState.LOADING);

      if (!this.audio) {
        // Should theoretically not happen if initialized in constructor
        this.audio = new Audio();
        this.audio.crossOrigin = 'anonymous'; // Enable CORS for Web Audio API
        this.attachAudioListeners();
      }

      // Reset specific properties but keep the element
      this.audio.pause();
      
      // Get secure blob URL from buffer manager
      const secureUrl = await this.bufferManager.getBufferUrl(source);
      
      // Sanitized URL assignment
      this.audio.src = secureUrl;
      this.audio.volume = this.volume;
      this.audio.muted = this.isMuted;
      this.audio.load();

      // Wait for metadata with timeout
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          if (!this.audio) {
            reject(new Error('Audio element not initialized'));
            return;
          }

          const onLoaded = () => {
            cleanup();
            resolve();
          };

          const onError = (event: Event | ErrorEvent) => {
            cleanup();
            const errorMsg = event instanceof ErrorEvent ? event.message : 'Failed to load audio';
            reject(new Error(errorMsg));
          };

          const onAbort = () => {
            cleanup();
            reject(new Error('Load operation was aborted'));
          };

          const cleanup = () => {
            this.audio?.removeEventListener('loadedmetadata', onLoaded);
            this.audio?.removeEventListener('error', onError);
            signal.removeEventListener('abort', onAbort);
          };

          this.audio.addEventListener('loadedmetadata', onLoaded, { once: true });
          this.audio.addEventListener('error', onError, { once: true });
          signal.addEventListener('abort', onAbort, { once: true });
        }),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Load timeout exceeded')), LOAD_TIMEOUT_MS);
        })
      ]);

      if (signal.aborted) {
        throw new Error('Load operation was aborted');
      }

      this.setState(PlaybackState.STOPPED);
      this.emit(PLAYER_EVENTS.LOADED, { source });

      console.log(`✅ Loaded: ${source.metadata?.title || '[Unknown]'}`);
    } catch (error) {
      this.setState(PlaybackState.ERROR);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during load';
      this.emit(PLAYER_EVENTS.ERROR, { error: errorMessage });
      
      console.error('❌ Load failed:', errorMessage);
      throw new Error(`Failed to load media: ${errorMessage}`);
    } finally {
      this.currentLoadController = null;
    }
  }

  /**
   * Proactively pre-buffer upcoming tracks
   */
  prebuffer(sources: MediaSource[]): void {
    if (this.isDisposed) return;
    this.bufferManager.prebuffer(sources).catch(err => 
      console.warn('⚠️ Player pre-buffering failed:', err)
    );
  }

  /**
   * Update buffer configuration at runtime
   */
  updateBufferConfig(config: Partial<BufferConfig>): void {
    if (this.isDisposed) return;
    this.bufferManager.updateConfig(config);
  }

  /**
   * Start playback
   * @throws {Error} If no media is loaded or playback fails
   */
  async play(): Promise<void> {
    if (this.isDisposed) {
      throw new Error('Cannot play: PlayerEngine has been disposed');
    }

    if (!this.audio) {
      throw new Error('No media loaded');
    }

    if (this.state === PlaybackState.ERROR) {
      throw new Error('Cannot play: Player is in error state');
    }

    try {
      await this.audio.play();
      this.setState(PlaybackState.PLAYING);
      this.startHighFreqLoop();
      console.log('▶️  Playing');
    } catch (error) {
      this.setState(PlaybackState.ERROR);
      const errorMessage = error instanceof Error ? error.message : 'Unknown playback error';
      this.emit(PLAYER_EVENTS.ERROR, { error: errorMessage });
      
      console.error('❌ Playback failed:', errorMessage);
      throw new Error(`Playback failed: ${errorMessage}`);
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.isDisposed) {
      console.warn('Cannot pause: PlayerEngine has been disposed');
      return;
    }

    if (!this.audio) {
      return;
    }

    try {
      this.audio.pause();
      this.setState(PlaybackState.PAUSED);
      this.stopHighFreqLoop();
      console.log('⏸️  Paused');
    } catch (error) {
      console.error('❌ Pause failed:', error);
      this.emit(PLAYER_EVENTS.ERROR, { error: error instanceof Error ? error.message : 'Pause failed' });
    }
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.isDisposed) {
      console.warn('Cannot stop: PlayerEngine has been disposed');
      return;
    }

    if (!this.audio) {
      return;
    }

    try {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.setState(PlaybackState.STOPPED);
      this.stopHighFreqLoop();
      console.log('⏹️  Stopped');
    } catch (error) {
      console.error('❌ Stop failed:', error);
      this.emit(PLAYER_EVENTS.ERROR, { error: error instanceof Error ? error.message : 'Stop failed' });
    }
  }

  /**
   * Seek to time
   * @param time - Time in seconds to seek to
   */
  seek(time: number): void {
    if (this.isDisposed) {
      console.warn('Cannot seek: PlayerEngine has been disposed');
      return;
    }

    if (!this.audio) {
      return;
    }

    try {
      SecurityValidator.validateNumber(time, 'seek time', 0);
      
      const duration = this.audio.duration || 0;
      const clampedTime = clamp(time, 0, duration);
      
      this.audio.currentTime = clampedTime;
      this.emit(PLAYER_EVENTS.TIME_UPDATE, { currentTime: clampedTime });
    } catch (error) {
      console.error('❌ Seek failed:', error);
      this.emit(PLAYER_EVENTS.ERROR, { error: error instanceof Error ? error.message : 'Seek failed' });
    }
  }

  /**
   * Set volume
   * @param volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    if (this.isDisposed) {
      console.warn('Cannot set volume: PlayerEngine has been disposed');
      return;
    }

    try {
      SecurityValidator.validateNumber(volume, 'volume', 0, 1);
      
      this.volume = clamp(volume, 0, 1);

      if (this.audio) {
        this.audio.volume = this.volume;
      }

      this.emit(PLAYER_EVENTS.VOLUME_CHANGE, { volume: this.volume });
      console.log(`🔊 Volume: ${Math.round(this.volume * 100)}%`);
    } catch (error) {
      console.error('❌ Set volume failed:', error);
      this.emit(PLAYER_EVENTS.ERROR, { error: error instanceof Error ? error.message : 'Set volume failed' });
    }
  }

  /**
   * Set muted state
   * @param muted - Whether to mute audio
   */
  setMuted(muted: boolean): void {
    if (this.isDisposed) {
      console.warn('Cannot set muted: PlayerEngine has been disposed');
      return;
    }

    try {
      if (typeof muted !== 'boolean') {
        throw new Error('Invalid muted value: Must be a boolean');
      }

      this.isMuted = muted;

      if (this.audio) {
        this.audio.muted = muted;
      }

      this.emit(PLAYER_EVENTS.VOLUME_CHANGE, { muted });
      console.log(muted ? '🔇 Muted' : '🔊 Unmuted');
    } catch (error) {
      console.error('❌ Set muted failed:', error);
      this.emit(PLAYER_EVENTS.ERROR, { error: error instanceof Error ? error.message : 'Set muted failed' });
    }
  }

  /**
   * Get current status
   */
  getStatus(): PlaybackStatus {
    try {
      const bufferedRanges: { start: number; end: number }[] = [];
      if (this.audio) {
        for (let i = 0; i < this.audio.buffered.length; i++) {
          bufferedRanges.push({
            start: this.audio.buffered.start(i),
            end: this.audio.buffered.end(i),
          });
        }
      }

      return {
        state: this.state,
        currentTime: this.audio?.currentTime || 0,
        duration: this.audio?.duration || 0,
        volume: this.volume,
        isMuted: this.isMuted,
        bufferedRanges,
      };
    } catch (error) {
      console.error('❌ Get status failed:', error);
      return {
        state: PlaybackState.ERROR,
        currentTime: 0,
        duration: 0,
        volume: this.volume,
        isMuted: this.isMuted,
        bufferedRanges: [],
      };
    }
  }

  /**
   * Subscribe to events
   * @param eventType - Type of event to listen for
   * @param callback - Callback function to invoke
   * @returns Unsubscribe function
   */
  on(eventType: string, callback: EventListener): () => void {
    if (this.isDisposed) {
      console.warn('Cannot add listener: PlayerEngine has been disposed');
      return () => {};
    }

    try {
      if (typeof eventType !== 'string' || !eventType) {
        throw new Error('Invalid event type: Must be a non-empty string');
      }

      if (typeof callback !== 'function') {
        throw new Error('Invalid callback: Must be a function');
      }

      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, new Set());
      }

      const eventListeners = this.listeners.get(eventType)!;

      // Prevent listener overflow (DoS protection)
      if (eventListeners.size >= MAX_LISTENERS_PER_EVENT) {
        console.warn(`⚠️ Maximum listeners (${MAX_LISTENERS_PER_EVENT}) reached for event: ${eventType}`);
        throw new Error(`Maximum listeners reached for event: ${eventType}`);
      }

      eventListeners.add(callback);

      // Return unsubscribe function
      return () => {
        this.listeners.get(eventType)?.delete(callback);
      };
    } catch (error) {
      console.error('❌ Failed to add event listener:', error);
      return () => {};
    }
  }

  /**
   * Cleanup audio element only (keeps event listeners)
   * @private
   */
  private cleanupAudio(): void {
    try {
      if (this.audio) {
        this.audio.pause();
        this.audio.src = '';
      }
    } catch (error) {
      console.error('❌ Audio cleanup failed:', error);
    }
  }

  /**
   * Get the internal audio element
   * @returns The audio element or null
   */
  getAudioElement(): HTMLAudioElement | null {
    if (this.isDisposed) {
      console.warn('Cannot get audio element: PlayerEngine has been disposed');
      return null;
    }
    return this.audio;
  }

  /**
   * Full cleanup (including listeners)
   */
  dispose(): void {
    if (this.isDisposed) {
      console.warn('PlayerEngine already disposed');
      return;
    }

    try {
      // Cancel any ongoing load
      if (this.currentLoadController) {
        this.currentLoadController.abort();
        this.currentLoadController = null;
      }

      // Cleanup buffer manager
      this.bufferManager.dispose();

      // Cleanup audio
      if (this.audio) {
        this.audio.pause();
        this.audio.src = '';
        this.audio = null;
      }

      this.stopHighFreqLoop();
      this.setState(PlaybackState.IDLE);
      this.isDisposed = true;
      
      console.log('🧹 Player disposed');
    } catch (error) {
      console.error('❌ Dispose failed:', error);
    }
  }

  /**
   * Attach listeners to audio element
   * @private
   */
  private attachAudioListeners(): void {
    if (!this.audio) {
      return;
    }

    try {
      this.audio.addEventListener('timeupdate', () => {
        if (!this.audio || this.isDisposed) return;
        
        try {
          this.emit(PLAYER_EVENTS.TIME_UPDATE, {
            currentTime: this.audio.currentTime,
            duration: this.audio.duration,
          });
        } catch (error) {
          console.error('❌ Time update event failed:', error);
        }
      });

      this.audio.addEventListener('progress', () => {
        if (!this.audio || this.isDisposed) return;
        
        try {
          const bufferedRanges: { start: number; end: number }[] = [];
          for (let i = 0; i < this.audio.buffered.length; i++) {
            bufferedRanges.push({
              start: this.audio.buffered.start(i),
              end: this.audio.buffered.end(i),
            });
          }
          this.emit(PLAYER_EVENTS.BUFFER_UPDATE, { bufferedRanges });
        } catch (error) {
          console.error('❌ Progress (buffer) event failed:', error);
        }
      });

      this.audio.addEventListener('ended', () => {
        if (this.isDisposed) return;
        
        try {
          this.setState(PlaybackState.STOPPED);
          this.emit(PLAYER_EVENTS.ENDED, {});
          console.log('✅ Playback ended');
        } catch (error) {
          console.error('❌ Ended event failed:', error);
        }
      });

      this.audio.addEventListener('error', (e) => {
        if (this.isDisposed) return;
        
        try {
          this.setState(PlaybackState.ERROR);
          const errorMessage = e instanceof ErrorEvent ? e.message : 'Playback error';
          this.emit(PLAYER_EVENTS.ERROR, { error: errorMessage });
          console.error('❌ Playback error:', errorMessage);
        } catch (error) {
          console.error('❌ Error event handler failed:', error);
        }
      });
    } catch (error) {
      console.error('❌ Failed to attach audio listeners:', error);
      throw error;
    }
  }

  /**
   * Update state and emit event
   * @private
   */
  private setState(newState: PlaybackState): void {
    try {
      const oldState = this.state;
      this.state = newState;

      if (oldState !== newState) {
        this.emit(PLAYER_EVENTS.STATE_CHANGE, { oldState, newState });
      }
    } catch (error) {
      console.error('❌ Set state failed:', error);
    }
  }

  /**
   * Emit an event to all listeners
   * @private
   */
  private emit(eventType: string, data?: unknown): void {
    try {
      const event: PlayerEvent = {
        type: eventType,
        timestamp: Date.now(),
        data,
      };

      this.listeners.get(eventType)?.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          console.error(`❌ Error in event listener for ${eventType}:`, error);
        }
      });
    } catch (error) {
      console.error('❌ Emit event failed:', error);
    }
  }

  /**
   * Start high-frequency update loop (60fps)
   * Essential for super-synchronized lyrics
   * @private
   */
  private startHighFreqLoop(): void {
    if (this.highFreqLoopId) return;
    this.highFreqLoopId = requestAnimationFrame(this.highFreqUpdate);
  }

  /**
   * Stop high-frequency update loop
   * @private
   */
  private stopHighFreqLoop(): void {
    if (this.highFreqLoopId) {
      cancelAnimationFrame(this.highFreqLoopId);
      this.highFreqLoopId = null;
    }
  }

  /**
   * High-frequency update handler
   * @private
   */
  private highFreqUpdate(): void {
    if (!this.audio || this.isDisposed || this.state !== PlaybackState.PLAYING) {
      this.highFreqLoopId = null;
      return;
    }

    try {
      this.emit(PLAYER_EVENTS.TIME_UPDATE, {
        currentTime: this.audio.currentTime,
        duration: this.audio.duration,
      });
    } catch (error) {
      console.warn('⚠️ High-freq update failed:', error);
    }

    this.highFreqLoopId = requestAnimationFrame(this.highFreqUpdate);
  }
}
