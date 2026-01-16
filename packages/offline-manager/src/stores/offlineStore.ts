import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OfflineStatus, DownloadQuality } from '@sonantica/shared';

interface OfflineItem {
  id: string;
  type: 'track' | 'album' | 'artist';
  status: OfflineStatus;
  quality: DownloadQuality;
  progress: number; // 0-100
  error?: string;
  addedAt: number;
  track?: any; // Full track object for download processing
}

interface OfflineState {
  // item ID -> OfflineItem
  items: Record<string, OfflineItem>;
  
  // Actions
  setItemStatus: (id: string, type: 'track' | 'album' | 'artist', status: OfflineStatus, quality: DownloadQuality, track?: any) => void;
  setItemTrack: (id: string, track: any) => void;
  setItemProgress: (id: string, progress: number) => void;
  setItemError: (id: string, error?: string) => void;
  removeItem: (id: string) => void;
  clearError: (id: string) => void;
  clearAll: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      items: {},

      setItemStatus: (id, type, status, quality, track) => set((state) => ({
        items: {
          ...state.items,
          [id]: {
            ...(state.items[id] || { id, type, addedAt: Date.now() }),
            status,
            quality,
            track: track || state.items[id]?.track,
            progress: status === OfflineStatus.COMPLETED ? 100 : (state.items[id]?.progress || 0),
          },
        },
      })),

      setItemTrack: (id, track) => set((state) => ({
        items: {
          ...state.items,
          [id]: state.items[id] ? { ...state.items[id], track } : state.items[id],
        },
      })),

      setItemProgress: (id, progress) => set((state) => ({
        items: {
          ...state.items,
          [id]: state.items[id] ? { ...state.items[id], progress } : state.items[id],
        },
      })),

      setItemError: (id, error) => set((state) => ({
        items: {
          ...state.items,
          [id]: state.items[id] ? { ...state.items[id], status: OfflineStatus.ERROR, error } : state.items[id],
        },
      })),

      removeItem: (id) => set((state) => {
        const newItems = { ...state.items };
        delete newItems[id];
        return { items: newItems };
      }),

      clearError: (id) => set((state) => {
        if (state.items[id]?.status !== OfflineStatus.ERROR) return state;
        const newItems = { ...state.items };
        delete newItems[id];
        return { items: newItems };
      }),

      clearAll: () => set({ items: {} }),
    }),
    {
      name: 'sonantica:offline-storage',
    }
  )
);
