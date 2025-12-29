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
import type { Track, Artist, Album } from '../types';

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
  stats: LibraryStats;
  loading: boolean;
  error: string | null;
  
  // Filters
  searchQuery: string;
  selectedArtist: Artist | null;
  selectedAlbum: Album | null;
  
  // Actions
  loadFromServers: (tracks: Track[], artists: Artist[], albums: Album[]) => void;
  setTracks: (tracks: Track[]) => void;
  setArtists: (artists: Artist[]) => void;
  setAlbums: (albums: Album[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearLibrary: () => void;
  
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

export const useLibraryStore = create<LibraryState>((set, get) => ({
  // Initial state
  tracks: [],
  artists: [],
  albums: [],
  stats: {
    totalTracks: 0,
    totalArtists: 0,
    totalAlbums: 0,
    totalGenres: 0,
    totalSize: 0,
  },
  loading: false,
  error: null,
  searchQuery: '',
  selectedArtist: null,
  selectedAlbum: null,

  // Actions
  loadFromServers: (tracks: Track[], artists: Artist[], albums: Album[]) => {
    const stats = calculateStats(tracks, artists, albums);
    set({
      tracks,
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

  setArtists: (artists) => {
    console.log('🔄 setArtists called with', artists.length, 'artists');
    const { tracks, albums } = get();
    const stats = calculateStats(tracks, artists, albums);
    set({ artists, stats });
  },

  setAlbums: (albums) => {
    console.log('🔄 setAlbums called with', albums.length, 'albums');
    const { tracks, artists } = get();
    const stats = calculateStats(tracks, artists, albums);
    set({ albums, stats });
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  clearLibrary: () => {
    set({
      tracks: [],
      artists: [],
      albums: [],
      stats: {
        totalTracks: 0,
        totalArtists: 0,
        totalAlbums: 0,
        totalGenres: 0,
        totalSize: 0,
      },
      selectedArtist: null,
      selectedAlbum: null,
      searchQuery: '',
      error: null,
    });
    console.log('🗑️ Library cleared');
  },

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
}));
