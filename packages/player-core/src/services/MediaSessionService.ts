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
    this.isSupported = 'mediaSession' in navigator;
    
    if (!this.isSupported) {
      console.warn('⚠️ Media Session API not supported in this browser');
    } else {
      console.log('✅ Media Session API initialized');
    }
  }

  /**
   * Update metadata for the current track
   */
  updateMetadata(track: MediaSource | null): void {
    if (!this.isSupported || !track) {
      return;
    }

    try {
      const metadata = track.metadata;
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata?.title || 'Unknown Track',
        artist: this.formatArtists(metadata?.artist),
        album: metadata?.album || 'Unknown Album',
        artwork: metadata?.coverArt ? [
          { src: metadata.coverArt, sizes: '96x96', type: 'image/jpeg' },
          { src: metadata.coverArt, sizes: '128x128', type: 'image/jpeg' },
          { src: metadata.coverArt, sizes: '192x192', type: 'image/jpeg' },
          { src: metadata.coverArt, sizes: '256x256', type: 'image/jpeg' },
          { src: metadata.coverArt, sizes: '384x384', type: 'image/jpeg' },
          { src: metadata.coverArt, sizes: '512x512', type: 'image/jpeg' },
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
        navigator.mediaSession.setPositionState({
          duration: duration || 0,
          playbackRate,
          position: Math.min(currentTime, duration) || 0,
        });
      }
    } catch (error) {
      // Position state might not be supported on all browsers
      // This is not critical, so we just log it
      console.debug('Position state not supported:', error);
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
      if (handlers.onPlay) {
        navigator.mediaSession.setActionHandler('play', handlers.onPlay);
      }

      if (handlers.onPause) {
        navigator.mediaSession.setActionHandler('pause', handlers.onPause);
      }

      if (handlers.onStop) {
        navigator.mediaSession.setActionHandler('stop', handlers.onStop);
      }

      // Track navigation
      if (handlers.onPreviousTrack) {
        navigator.mediaSession.setActionHandler('previoustrack', handlers.onPreviousTrack);
      }

      if (handlers.onNextTrack) {
        navigator.mediaSession.setActionHandler('nexttrack', handlers.onNextTrack);
      }

      // Seeking
      if (handlers.onSeekBackward) {
        navigator.mediaSession.setActionHandler('seekbackward', handlers.onSeekBackward);
      }

      if (handlers.onSeekForward) {
        navigator.mediaSession.setActionHandler('seekforward', handlers.onSeekForward);
      }

      if (handlers.onSeekTo) {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined && handlers.onSeekTo) {
            handlers.onSeekTo(details.seekTime);
          }
        });
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

      // Clear all action handlers
      const actions: MediaSessionAction[] = [
        'play',
        'pause',
        'stop',
        'seekbackward',
        'seekforward',
        'previoustrack',
        'nexttrack',
        'seekto',
      ];

      actions.forEach((action) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (e) {
          // Some actions might not be supported
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
   * Check if Media Session API is supported
   */
  isMediaSessionSupported(): boolean {
    return this.isSupported;
  }
}

// Singleton instance
export const mediaSessionService = new MediaSessionService();
