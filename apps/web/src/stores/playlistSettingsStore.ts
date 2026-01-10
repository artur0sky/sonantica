/**
 * Playlist Settings Store
 * 
 * Manages user preferences for playlists (pinning, recent access)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PlaylistSettingsState {
  pinnedIds: string[];
  lastAccessed: Record<string, number>; // playlistId -> timestamp
  
  // Actions
  togglePin: (id: string) => void;
  trackAccess: (id: string) => void;
  isPinned: (id: string) => boolean;
}

export const usePlaylistSettingsStore = create<PlaylistSettingsState>()(
  persist(
    (set, get) => ({
      pinnedIds: [],
      lastAccessed: {},

      togglePin: (id) => {
        const { pinnedIds } = get();
        if (pinnedIds.includes(id)) {
          set({ pinnedIds: pinnedIds.filter((pid) => pid !== id) });
        } else {
          set({ pinnedIds: [...pinnedIds, id] });
        }
      },

      trackAccess: (id) => {
        set((state) => ({
          lastAccessed: {
            ...state.lastAccessed,
            [id]: Date.now(),
          },
        }));
      },

      isPinned: (id) => {
        return get().pinnedIds.includes(id);
      },
    }),
    {
      name: 'sonantica-playlist-settings',
    }
  )
);
