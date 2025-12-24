/**
 * Library Store
 * 
 * Manages media library state using Zustand.
 * Part of @sonantica/media-library package.
 */

import { create } from 'zustand';
import { MediaLibrary, LIBRARY_EVENTS } from '../MediaLibrary';
import type { Artist, Album, Track, LibraryStats } from '../types';

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
  initialized: boolean;
  
  // Filters
  searchQuery: string;
  selectedArtist: Artist | null;
  selectedAlbum: Album | null;
  
  // Persistence callbacks (injected from app layer)
  onSave?: (data: { tracks: Track[]; stats: LibraryStats }) => Promise<void>;
  onLoad?: () => Promise<{ tracks: Track[]; stats: LibraryStats } | null>;
  
  // Actions
  scan: (paths: string[], cancel?: boolean) => Promise<void>;
  setSearchQuery: (query: string) => void;
  selectArtist: (artist: Artist | null) => void;
  selectAlbum: (album: Album | null) => void;
  clearSelection: () => void;
  hydrateTrack: (id: string) => Promise<void>;
  
  // Callback setters
  setOnSave: (callback: (data: { tracks: Track[]; stats: LibraryStats }) => Promise<void>) => void;
  setOnLoad: (callback: () => Promise<{ tracks: Track[]; stats: LibraryStats } | null>) => void;
  
  // Getters
  getFilteredArtists: () => Artist[];
  getFilteredAlbums: () => Album[];
  getFilteredTracks: () => Track[];
  getAlbumById: (id: string) => Album | undefined;
  getArtistById: (id: string) => Artist | undefined;
  
  // Internal
  _initialize: () => void;
  _updateLibrary: (persist?: boolean) => void;
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

    scan: async (paths: string[], cancel: boolean = false) => {
      try {
        if (cancel) {
             library.cancelScan();
             set({ scanning: false });
             return;
        }
        set({ scanning: true, scanProgress: 0 });
        // MediaLibrary now handles change detection automatically
        await library.scan(paths);
      } catch (error) {
        console.error('Scan failed:', error);
        throw error;
      } finally {
        if (!cancel) set({ scanning: false });
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

    hydrateTrack: async (id: string) => {
      await library.hydrateTrack(id);
      // No need for set() here as library emits LIBRARY_UPDATED which triggers _updateLibrary
    },

    setOnSave: (callback: (data: { tracks: Track[]; stats: LibraryStats }) => Promise<void>) => {
      set({ onSave: callback });
    },

    setOnLoad: (callback: () => Promise<{ tracks: Track[]; stats: LibraryStats } | null>) => {
      set({ onLoad: callback });
    },

    initialized: false,

    getFilteredArtists: () => {
      const { artists, searchQuery } = get();
      if (!searchQuery) return artists;
      
      const query = searchQuery.toLowerCase();
      return artists.filter((a: Artist) =>
        a.name.toLowerCase().includes(query)
      );
    },

    getFilteredAlbums: () => {
      const { albums, searchQuery } = get();
      let filtered = albums;
      
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
      const { tracks, searchQuery } = get();
      let filtered = tracks;
      
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

    getAlbumById: (id: string) => {
      return get().albums.find(a => a.id === id);
    },

    getArtistById: (id: string) => {
      return get().artists.find(a => a.id === id);
    },

    _initialize: async () => {
      if (get().initialized) return;
      set({ initialized: true });

      // Subscribe to library events
      library.on(LIBRARY_EVENTS.SCAN_START, () => {
        set({ scanning: true, scanProgress: 0 });
      });

      library.on(LIBRARY_EVENTS.SCAN_PROGRESS, (data: any) => {
        set({ scanProgress: data.filesScanned || 0 });
      });

      library.on(LIBRARY_EVENTS.SCAN_COMPLETE, async () => {
        set({ scanning: false });
        // Full update with persistence when complete
        await get()._updateLibrary(true);
      });

      // Real-time updates for new tracks found during scan
      let updateTimeout: ReturnType<typeof setTimeout> | null = null;
      let tracksSinceLastSave = 0;

      library.on(LIBRARY_EVENTS.TRACK_ADDED, (data: any) => {
        tracksSinceLastSave++;
        
        if (!updateTimeout) {
          updateTimeout = setTimeout(() => {
            // Persist periodically during scan (every 15 tracks) 
            // to ensure progress is saved for large libraries
            const shouldPersist = tracksSinceLastSave >= 15;
            if (shouldPersist) {
              tracksSinceLastSave = 0;
            }
            
            get()._updateLibrary(shouldPersist);
            updateTimeout = null;
          }, 500); // Batched UI update
        }
      });

      library.on(LIBRARY_EVENTS.LIBRARY_UPDATED, async () => {
        await get()._updateLibrary(true);
      });

      try {
        const { onLoad } = get();
        if (onLoad) {
          const cachedData = await onLoad();

          if (cachedData && cachedData.tracks && cachedData.tracks.length > 0) {
            console.log('📚 Loading library from cache:', cachedData.tracks.length, 'tracks');
            library.restore(cachedData.tracks);
          }
        }
      } catch (error) {
        console.warn('Failed to load cached library:', error);
      }
    },

    _updateLibrary: async (persist = true) => {
      const tracks = library.getTracks();
      const stats = library.getStats();
      
      const newData = {
        artists: library.getArtists(),
        albums: library.getAlbums(),
        tracks,
        stats,
      };

      set(newData);

      // Save via injected callback - ONLY tracks and stats
      // Skip if persist is false (e.g. during rapid scan updates)
      if (persist) {
        const { onSave } = get();
        if (onSave) {
          try {
            await onSave({
              tracks,
              stats
            });
            console.log('💾 Library saved to cache:', stats.totalTracks, 'tracks');
          } catch (error) {
            console.error('Failed to save library to cache:', error);
          }
        }
      }
    },
  };
});

// Note: initialization is now handled by the app layer (e.g. PlaybackPersistence)
// to ensure persistence callbacks are set before initialization.
