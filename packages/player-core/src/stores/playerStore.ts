/**
 * Player Store
 * 
 * Manages player state using Zustand.
 * Part of @sonantica/player-core package.
 */

import { create } from 'zustand';
import { PlayerEngine } from '../PlayerEngine';
import { useQueueStore } from './queueStore';
import { PLAYER_EVENTS } from '@sonantica/shared';
import { PlaybackState, type MediaSource } from '@sonantica/shared';

export interface PlayerState {
  // Player instance
  player: PlayerEngine;
  
  // State
  state: PlaybackState;
  currentTrack: MediaSource | null;
  currentTime: number;
  duration: number;
  buffered: number; // Buffered time in seconds
  volume: number;
  muted: boolean;
  
  // Callbacks (injected from app layer)
  onNext?: () => MediaSource | null;
  onPrevious?: () => MediaSource | null;
  
  // Actions
  loadTrack: (source: MediaSource) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  
  // Queue navigation (uses callbacks)
  next: () => Promise<void>;
  previous: () => Promise<void>;
  
  // Callback setters
  setOnNext: (callback: () => MediaSource | null) => void;
  setOnPrevious: (callback: () => MediaSource | null) => void;
  
  // Audio element accessor (for analyzer)
  getAudioElement: () => HTMLAudioElement | null;
  
  // Internal
  _initialize: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  const player = new PlayerEngine();

  return {
    player,
    state: PlaybackState.IDLE,
    currentTrack: null,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    volume: 0.7,
    muted: false,
    onNext: undefined,
    onPrevious: undefined,

    loadTrack: async (source: MediaSource) => {
      try {
        // Immediately set loading state
        set({ 
          state: PlaybackState.LOADING,
          currentTime: 0,
          duration: 0,
        });

        // First, try to extract real metadata from the file
        let enhancedSource = { ...source };
        
        try {
          // Dynamic import for optional peer dependency
          const { extractMetadata } = await import('@sonantica/metadata');
          const realMetadata = await extractMetadata(source.url);
          
          // Merge real metadata with existing metadata (real metadata takes precedence)
          enhancedSource.metadata = {
            ...source.metadata,
            ...realMetadata,
          };
          
          console.log('✅ Extracted metadata:', enhancedSource.metadata);
        } catch (metadataError) {
          console.warn('⚠️ Could not extract metadata, using fallback:', metadataError);
          // Continue with original metadata from filename parsing
        }
        
        await player.load(enhancedSource);
        set({ currentTrack: enhancedSource });
      } catch (error) {
        console.error('Failed to load track:', error);
        set({ state: PlaybackState.ERROR });
        throw error;
      }
    },

    play: async () => {
      try {
        await player.play();
      } catch (error) {
        console.error('Failed to play:', error);
        throw error;
      }
    },

    pause: () => {
      player.pause();
    },

    stop: () => {
      player.stop();
      set({ currentTrack: null });
    },

    seek: (time: number) => {
      player.seek(time);
    },

    setVolume: (volume: number) => {
      player.setVolume(volume);
      set({ volume });
    },

    toggleMute: () => {
      const { muted } = get();
      player.setMuted(!muted);
      set({ muted: !muted });
    },

    next: async () => {
      const { onNext } = get();
      if (onNext) {
        const nextTrack = onNext();
        if (nextTrack) {
          await get().loadTrack(nextTrack);
          await get().play();
        }
      }
    },

    previous: async () => {
      const { currentTime, onPrevious } = get();
      
      // If more than 3 seconds into the track, restart it
      if (currentTime > 3) {
        get().seek(0);
      } else if (onPrevious) {
        // Otherwise, go to previous track
        const prevTrack = onPrevious();
        if (prevTrack) {
          await get().loadTrack(prevTrack);
          await get().play();
        }
      }
    },

    setOnNext: (callback: () => MediaSource | null) => {
      set({ onNext: callback });
    },

    setOnPrevious: (callback: () => MediaSource | null) => {
      set({ onPrevious: callback });
    },

    getAudioElement: () => {
      return player.getAudioElement();
    },

    _initialize: () => {
      // Default wiring to queueStore
      set({
        onNext: () => useQueueStore.getState().next(),
        onPrevious: () => useQueueStore.getState().previous(),
      });

      // Subscribe to player events
      player.on(PLAYER_EVENTS.STATE_CHANGE, (event: any) => {
        set({ state: event.data.newState });
      });

      player.on(PLAYER_EVENTS.TIME_UPDATE, (event: any) => {
        set({
          currentTime: event.data.currentTime,
          duration: event.data.duration,
        });
      });

      player.on(PLAYER_EVENTS.VOLUME_CHANGE, (event: any) => {
        if (event.data.volume !== undefined) {
          set({ volume: event.data.volume });
        }
      });

      // Auto-play next track when current track ends
      player.on(PLAYER_EVENTS.ENDED, async () => {
        console.log('🎵 Track ended, playing next...');
        await get().next();
      });

      // Set initial volume
      player.setVolume(0.7);
    },
  };
});

// Initialize on store creation
usePlayerStore.getState()._initialize();
