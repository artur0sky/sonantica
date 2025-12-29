/**
 * Multi-Server Library Hook
 * 
 * Manages library data from multiple Sonántica servers.
 * Allows scanning all servers or individual servers.
 * Aggregates tracks from all sources.
 * 
 * Philosophy: "User Autonomy" - Multiple self-hosted instances
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  getServersConfig, 
  createLibraryAdapterForServer
} from '../services/LibraryService';
import type { Track, Artist, Album } from '@sonantica/shared';
import type { LibraryStats } from '@sonantica/media-library';
import { useLibraryStore } from '@sonantica/media-library';

interface MultiServerLibraryState {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  stats: LibraryStats | null;
  loading: boolean;
  error: string | null;
  scanningServers: Set<string>;
}

export function useMultiServerLibrary() {
  const libraryStore = useLibraryStore();
  
  const [state, setState] = useState<MultiServerLibraryState>({
    tracks: libraryStore.tracks,
    artists: libraryStore.artists,
    albums: libraryStore.albums,
    stats: null,
    loading: false,
    error: null,
    scanningServers: new Set()
  });

  // Sync with store on mount
  useEffect(() => {
    setState(prev => ({
      ...prev,
      tracks: libraryStore.tracks,
      artists: libraryStore.artists,
      albums: libraryStore.albums
    }));
  }, [libraryStore.tracks, libraryStore.artists, libraryStore.albums]);

  /**
   * Scan a specific server
   */
  const scanServer = useCallback(async (serverId: string) => {
    const config = getServersConfig();
    const server = config.servers.find(s => s.id === serverId);
    
    if (!server) {
      console.error('Server not found:', serverId);
      return;
    }

    setState(prev => ({
      ...prev,
      scanningServers: new Set([...prev.scanningServers, serverId])
    }));

    try {
      const adapter = createLibraryAdapterForServer(serverId);
      if (!adapter) {
        throw new Error('Failed to create adapter');
      }

      // Test connection
      const connected = await adapter.testConnection();
      if (!connected) {
        throw new Error(`Unable to connect to ${server.name}`);
      }

      // Load data from this server
      const [tracks, artists, albums] = await Promise.all([
        adapter.getTracks(),
        adapter.getArtists(),
        adapter.getAlbums()
      ]);

      // Tag tracks with server info
      const taggedTracks = tracks.map(track => ({
        ...track,
        serverId: server.id,
        serverName: server.name
      }));
      
      console.log(`🏷️ Tagged ${taggedTracks.length} tracks with serverId: ${server.id}`);

      // Merge with existing data (remove old data from this server first)
      setState(prev => {
        const otherTracks = prev.tracks.filter(t => t.serverId !== serverId);
        const otherArtists = prev.artists.filter(a => (a as any).serverId !== serverId);
        const otherAlbums = prev.albums.filter(a => (a as any).serverId !== serverId);

        const newTracks = [...otherTracks, ...taggedTracks];
        const newArtists = [...otherArtists, ...artists];
        const newAlbums = [...otherAlbums, ...albums];

        // Sync with library store
        libraryStore.setTracks(newTracks);
        libraryStore.setArtists(newArtists);
        libraryStore.setAlbums(newAlbums);

        return {
          ...prev,
          tracks: newTracks,
          artists: newArtists,
          albums: newAlbums,
          scanningServers: new Set([...prev.scanningServers].filter(id => id !== serverId)),
          error: null
        };
      });

      console.log(`✅ Scanned ${server.name}:`, {
        tracks: tracks.length,
        artists: artists.length,
        albums: albums.length
      });
    } catch (error) {
      console.error(`Failed to scan ${server.name}:`, error);
      setState(prev => ({
        ...prev,
        scanningServers: new Set([...prev.scanningServers].filter(id => id !== serverId)),
        error: error instanceof Error ? error.message : 'Scan failed'
      }));
    }
  }, []);

  /**
   * Scan all configured servers
   */
  const scanAllServers = useCallback(async () => {
    const config = getServersConfig();
    
    if (config.servers.length === 0) {
      setState(prev => ({ ...prev, error: 'No servers configured' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    // Scan all servers in parallel
    await Promise.all(
      config.servers.map(server => scanServer(server.id))
    );

    setState(prev => ({ ...prev, loading: false }));
  }, [scanServer]);

  /**
   * Clear all library data
   */
  const clearLibrary = useCallback(() => {
    setState({
      tracks: [],
      artists: [],
      albums: [],
      stats: null,
      loading: false,
      error: null,
      scanningServers: new Set()
    });
    libraryStore.clearLibrary();
  }, [libraryStore]);

  /**
   * Get tracks from a specific server
   */
  const getTracksByServer = useCallback((serverId: string) => {
    return state.tracks.filter(t => t.serverId === serverId);
  }, [state.tracks]);

  return {
    ...state,
    scanServer,
    scanAllServers,
    clearLibrary,
    getTracksByServer,
    isScanning: state.loading || state.scanningServers.size > 0
  };
}
