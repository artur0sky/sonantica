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
  
  // Internal
  _hasRestored: boolean;
  
  // Actions
  setQueue: (tracks: MediaSource[], startIndex?: number) => void;
  addToQueue: (tracks: MediaSource | MediaSource[]) => void;
  playNext: (tracks: MediaSource | MediaSource[]) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  
  // Navigation
  next: (force?: boolean) => MediaSource | null;
  previous: (force?: boolean) => MediaSource | null;
  jumpTo: (index: number) => void;
  
  // Shuffle
  toggleShuffle: () => void;
  
  // Repeat
  toggleRepeat: () => void;
  
  // Getters
  getRemainingTracks: () => MediaSource[];
  getUpcoming: (limit: number) => MediaSource[];
  reorderUpcoming: (newUpcoming: MediaSource[]) => void;
  
  // Persistence callbacks
  onSave?: (data: { 
    queue: MediaSource[]; 
    currentIndex: number; 
    isShuffled: boolean;
    originalQueue: MediaSource[];
    repeatMode: RepeatMode;
  }) => Promise<void>;
  onLoad?: () => Promise<{ 
    queue: MediaSource[]; 
    currentIndex: number; 
    isShuffled: boolean;
    originalQueue: MediaSource[];
    repeatMode: RepeatMode;
  } | null>;
  
  // Callback setters
  setOnSave: (callback: (data: { 
    queue: MediaSource[]; 
    currentIndex: number; 
    isShuffled: boolean;
    originalQueue: MediaSource[];
    repeatMode: RepeatMode;
  }) => Promise<void>) => void;
  setOnLoad: (callback: () => Promise<{ 
    queue: MediaSource[]; 
    currentIndex: number; 
    isShuffled: boolean;
    originalQueue: MediaSource[];
    repeatMode: RepeatMode;
  } | null>) => void;
  
  // Internal
  _initialize: () => void;
  restore: () => Promise<void>;
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
  _hasRestored: false,

  setQueue: (tracks: MediaSource[], startIndex = 0) => {
    // Ensure unique IDs for queue items
    const tracksWithUniqueIds = tracks.map(track => ({
      ...track,
      queueId: track.queueId || Math.random().toString(36).substring(7)
    }));

    set({
      queue: tracksWithUniqueIds,
      originalQueue: tracksWithUniqueIds,
      currentIndex: startIndex,
      isShuffled: false,
      _hasRestored: true, // New interaction overrides restoration
    });
    
    (get() as any)._save();
  },

  addToQueue: (tracks: MediaSource | MediaSource[]) => {
    const tracksArray = (Array.isArray(tracks) ? tracks : [tracks]).map(track => ({
      ...track,
      queueId: Math.random().toString(36).substring(7)
    }));
    
    set((state) => ({
      queue: [...state.queue, ...tracksArray],
      originalQueue: [...state.originalQueue, ...tracksArray],
    }));
    (get() as any)._save();
  },

  playNext: (tracks: MediaSource | MediaSource[]) => {
    const tracksArray = (Array.isArray(tracks) ? tracks : [tracks]).map(track => ({
      ...track,
      queueId: Math.random().toString(36).substring(7)
    }));

    set((state) => {
      const insertIndex = Math.max(0, state.currentIndex + 1);
      
      const newQueue = [
        ...state.queue.slice(0, insertIndex),
        ...tracksArray,
        ...state.queue.slice(insertIndex),
      ];
      
      // Also insert into original queue to maintain consistency when unshuffling
      const newOriginalQueue = [...state.originalQueue];
      // Find where we are in original queue
      const currentTrack = state.queue[state.currentIndex];
      const currentInOriginal = state.originalQueue.findIndex(t => t.queueId === currentTrack?.queueId);
      const originalInsertIndex = currentInOriginal >= 0 ? currentInOriginal + 1 : state.originalQueue.length;
      
      newOriginalQueue.splice(originalInsertIndex, 0, ...tracksArray);
      
      console.log(`⏭️ [QueueStore] Playing ${tracksArray.length} track(s) next`);
      
      return {
        queue: newQueue,
        originalQueue: newOriginalQueue,
      };
    });
    (get() as any)._save();
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
    (get() as any)._save();
  },

  clearQueue: () => {
    set({
      queue: [],
      originalQueue: [],
      currentIndex: -1,
      isShuffled: false,
    });
    (get() as any)._save();
  },

  next: (force = false) => {
    const state = get();
    
    // Repeat one: return current track UNLESS forced by button
    if (state.repeatMode === 'one' && !force) {
      console.log('🔁 [QueueStore] Repeat mode ONE: staying on track');
      return state.queue[state.currentIndex] || null;
    }
    
    // Normal next or repeat all
    if (state.currentIndex < state.queue.length - 1) {
      const newIndex = state.currentIndex + 1;
      set({ currentIndex: newIndex });
      (get() as any)._save();
      return state.queue[newIndex];
    }
    
    // At end of queue
    if (state.repeatMode === 'all' && state.queue.length > 0) {
      // Loop back to start
      const newIndex = 0;
      set({ currentIndex: newIndex });
      (get() as any)._save();
      console.log('🔁 [QueueStore] Loop: returning to start');
      return state.queue[0];
    }
    
    return null;
  },

  previous: (force = false) => {
    const state = get();
    if (state.currentIndex > 0) {
      const newIndex = state.currentIndex - 1;
      set({ currentIndex: newIndex });
      (get() as any)._save();
      return state.queue[newIndex];
    }
    
    // Repeat all: loop to end
    if (state.repeatMode === 'all' && state.queue.length > 0) {
        const newIndex = state.queue.length - 1;
        set({ currentIndex: newIndex });
        (get() as any)._save();
        return state.queue[newIndex];
    }
    
    return null;
  },

  jumpTo: (index: number) => {
    const state = get();
    if (index >= 0 && index < state.queue.length) {
      set({ currentIndex: index });
      (get() as any)._save();
    }
  },

  toggleShuffle: () => {
    const state = get();
    
    if (state.isShuffled) {
      // Unshuffle: restore original order
      const currentTrack = state.queue[state.currentIndex];
      const newIndex = state.originalQueue.findIndex(t => t.id === currentTrack?.id);
      
      console.log('🔀 [QueueStore] Unshuffling queue');
      
      set({
        queue: [...state.originalQueue],
        currentIndex: newIndex >= 0 ? newIndex : 0,
        isShuffled: false,
      });
    } else {
      // Shuffle: keep current track at current position
      const currentTrack = state.queue[state.currentIndex];
      const otherTracks = state.queue.filter((_, i) => i !== state.currentIndex);
      const shuffledOthers = shuffleArray(otherTracks);
      
      console.log(`🔀 [QueueStore] Shuffling ${otherTracks.length} tracks`);
      
      // Put current track first, then shuffled tracks
      const newQueue = currentTrack 
        ? [currentTrack, ...shuffledOthers]
        : shuffleArray([...state.queue]);
      
      set({
        queue: newQueue,
        currentIndex: currentTrack ? 0 : -1,
        isShuffled: true,
      });
    }
    (get() as any)._save();
  },

  toggleRepeat: () => {
    set((state) => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const currentIndex = modes.indexOf(state.repeatMode);
      const nextIndex = (currentIndex + 1) % modes.length;
      return { repeatMode: modes[nextIndex] };
    });
    (get() as any)._save();
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

  getUpcoming: (limit: number) => {
    const state = get();
    return state.queue.slice(state.currentIndex + 1, state.currentIndex + 1 + limit);
  },

  reorderUpcoming: (newUpcoming: MediaSource[]) => {
    set((state) => {
      const before = state.queue.slice(0, state.currentIndex + 1);
      return {
        queue: [...before, ...newUpcoming],
      };
    });
    (get() as any)._save();
  },

  setOnSave: (callback: any) => set({ onSave: callback }),
  setOnLoad: (callback: any) => {
    set({ onLoad: callback });
    // Auto-trigger restore when callback is set
    (get() as any).restore();
  },
  _initialize: () => {
    // Basic setup if any
  },

  _save: () => {
    const { onSave, queue, currentIndex, isShuffled, originalQueue, repeatMode, _hasRestored } = get();
    if (onSave && _hasRestored) {
      // console.log('💾 [QueueStore] Auto-saving queue state');
      onSave({ queue, currentIndex, isShuffled, originalQueue, repeatMode });
    }
  },

  restore: async () => {
    // Restore from cache
    try {
      const { onLoad } = get();
      if (!onLoad) {
        set({ _hasRestored: true });
        return;
      }

      console.log('🔄 [QueueStore] Starting restoration...');
      const cached = await onLoad();
      
      if (cached && cached.queue && Array.isArray(cached.queue)) {
        console.log(`✅ [QueueStore] Restored ${cached.queue.length} tracks. Index: ${cached.currentIndex}`);
        set({
          queue: cached.queue,
          originalQueue: cached.originalQueue || cached.queue,
          currentIndex: cached.currentIndex ?? -1,
          isShuffled: cached.isShuffled ?? false,
          repeatMode: cached.repeatMode ?? 'off',
          _hasRestored: true
        });
      } else {
        console.log('ℹ️ [QueueStore] No valid cached queue found');
        set({ _hasRestored: true });
      }
    } catch (error) {
      console.warn('❌ [QueueStore] Restoration failed:', error);
      set({ _hasRestored: true });
    }
  }
}));

export interface QueueStoreInternal extends QueueState {
    _save: () => void;
}


// Initialize on store creation
useQueueStore.getState()._initialize();

