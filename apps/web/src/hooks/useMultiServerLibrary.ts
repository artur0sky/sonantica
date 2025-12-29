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
import { 
  useLibraryStore,
  type LibraryStats,
  type Track,
  type Artist,
  type Album
} from '@sonantica/media-library';
import { useSettingsStore } from '../stores/settingsStore';

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
   * Scan a specific server (Sync metadata to client)
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
   * Trigger a remote scan on the server (Command server to index files)
   */
  const triggerRemoteScan = useCallback(async (serverId: string) => {
    const config = getServersConfig();
    const server = config.servers.find(s => s.id === serverId);
    
    if (!server) return;

    // Get settings from store state (using getState if available or just reading current state if hook is re-rendered)
    // Zustand hook based access:
    const settings = useSettingsStore.getState();

    try {
      const adapter = createLibraryAdapterForServer(serverId);
      if (adapter) {
        console.log(`📡 Triggering remote scan on ${server.name} with options:`, {
            limit: settings.scanFileSizeLimit,
            artLimit: settings.coverArtSizeLimit
        });
        
        await adapter.startScan({
           scanFileSizeLimit: settings.scanFileSizeLimit,
           coverArtSizeLimit: settings.coverArtSizeLimit
        });
        
        // Optionally follow up with a sync (scanServer) if desired, 
        // but typically scan is async on server.
      }
    } catch (e) {
      console.error("Failed to trigger remote scan", e);
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
   * Trigger remote scan on ALL servers
   */
  const triggerRescanAll = useCallback(async () => {
    const config = getServersConfig();
    await Promise.all(
      config.servers.map(server => triggerRemoteScan(server.id))
    );
  }, [triggerRemoteScan]);

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
    triggerRemoteScan,
    triggerRescanAll,
    clearLibrary,
    getTracksByServer,
    isScanning: state.loading || state.scanningServers.size > 0
  };
}
