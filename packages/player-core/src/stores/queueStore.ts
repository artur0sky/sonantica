/**
 * Queue Store
 * 
 * Manages playback queue and shuffle state.
 * Follows Sonántica's philosophy: "User autonomy" - full control over playback.
 */

import { create } from 'zustand';
import type { MediaSource } from '@sonantica/shared';

export type RepeatMode = 'off' | 'all' | 'one';

export interface QueueState {
  // Queue data
  queue: MediaSource[];
  currentIndex: number;
  originalQueue: MediaSource[]; // For shuffle/unshuffle
  
  // Shuffle state
  isShuffled: boolean;
  
  // Repeat state
  repeatMode: RepeatMode;
  
  // Actions
  setQueue: (tracks: MediaSource[], startIndex?: number) => void;
  addToQueue: (tracks: MediaSource | MediaSource[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  
  // Navigation
  next: () => MediaSource | null;
  previous: () => MediaSource | null;
  jumpTo: (index: number) => void;
  
  // Shuffle
  toggleShuffle: () => void;
  
  // Repeat
  toggleRepeat: () => void;
  
  // Getters
  getCurrentTrack: () => MediaSource | null;
  getNextTrack: () => MediaSource | null;
  getPreviousTrack: () => MediaSource | null;
  getRemainingTracks: () => MediaSource[];
  reorderUpcoming: (newUpcoming: MediaSource[]) => void;
}

/**
 * Fisher-Yates shuffle algorithm
 * Ensures true randomness without repetition
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  originalQueue: [],
  isShuffled: false,
  repeatMode: 'off',

  setQueue: (tracks: MediaSource[], startIndex = 0) => {
    set({
      queue: tracks,
      originalQueue: tracks,
      currentIndex: startIndex,
      isShuffled: false,
    });
  },

  addToQueue: (tracks: MediaSource | MediaSource[]) => {
    const tracksArray = Array.isArray(tracks) ? tracks : [tracks];
    set((state) => ({
      queue: [...state.queue, ...tracksArray],
      originalQueue: [...state.originalQueue, ...tracksArray],
    }));
  },

  removeFromQueue: (index: number) => {
    set((state) => {
      const newQueue = state.queue.filter((_, i) => i !== index);
      const newIndex = index < state.currentIndex 
        ? state.currentIndex - 1 
        : state.currentIndex;
      
      return {
        queue: newQueue,
        originalQueue: newQueue,
        currentIndex: newIndex,
      };
    });
  },

  clearQueue: () => {
    set({
      queue: [],
      originalQueue: [],
      currentIndex: -1,
      isShuffled: false,
    });
  },

  next: () => {
    const state = get();
    
    // Repeat one: return current track
    if (state.repeatMode === 'one') {
      return state.queue[state.currentIndex] || null;
    }
    
    // Normal next or repeat all
    if (state.currentIndex < state.queue.length - 1) {
      const newIndex = state.currentIndex + 1;
      set({ currentIndex: newIndex });
      return state.queue[newIndex];
    }
    
    // At end of queue
    if (state.repeatMode === 'all' && state.queue.length > 0) {
      // Loop back to start
      set({ currentIndex: 0 });
      return state.queue[0];
    }
    
    return null;
  },

  previous: () => {
    const state = get();
    if (state.currentIndex > 0) {
      const newIndex = state.currentIndex - 1;
      set({ currentIndex: newIndex });
      return state.queue[newIndex];
    }
    return null;
  },

  jumpTo: (index: number) => {
    const state = get();
    if (index >= 0 && index < state.queue.length) {
      set({ currentIndex: index });
    }
  },

  toggleShuffle: () => {
    const state = get();
    
    if (state.isShuffled) {
      // Unshuffle: restore original order
      const currentTrack = state.queue[state.currentIndex];
      const newIndex = state.originalQueue.findIndex(t => t.id === currentTrack?.id);
      
      set({
        queue: state.originalQueue,
        currentIndex: newIndex >= 0 ? newIndex : 0,
        isShuffled: false,
      });
    } else {
      // Shuffle: keep current track at current position
      const currentTrack = state.queue[state.currentIndex];
      const otherTracks = state.queue.filter((_, i) => i !== state.currentIndex);
      const shuffledOthers = shuffleArray(otherTracks);
      
      // Put current track first, then shuffled tracks
      const newQueue = currentTrack 
        ? [currentTrack, ...shuffledOthers]
        : shuffleArray(state.queue);
      
      set({
        queue: newQueue,
        currentIndex: currentTrack ? 0 : -1,
        isShuffled: true,
      });
    }
  },

  toggleRepeat: () => {
    set((state) => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const currentIndex = modes.indexOf(state.repeatMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      return { repeatMode: modes[nextIndex] };
    });
  },

  getCurrentTrack: () => {
    const state = get();
    return state.queue[state.currentIndex] || null;
  },

  getNextTrack: () => {
    const state = get();
    return state.queue[state.currentIndex + 1] || null;
  },

  getPreviousTrack: () => {
    const state = get();
    return state.queue[state.currentIndex - 1] || null;
  },

  getRemainingTracks: () => {
    const state = get();
    return state.queue.slice(state.currentIndex + 1);
  },

  reorderUpcoming: (newUpcoming: MediaSource[]) => {
    set((state) => {
      const before = state.queue.slice(0, state.currentIndex + 1);
      return {
        queue: [...before, ...newUpcoming],
      };
    });
  },
}));
