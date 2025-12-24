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
  
  onNext?: () => MediaSource | null;
  onPrevious?: () => MediaSource | null;
  onSave?: (data: { currentTrack: MediaSource | null; currentTime: number; volume: number }) => Promise<void>;
  onLoad?: () => Promise<{ currentTrack: MediaSource | null; currentTime: number; volume: number } | null>;
  
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
  
  setOnNext: (callback: () => MediaSource | null) => void;
  setOnPrevious: (callback: () => MediaSource | null) => void;
  setOnSave: (callback: (data: { currentTrack: MediaSource | null; currentTime: number; volume: number }) => Promise<void>) => void;
  setOnLoad: (callback: () => Promise<{ currentTrack: MediaSource | null; currentTime: number; volume: number } | null>) => void;
  
  // Audio element accessor (for analyzer)
  getAudioElement: () => HTMLAudioElement | null;
  
  // Internal
  _hasRestored: boolean;
  _initialize: () => void;
  restore: () => Promise<void>;
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
    _hasRestored: false,
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
        set({ currentTrack: enhancedSource, _hasRestored: true });
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
    
    setOnSave: (callback: (data: { currentTrack: MediaSource | null; currentTime: number; volume: number }) => Promise<void>) => {
      set({ onSave: callback });
    },

    setOnLoad: (callback: () => Promise<{ currentTrack: MediaSource | null; currentTime: number; volume: number } | null>) => {
      set({ onLoad: callback });
      // Auto-trigger restore when callback is set
      get().restore();
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
        
        // Save state immediately on pause or stop
        const { currentTrack, currentTime, volume, onSave, _hasRestored } = get();
        if (_hasRestored && onSave && (event.data.newState === PlaybackState.PAUSED || event.data.newState === PlaybackState.STOPPED)) {
          // console.log('💾 Saving state on:', event.data.newState);
          onSave({ currentTrack, currentTime, volume });
        }
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

      // Periodic persistence (every 5 seconds)
      setInterval(() => {
        const { currentTrack, currentTime, volume, onSave, state, _hasRestored } = get();
        if (_hasRestored && onSave && (state === PlaybackState.PLAYING || state === PlaybackState.PAUSED)) {
          onSave({ currentTrack, currentTime, volume });
        }
      }, 5000);

      // Set initial volume
      player.setVolume(0.7);
    },

    restore: async () => {
      try {
        const { onLoad } = get();
        if (!onLoad) {
          set({ _hasRestored: true });
          return;
        }

        const cached = await onLoad();
        if (cached && cached.currentTrack) {
          console.log('🔄 [PlayerStore] Restoring session:', cached.currentTrack.metadata?.title);
          
          // Use loadTrack but we'll seek after
          await get().loadTrack(cached.currentTrack);
          
          // Force seek after load
          if (cached.currentTime > 0) {
            player.seek(cached.currentTime);
            set({ currentTime: cached.currentTime });
          }
          
          if (cached.volume !== undefined) {
            get().setVolume(cached.volume);
          }
        }
        set({ _hasRestored: true });
      } catch (error) {
        console.warn('❌ [PlayerStore] Restoration failed:', error);
        set({ _hasRestored: true });
      }
    },

  };
});

// Initialize on store creation
usePlayerStore.getState()._initialize();
