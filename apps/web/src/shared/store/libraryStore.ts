/**
 * Library Store
 * 
 * Manages media library state using Zustand.
 * Integrates with @sonantica/media-library.
 */

import { create } from 'zustand';
import { MediaLibrary, LIBRARY_EVENTS } from '@sonantica/media-library';
import type { Artist, Album, Track, LibraryStats } from '@sonantica/media-library';
import { saveToStorage, loadFromStorage, STORES } from '../utils/storage';

interface LibraryState {
  // Library instance
  library: MediaLibrary;
  
  // State
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  stats: LibraryStats;
  scanning: boolean;
  scanProgress: number;
  
  // Filters
  searchQuery: string;
  selectedArtist: Artist | null;
  selectedAlbum: Album | null;
  
  // Actions
  scan: (paths: string[]) => Promise<void>;
  setSearchQuery: (query: string) => void;
  selectArtist: (artist: Artist | null) => void;
  selectAlbum: (album: Album | null) => void;
  clearSelection: () => void;
  
  // Getters
  getFilteredArtists: () => Artist[];
  getFilteredAlbums: () => Album[];
  getFilteredTracks: () => Track[];
  
  // Internal
  _initialize: () => void;
  _updateLibrary: () => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => {
  const library = new MediaLibrary();

  return {
    library,
    artists: [],
    albums: [],
    tracks: [],
    stats: {
      totalTracks: 0,
      totalArtists: 0,
      totalAlbums: 0,
      totalGenres: 0,
      totalSize: 0,
    },
    scanning: false,
    scanProgress: 0,
    searchQuery: '',
    selectedArtist: null,
    selectedAlbum: null,

    scan: async (paths: string[]) => {
      try {
        set({ scanning: true, scanProgress: 0 });
        // MediaLibrary now handles change detection automatically
        await library.scan(paths);
      } catch (error) {
        console.error('Scan failed:', error);
        throw error;
      } finally {
        set({ scanning: false });
      }
    },

    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },

    selectArtist: (artist: Artist | null) => {
      set({ selectedArtist: artist, selectedAlbum: null });
    },

    selectAlbum: (album: Album | null) => {
      set({ selectedAlbum: album });
    },

    clearSelection: () => {
      set({ selectedArtist: null, selectedAlbum: null, searchQuery: '' });
    },

    getFilteredArtists: () => {
      const { artists, searchQuery } = get();
      if (!searchQuery) return artists;
      
      const query = searchQuery.toLowerCase();
      return artists.filter((a: Artist) =>
        a.name.toLowerCase().includes(query)
      );
    },

    getFilteredAlbums: () => {
      const { albums, selectedArtist, searchQuery } = get();
      let filtered = selectedArtist ? selectedArtist.albums : albums;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((a: Album) =>
          a.name.toLowerCase().includes(query) ||
          a.artist.toLowerCase().includes(query)
        );
      }
      
      return filtered;
    },

    getFilteredTracks: () => {
      const { tracks, selectedAlbum, searchQuery } = get();
      let filtered = selectedAlbum ? selectedAlbum.tracks : tracks;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((t: Track) => {
          const titleMatch = t.metadata.title?.toLowerCase().includes(query);
          const albumMatch = t.metadata.album?.toLowerCase().includes(query);
          
          // Handle artist as string or array
          let artistMatch = false;
          const artist = t.metadata.artist;
          if (artist) {
            if (Array.isArray(artist)) {
              artistMatch = artist.some(a => a.toLowerCase().includes(query));
            } else {
              artistMatch = artist.toLowerCase().includes(query);
            }
          }
          
          return titleMatch || artistMatch || albumMatch;
        });
      }
      
      return filtered;
    },

    _initialize: async () => {
      // Load cached library data
      try {
        const cachedData = await loadFromStorage<{
          tracks: Track[];
          albums: Album[];
          artists: Artist[];
          stats: LibraryStats;
        }>(STORES.LIBRARY, 'data');

        if (cachedData && cachedData.tracks.length > 0) {
          // Restore library data
          set({
            tracks: cachedData.tracks,
            albums: cachedData.albums,
            artists: cachedData.artists,
            stats: cachedData.stats,
          });
          console.log('📚 Loaded library from cache:', cachedData.stats.totalTracks, 'tracks');
        }
      } catch (error) {
        console.warn('Failed to load cached library:', error);
      }

      // Subscribe to library events
      library.on(LIBRARY_EVENTS.SCAN_START, () => {
        set({ scanning: true, scanProgress: 0 });
      });

      library.on(LIBRARY_EVENTS.SCAN_PROGRESS, (data: any) => {
        set({ scanProgress: data.filesScanned || 0 });
      });

      library.on(LIBRARY_EVENTS.SCAN_COMPLETE, async () => {
        set({ scanning: false });
        await get()._updateLibrary();
      });

      library.on(LIBRARY_EVENTS.LIBRARY_UPDATED, async () => {
        await get()._updateLibrary();
      });
    },

    _updateLibrary: async () => {
      const newData = {
        artists: library.getArtists(),
        albums: library.getAlbums(),
        tracks: library.getTracks(),
        stats: library.getStats(),
      };

      set(newData);

      // Save to IndexedDB
      try {
        await saveToStorage(STORES.LIBRARY, 'data', newData);
        console.log('💾 Library saved to cache:', newData.stats.totalTracks, 'tracks');
      } catch (error) {
        console.error('Failed to save library to cache:', error);
      }
    },
  };
});

// Initialize on store creation
useLibraryStore.getState()._initialize();
