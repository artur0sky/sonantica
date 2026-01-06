/**
 * Media Session Service
 * 
 * Integrates with the browser's Media Session API for:
 * - Lockscreen controls (mobile)
 * - Media keys (desktop)
 * - Headset/Bluetooth controls
 * - System media notifications
 * 
 * Philosophy: "Respect the intention of the sound and the freedom of the listener."
 */

import type { MediaSource } from '@sonantica/shared';

export interface MediaSessionHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onSeekBackward?: () => void;
  onSeekForward?: () => void;
  onPreviousTrack?: () => void;
  onNextTrack?: () => void;
  onSeekTo?: (time: number) => void;
}

export class MediaSessionService {
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'mediaSession' in navigator;
    
    if (!this.isSupported) {
      console.warn('⚠️ Media Session API not supported in this environment');
    } else {
      console.log('✅ Media Session API initialized');
    }
  }

  /**
   * Update metadata for the current track
   */
  updateMetadata(track: MediaSource | null): void {
    if (!this.isSupported || !track) {
      if (!track && this.isSupported) {
        navigator.mediaSession.metadata = null;
      }
      return;
    }

    try {
      const metadata = track.metadata;
      const artworkUrl = this.getAbsoluteUrl(metadata?.coverArt);
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata?.title || 'Unknown Track',
        artist: this.formatArtists(metadata?.artist),
        album: metadata?.album || 'Unknown Album',
        artwork: artworkUrl ? [
          { src: artworkUrl, sizes: '96x96' },
          { src: artworkUrl, sizes: '128x128' },
          { src: artworkUrl, sizes: '192x192' },
          { src: artworkUrl, sizes: '256x256' },
          { src: artworkUrl, sizes: '384x384' },
          { src: artworkUrl, sizes: '512x512' },
        ] : [],
      });

      console.log(`🎵 Media Session updated: ${metadata?.title || 'Unknown'}`);
    } catch (error) {
      console.error('Failed to update media session metadata:', error);
    }
  }

  /**
   * Update playback state
   */
  updatePlaybackState(state: 'none' | 'paused' | 'playing'): void {
    if (!this.isSupported) {
      return;
    }

    try {
      navigator.mediaSession.playbackState = state;
      console.debug(`State updated to: ${state}`);
    } catch (error) {
      console.error('Failed to update playback state:', error);
    }
  }

  /**
   * Update position state (for seek bar in notifications)
   */
  updatePositionState(duration: number, currentTime: number, playbackRate: number = 1.0): void {
    if (!this.isSupported) {
      return;
    }

    try {
      if ('setPositionState' in navigator.mediaSession) {
        // Ensure values are finite and valid
        const safeDuration = isFinite(duration) && duration > 0 ? duration : 0;
        const safePosition = isFinite(currentTime) && currentTime >= 0 ? Math.min(currentTime, safeDuration) : 0;
        
        navigator.mediaSession.setPositionState({
          duration: safeDuration,
          playbackRate: playbackRate || 1.0,
          position: safePosition,
        });
      }
    } catch (error) {
      console.debug('Position state update failed:', error);
    }
  }

  /**
   * Register action handlers
   */
  setActionHandlers(handlers: MediaSessionHandlers): void {
    if (!this.isSupported) {
      return;
    }

    try {
      // Basic playback controls
      const actionMap: Record<string, (() => void) | undefined> = {
        'play': handlers.onPlay,
        'pause': handlers.onPause,
        'stop': handlers.onStop,
        'previoustrack': handlers.onPreviousTrack,
        'nexttrack': handlers.onNextTrack,
        'seekbackward': handlers.onSeekBackward,
        'seekforward': handlers.onSeekForward,
      };

      Object.entries(actionMap).forEach(([action, handler]) => {
        try {
          if (handler) {
            navigator.mediaSession.setActionHandler(action as MediaSessionAction, handler);
          } else {
            navigator.mediaSession.setActionHandler(action as MediaSessionAction, null);
          }
        } catch (e) {
          console.debug(`Action ${action} not supported by this browser`);
        }
      });

      // Special case for seekto
      if (handlers.onSeekTo) {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined && handlers.onSeekTo) {
            handlers.onSeekTo(details.seekTime);
          }
        });
      } else {
        navigator.mediaSession.setActionHandler('seekto', null);
      }

      console.log('✅ Media Session action handlers registered');
    } catch (error) {
      console.error('Failed to set action handlers:', error);
    }
  }

  /**
   * Clear all handlers and metadata
   */
  clear(): void {
    if (!this.isSupported) {
      return;
    }

    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';

      // Clear all possible action handlers
      const actions: MediaSessionAction[] = [
        'play',
        'pause',
        'stop',
        'seekbackward',
        'seekforward',
        'previoustrack',
        'nexttrack',
        'seekto',
        'skipad',
      ];

      actions.forEach((action) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (e) {
          // ignore unsupported
        }
      });

      console.log('🧹 Media Session cleared');
    } catch (error) {
      console.error('Failed to clear media session:', error);
    }
  }

  /**
   * Format artists for display
   */
  private formatArtists(artist: string | string[] | undefined): string {
    if (!artist) {
      return 'Unknown Artist';
    }

    if (Array.isArray(artist)) {
      return artist.join(', ');
    }

    return artist;
  }

  /**
   * Ensure URL is absolute for system notifications
   */
  private getAbsoluteUrl(url?: string): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    
    // Resolve relative URL
    try {
      return new URL(url, window.location.origin).href;
    } catch (e) {
      return url;
    }
  }

  /**
   * Check if Media Session API is supported
   */
  isMediaSessionSupported(): boolean {
    return this.isSupported;
  }
}

// Singleton instance
export const mediaSessionService = new MediaSessionService();
