/**
 * Library Store
 * 
 * Manages media library state using Zustand.
 * Part of @sonantica/media-library package.
 * 
 * Architecture: Domain logic layer (no UI, no platform-specific code)
 * Supports both local scanning and remote server data
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Track, Artist, Album, Playlist } from '../types';
import { indexedDBStorage } from './storageAdapter';

export interface LibraryStats {
  totalTracks: number;
  totalArtists: number;
  totalAlbums: number;
  totalGenres: number;
  totalSize: number;
}

interface LibraryState {
  // State
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  pinnedPlaylistIds: string[];
  stats: LibraryStats;
  loading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  
  // Filters
  searchQuery: string;
  selectedArtist: Artist | null;
  selectedAlbum: Album | null;
  
  // Actions
  loadFromServers: (tracks: Track[], artists: Artist[], albums: Album[]) => void;
  setTracks: (tracks: Track[]) => void;
  setArtists: (artists: Artist[]) => void;
  setAlbums: (albums: Album[]) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;
  togglePin: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearLibrary: () => void;
  _setHydrated: (hydrated: boolean) => void;
  
  // Filters
  setSearchQuery: (query: string) => void;
  selectArtist: (artist: Artist | null) => void;
  selectAlbum: (album: Album | null) => void;
  clearSelection: () => void;
  
  // Getters
  getFilteredArtists: () => Artist[];
  getFilteredAlbums: () => Album[];
  getFilteredTracks: () => Track[];
  getAlbumById: (id: string) => Album | undefined;
  getArtistById: (id: string) => Artist | undefined;
  getTrackById: (id: string) => Track | undefined;
  getPlaylistById: (id: string) => Playlist | undefined;
  
  // Utilities
  enrichTrackWithCoverArt: (track: Track) => Track;
  
  // Batch append for incremental loading
  appendTracks: (newTracks: Track[]) => void;
  appendArtists: (newArtists: Artist[]) => void;
  appendAlbums: (newAlbums: Album[]) => void;
}

const calculateStats = (tracks: Track[], artists: Artist[], albums: Album[]): LibraryStats => {
  const genres = new Set(tracks.map(t => t.genre).filter(Boolean));
  
  return {
    totalTracks: tracks.length,
    totalArtists: artists.length,
    totalAlbums: albums.length,
    totalGenres: genres.size,
    totalSize: 0, // TODO: Calculate from track file sizes
  };
};

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      // Initial state
      tracks: [],
      artists: [],
      albums: [],
      playlists: [],
      pinnedPlaylistIds: [],
      stats: {
        totalTracks: 0,
        totalArtists: 0,
        totalAlbums: 0,
        totalGenres: 0,
        totalSize: 0,
      },
      loading: false,
      error: null,
      _hasHydrated: false,
      searchQuery: '',
      selectedArtist: null,
      selectedAlbum: null,

      // Actions
      loadFromServers: (tracks: Track[], artists: Artist[], albums: Album[]) => {
        // Enrich tracks with cover art from albums
        const enrichTracks = (tracksToEnrich: Track[]) => tracksToEnrich.map(track => {
          if (track.coverArt) return track; // Already has art
          
          // Try to find album
          // Strategy 1: Match by albumId
          let album = track.albumId ? albums.find(a => a.id === track.albumId) : null;
          
          // Strategy 2: Match by name and artist
          if (!album) {
            album = albums.find(a => a.title === track.album && a.artist === track.artist);
          }
          
          if (album && album.coverArt) {
            return { ...track, coverArt: album.coverArt };
          }
          return track;
        });

        const enrichedTracks = enrichTracks(tracks);
        // Note: We don't merge here, loadFromServers replaces state by design.
        // Use append* actions for incremental loading.

        const stats = calculateStats(enrichedTracks, artists, albums);
        set({
          tracks: enrichedTracks,
          artists,
          albums,
          stats,
          loading: false,
          error: null,
        });
        console.log('📚 Library loaded:', stats);
      },

      setTracks: (tracks) => {
        console.log('🔄 setTracks called with', tracks.length, 'tracks');
        const { artists, albums } = get();
        const stats = calculateStats(tracks, artists, albums);
        set({ tracks, stats });
      },

      appendTracks: (newTracks: Track[]) => {
        const { tracks: currentTracks, artists, albums } = get();
        // Enrich new tracks
        const enrichTracks = (tracksToEnrich: Track[]) => tracksToEnrich.map(track => {
          if (track.coverArt) return track; 
          let album = track.albumId ? albums.find(a => a.id === track.albumId) : null;
          if (!album) {
            album = albums.find(a => a.title === track.album && a.artist === track.artist);
          }
          if (album && album.coverArt) {
            return { ...track, coverArt: album.coverArt };
          }
          return track;
        });

        const enrichedNewTracks = enrichTracks(newTracks);
        
        // Deduplicate based on ID
        const existingIds = new Set(currentTracks.map(t => t.id));
        const uniqueNewTracks = enrichedNewTracks.filter(t => !existingIds.has(t.id));

        if (uniqueNewTracks.length === 0) return;

        const updatedTracks = [...currentTracks, ...uniqueNewTracks];
        const stats = calculateStats(updatedTracks, artists, albums);
        set({ tracks: updatedTracks, stats });
      },

      setArtists: (artists) => {
        console.log('🔄 setArtists called with', artists.length, 'artists');
        const { tracks, albums } = get();
        const stats = calculateStats(tracks, artists, albums);
        set({ artists, stats });
      },

      appendArtists: (newArtists: Artist[]) => {
        const { tracks, artists: currentArtists, albums } = get();
        const existingIds = new Set(currentArtists.map(a => a.id));
        const uniqueNewArtists = newArtists.filter(a => !existingIds.has(a.id));

        if (uniqueNewArtists.length === 0) return;

        const updatedArtists = [...currentArtists, ...uniqueNewArtists];
        const stats = calculateStats(tracks, updatedArtists, albums);
        set({ artists: updatedArtists, stats });
      },

      setAlbums: (albums) => {
        console.log('🔄 setAlbums called with', albums.length, 'albums');
        const { tracks, artists } = get();
        const stats = calculateStats(tracks, artists, albums);
        set({ albums, stats });
      },

      appendAlbums: (newAlbums: Album[]) => {
        const { tracks, artists, albums: currentAlbums } = get();
        const existingIds = new Set(currentAlbums.map(a => a.id));
        const uniqueNewAlbums = newAlbums.filter(a => !existingIds.has(a.id));

        if (uniqueNewAlbums.length === 0) return;

        const updatedAlbums = [...currentAlbums, ...uniqueNewAlbums];
        const stats = calculateStats(tracks, artists, updatedAlbums);
        set({ albums: updatedAlbums, stats });
      },

      setPlaylists: (playlists) => set({ playlists }),

      addPlaylist: (playlist) => set((state) => ({ playlists: [playlist, ...state.playlists] })),

      updatePlaylist: (id, updates) => set((state) => ({
        playlists: state.playlists.map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      deletePlaylist: (id) => set((state) => ({
        playlists: state.playlists.filter(p => p.id !== id),
        pinnedPlaylistIds: state.pinnedPlaylistIds.filter(pid => pid !== id)
      })),

      togglePin: (id) => set((state) => ({
        pinnedPlaylistIds: state.pinnedPlaylistIds.includes(id)
          ? state.pinnedPlaylistIds.filter(pid => pid !== id)
          : [...state.pinnedPlaylistIds, id]
      })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      clearLibrary: () => {
        set({
          tracks: [],
          artists: [],
          albums: [],
          playlists: [],
          stats: {
            totalTracks: 0,
            totalArtists: 0,
            totalAlbums: 0,
            totalGenres: 0,
            totalSize: 0,
          },
          pinnedPlaylistIds: [],
          selectedArtist: null,
          selectedAlbum: null,
          searchQuery: '',
          error: null,
        });
        console.log('🗑️ Library cleared');
      },
      
      _setHydrated: (hydrated) => set({ _hasHydrated: hydrated }),

      // Filters
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

      // Getters
      getFilteredArtists: () => {
        const { artists, searchQuery } = get();
        if (!searchQuery) return artists;
        
        const query = searchQuery.toLowerCase();
        return artists.filter((a: Artist) =>
          a.name.toLowerCase().includes(query)
        );
      },

      getFilteredAlbums: () => {
        const { albums, searchQuery, selectedArtist } = get();
        let filtered = albums;
        
        // Filter by selected artist
        if (selectedArtist) {
          filtered = filtered.filter((a: Album) => a.artist === selectedArtist.name);
        }
        
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter((a: Album) =>
            a.title.toLowerCase().includes(query) ||
            a.artist.toLowerCase().includes(query)
          );
        }
        
        return filtered;
      },

      getFilteredTracks: () => {
        const { tracks, searchQuery, selectedArtist, selectedAlbum } = get();
        let filtered = tracks;
        
        // Filter by selected artist
        if (selectedArtist) {
          filtered = filtered.filter((t: Track) => t.artist === selectedArtist.name);
        }
        
        // Filter by selected album
        if (selectedAlbum) {
          filtered = filtered.filter((t: Track) => 
            t.album === selectedAlbum.title && t.artist === selectedAlbum.artist
          );
        }
        
        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter((t: Track) =>
            t.title?.toLowerCase().includes(query) ||
            t.artist?.toLowerCase().includes(query) ||
            t.album?.toLowerCase().includes(query) ||
            t.genre?.toLowerCase().includes(query)
          );
        }
        
        return filtered;
      },

      getAlbumById: (id: string) => {
        return get().albums.find(a => a.id === id);
      },

      getArtistById: (id: string) => {
        return get().artists.find(a => a.id === id);
      },

      getTrackById: (id: string) => {
        return get().tracks.find(t => t.id === id);
      },

      getPlaylistById: (id: string) => {
        return get().playlists.find(p => p.id === id);
      },

      // Utilities
      enrichTrackWithCoverArt: (track: Track) => {
        if (track.coverArt) return track; // Already has art
        
        const { albums } = get();
        
        // Strategy 1: Match by albumId
        let album = track.albumId ? albums.find(a => a.id === track.albumId) : null;
        
        // Strategy 2: Match by name and artist
        if (!album) {
          album = albums.find(a => a.title === track.album && a.artist === track.artist);
        }
        
        if (album && album.coverArt) {
          return { ...track, coverArt: album.coverArt };
        }
        
        return track;
      },
    }),
    {
      name: 'sonantica-library-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        tracks: state.tracks,
        artists: state.artists,
        albums: state.albums,
        playlists: state.playlists,
        pinnedPlaylistIds: state.pinnedPlaylistIds,
        stats: state.stats
      }),
      onRehydrateStorage: () => (state) => {
        console.log('📚 Library hydration finished', state ? 'success' : 'failed');
        if (state) {
            state._setHydrated(true);
            state.setLoading(false);
        }
      }
    }
  )
);
