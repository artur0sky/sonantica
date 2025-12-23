/**
 * Library Store
 * 
 * Manages media library state using Zustand.
 * Integrates with @sonantica/media-library.
 */

import { create } from 'zustand';
import { MediaLibrary, LIBRARY_EVENTS } from '@sonantica/media-library';
import type { Artist, Album, Track, LibraryStats } from '@sonantica/media-library';

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
        // Clear library before scanning to prevent duplicates
        library.clear();
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
        filtered = filtered.filter((t: Track) =>
          t.metadata.title?.toLowerCase().includes(query) ||
          t.metadata.artist?.toLowerCase().includes(query) ||
          t.metadata.album?.toLowerCase().includes(query)
        );
      }
      
      return filtered;
    },

    _initialize: () => {
      // Subscribe to library events
      library.on(LIBRARY_EVENTS.SCAN_START, () => {
        set({ scanning: true, scanProgress: 0 });
      });

      library.on(LIBRARY_EVENTS.SCAN_PROGRESS, (data: any) => {
        set({ scanProgress: data.filesScanned || 0 });
      });

      library.on(LIBRARY_EVENTS.SCAN_COMPLETE, () => {
        set({ scanning: false });
        get()._updateLibrary();
      });

      library.on(LIBRARY_EVENTS.LIBRARY_UPDATED, () => {
        get()._updateLibrary();
      });
    },

    _updateLibrary: () => {
      set({
        artists: library.getArtists(),
        albums: library.getAlbums(),
        tracks: library.getTracks(),
        stats: library.getStats(),
      });
    },
  };
});

// Initialize on store creation
useLibraryStore.getState()._initialize();
