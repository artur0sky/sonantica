/**
 * Multi-Server Library Hook
 * 
 * Manages library data from multiple Sonántica servers.
 * Allows scanning all servers or individual servers.
 * Aggregates tracks from all sources.
 * 
 * Philosophy: "User Autonomy" - Multiple self-hosted instances
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  getServersConfig, 
  createLibraryAdapterForServer
} from '../services/LibraryService';
import { 
  useLibraryStore,
  type LibraryStats,
  type Track,
  type Artist,
  type Album,
  type Playlist
} from '@sonantica/media-library';
import { useSettingsStore } from '../stores/settingsStore';
import { useOfflineStore } from '@sonantica/offline-manager';
import { OfflineStatus, generateStableId } from '@sonantica/shared';

interface MultiServerLibraryState {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  stats: LibraryStats | null;
  loading: boolean;
  error: string | null;
  scanningServers: Set<string>;
}

export function useMultiServerLibrary() {
  const { 
    tracks: storeTracks, 
    artists: storeArtists, 
    albums: storeAlbums,
    setTracks,
    setArtists,
    setAlbums,
    setPlaylists,
    playlists: storePlaylists,
    clearLibrary: storeClearLibrary
  } = useLibraryStore();
  
  const [state, setState] = useState<MultiServerLibraryState>({
    tracks: storeTracks,
    artists: storeArtists,
    albums: storeAlbums,
    playlists: storePlaylists,
    stats: null,
    loading: false,
    error: null,
    scanningServers: new Set()
  });

  // Polling interval ref
  const pollingIntervalRef = useRef<number | null>(null);

  // Sync with store on mount
  useEffect(() => {
    setState(prev => ({
      ...prev,
      tracks: storeTracks,
      artists: storeArtists,
      albums: storeAlbums,
      playlists: storePlaylists
    }));
  }, [storeTracks, storeArtists, storeAlbums, storePlaylists]);

  /**
   * Load offline content into the library
   * Ensures content is available even without server connection
   */
  const loadOfflineContent = useCallback(() => {
    const offlineItems = useOfflineStore.getState().items;
    const offlineTracks: Track[] = [];

    // 1. Extract tracks from offline store
    Object.values(offlineItems).forEach(item => {
      if (item.status === OfflineStatus.COMPLETED && item.track) {
        offlineTracks.push(item.track);
      }
    });

    if (offlineTracks.length === 0) return;

    console.log(`📦 Loaded ${offlineTracks.length} offline tracks`);

    // 2. Derive Artists and Albums from tracks
    const artistsMap = new Map<string, Artist>();
    const albumsMap = new Map<string, Album>();

    offlineTracks.forEach(track => {
      // Process Artist
      const artistName = track.artist || 'Unknown Artist';
      // Use name as key for deduplication
      if (!artistsMap.has(artistName)) {
        artistsMap.set(artistName, {
          id: generateStableId(`artist-${artistName}`),
          name: artistName,
          addedAt: track.addedAt || new Date(),
          updatedAt: new Date(),
          trackCount: 0, 
          albumCount: 0,
          imageUrl: undefined,
          serverIds: ['offline']
        } as unknown as Artist);
      }

      // Process Album
      const albumTitle = track.album || 'Unknown Album';
      const albumKey = `${artistName}||${albumTitle}`; // Composite key
      
      if (!albumsMap.has(albumKey)) {
        albumsMap.set(albumKey, {
          id: generateStableId(`album-${albumKey}`),
          title: albumTitle,
          artist: artistName,
          year: track.year,
          coverArt: track.coverArt, // Use track cover art
          addedAt: track.addedAt || new Date(),
          updatedAt: new Date(),
          trackCount: 0,
          serverIds: ['offline']
        } as unknown as Album);
      }
    });

    const offlineArtists = Array.from(artistsMap.values());
    const offlineAlbums = Array.from(albumsMap.values());

    // 3. Merge into store directly
    // The useEffect at line 59 will handle syncing this back to local state
    
    // We need to merge with CURRENT store state, not local state, to be safe.
    const currentTracks = useLibraryStore.getState().tracks;
    const currentArtists = useLibraryStore.getState().artists;
    const currentAlbums = useLibraryStore.getState().albums;

    // Deduplicate
    const trackMap = new Map(currentTracks.map(t => [t.id, t]));
    offlineTracks.forEach(t => trackMap.set(t.id, t));

    const artistMap = new Map(currentArtists.map(a => [a.name, a]));
    offlineArtists.forEach(a => {
      if (!artistMap.has(a.name)) artistMap.set(a.name, a);
    });

    const albumMap = new Map(currentAlbums.map(a => [a.title + a.artist, a]));
    offlineAlbums.forEach(a => {
      const key = a.title + a.artist;
      if (!albumMap.has(key)) albumMap.set(key, a);
    });

    const newTracks = Array.from(trackMap.values());
    const newArtists = Array.from(artistMap.values());
    const newAlbums = Array.from(albumMap.values());

    // Only update if count changed to avoid loops/noise
    if (newTracks.length !== currentTracks.length) {
       console.log('💾 Merging offline content to store');
       setTracks(newTracks);
       setArtists(newArtists);
       setAlbums(newAlbums);
    }
  }, [setTracks, setArtists, setAlbums]);

  // Load offline content on mount
  useEffect(() => {
    loadOfflineContent();
  }, [loadOfflineContent]);

  /* Pagination State */
  // const [serverOffsets, setServerOffsets] = useState<Record<string, { tracks: number, artists: number, albums: number }>>({});
  // const LIMIT = 50;

  /**
   * Scan a specific server (Sync metadata to client)
   * Now loads ALL data at once for virtual scrolling (cached by Redis)
   */
  const scanServer = useCallback(async (
    serverId: string, 
    isLoadMore = false, 
    type: 'all' | 'tracks' | 'artists' | 'albums' = 'all', 
    offsetOverride?: number,
    sortOptions?: { sort: string; order: 'asc' | 'desc' }
  ) => {
    const config = getServersConfig();
    const server = config.servers.find(s => s.id === serverId);
    
    if (!server) {
      console.error('Server not found:', serverId);
      return;
    }

    if (server.enabled === false) {
       console.log(`Skipping scan for disabled server: ${server.name}`);
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

      // Test connection (only on initial scan)
      if (!isLoadMore && offsetOverride === undefined) {
        const connected = await adapter.testConnection();
        if (!connected) {
          throw new Error(`Unable to connect to ${server.name}`);
        }
      }

      // Load ALL data at once (limit=-1) for virtual scrolling
      // Redis will cache this for super fast subsequent loads
      let fetchedTracks: Track[] = [];
      let fetchedArtists: Artist[] = [];
      let fetchedAlbums: Album[] = [];
      let fetchedPlaylists: Playlist[] = [];

      const promises = [];
      
      const shouldFetchTracks = type === 'all' || type === 'tracks';
      const shouldFetchArtists = type === 'all' || type === 'artists';
      const shouldFetchAlbums = type === 'all' || type === 'albums';
      // Playlists are lightweight, fetch them always or when 'all'
      const shouldFetchPlaylists = type === 'all';

      console.log(`🚀 Loading FULL library from ${server.name} (Virtual Scrolling Mode)`);
      
      if (shouldFetchTracks) {
        // limit=-1 means "get everything"
        promises.push(adapter.getTracks({ limit: -1, offset: 0, ...sortOptions }).then(res => fetchedTracks = res));
      }
      if (shouldFetchArtists) {
        promises.push(adapter.getArtists({ limit: -1, offset: 0, ...sortOptions }).then(res => fetchedArtists = res));
      }
      if (shouldFetchAlbums) {
        promises.push(adapter.getAlbums({ limit: -1, offset: 0, ...sortOptions }).then(res => fetchedAlbums = res));
      }
      if (shouldFetchPlaylists && adapter.getPlaylists) {
         promises.push(
           adapter.getPlaylists()
             .then(res => {
               // Validate response is an array
               if (Array.isArray(res)) {
                 fetchedPlaylists = res;
               } else if (res && typeof res === 'object' && Array.isArray((res as any).playlists)) {
                 // Handle { playlists: [...] } response format
                 fetchedPlaylists = (res as any).playlists;
               } else {
                 console.warn('Invalid playlists response format:', res);
                 fetchedPlaylists = [];
               }
             })
             .catch(err => {
               console.warn('Failed to fetch playlists (non-critical):', err);
               fetchedPlaylists = [];
             })
         );
      }

      await Promise.all(promises);

      // Normalize and tag data
      const baseUrl = server.serverUrl.endsWith('/') ? server.serverUrl : `${server.serverUrl}/`;
      
      const normalizeArt = (art?: string) => {
        if (!art || art.startsWith('http') || art.startsWith('data:') || art.startsWith('blob:')) return art;
        return `${baseUrl}${art.startsWith('/') ? art.slice(1) : art}`;
      };

      const taggedTracks = fetchedTracks.map(track => ({
        ...track,
        serverId: server.id,
        serverName: server.name,
        serverColor: server.color,
        coverArt: normalizeArt(track.coverArt)
      }));

      const taggedArtists = fetchedArtists.map(artist => ({
        ...artist,
        serverId: server.id,
        imageUrl: normalizeArt(artist.imageUrl) 
      }));

      const taggedAlbums = fetchedAlbums.map(album => ({
        ...album,
        serverId: server.id,
        coverArt: normalizeArt(album.coverArt)
      }));

      const taggedPlaylists = fetchedPlaylists.map(playlist => ({
        ...playlist,
        serverId: server.id
      }));

      console.log(`✅ Loaded FULL library from ${server.name}`, {
        tracks: taggedTracks.length,
        artists: taggedArtists.length,
        albums: taggedAlbums.length,
        playlists: taggedPlaylists.length
      });

      // Update Store (Sync source of truth)
      // We read from the store directly to ensure we have the latest state before merging
      const currentStore = useLibraryStore.getState();
      
      let newTracks = currentStore.tracks;
      let newArtists = currentStore.artists;
      let newAlbums = currentStore.albums;
      let newPlaylists = currentStore.playlists;

      if (shouldFetchTracks) {
          const otherTracks = currentStore.tracks.filter(t => t.serverId !== serverId);
          newTracks = [...otherTracks, ...taggedTracks];
      }

      if (shouldFetchArtists) {
          const otherArtists = currentStore.artists.filter(a => (a as any).serverId !== serverId);
          newArtists = [...otherArtists, ...taggedArtists];
      }
      
      if (shouldFetchAlbums) {
          const otherAlbums = currentStore.albums.filter(a => (a as any).serverId !== serverId);
          newAlbums = [...otherAlbums, ...taggedAlbums];
      }

      if (shouldFetchPlaylists) {
          const otherPlaylists = currentStore.playlists.filter(p => (p as any).serverId !== serverId);
          newPlaylists = [...otherPlaylists, ...taggedPlaylists];
      }

      // Update the store - this will trigger the useEffect to update local state
      if (shouldFetchTracks) setTracks(newTracks);
      if (shouldFetchArtists) setArtists(newArtists);
      if (shouldFetchAlbums) setAlbums(newAlbums);
      if (shouldFetchPlaylists) setPlaylists(newPlaylists);

      // Update loading state locally
      setState(prev => ({
        ...prev,
        scanningServers: new Set([...prev.scanningServers].filter(id => id !== serverId)),
        error: null
      }));

    } catch (error) {
      console.error(`Failed to scan ${server.name}:`, error);
      setState(prev => ({
        ...prev,
        scanningServers: new Set([...prev.scanningServers].filter(id => id !== serverId)),
        error: error instanceof Error ? error.message : 'Scan failed'
      }));
    }
  }, [setTracks, setArtists, setAlbums, setPlaylists]); // Dependencies

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
           coverArtSizeLimit: settings.coverArtSizeLimit,
           watchFolders: settings.watchFolders,
           parallelScanning: settings.parallelScanning
        });
        
        // Optionally follow up with a sync (scanServer) if desired, 
        // but typically scan is async on server.
      }
    } catch (e) {
      console.error("Failed to trigger remote scan", e);
    }
  }, []);

  /**
   * Trigger remote scan on ALL servers
   */
  const triggerRescanAll = useCallback(async () => {
    const config = getServersConfig();
    await Promise.all(
      config.servers.map(server => triggerRemoteScan(server.id))
    );
    // Start polling after triggering scans
    startPolling();
  }, [triggerRemoteScan]);

  /**
   * Check scan status for all servers and update library
   */
  const checkScanStatus = useCallback(async () => {
    const config = getServersConfig();
    let anyScanning = false;

    for (const server of config.servers) {
      try {
        const adapter = createLibraryAdapterForServer(server.id);
        if (!adapter) continue;

        const status = await adapter.getScanStatus();
        if (status.isScanning) {
          anyScanning = true;
        }
      } catch (e) {
        console.error(`Failed to check scan status for ${server.name}`, e);
      }
    }

    // If scanning, refresh library data
    if (anyScanning) {
      console.log('📊 Refreshing library data during scan...');
      // Reload data from all servers to get new tracks
      for (const server of config.servers) {
        await scanServer(server.id, false, 'all', 0);
      }
    } else {
      // No servers scanning, stop polling
      console.log('✅ All scans complete, stopping polling');
      stopPolling();
    }
  }, [scanServer]);

  /**
   * Start polling for scan status every 15 seconds
   */
  const startPolling = useCallback(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    console.log('🔄 Starting scan status polling (every 15s)');
    
    // Check immediately
    checkScanStatus();

    // Then check every 15 seconds
    pollingIntervalRef.current = setInterval(() => {
      checkScanStatus();
    }, 15000); // 15 seconds
  }, [checkScanStatus]);

  /**
   * Stop polling for scan status
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('⏹️ Stopping scan status polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
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

    // Scan all ENABLED servers in parallel
    const enabledServers = config.servers.filter(s => s.enabled !== false);
    
    await Promise.all(
      enabledServers.map(server => scanServer(server.id, false))
    );

    setState(prev => ({ ...prev, loading: false }));
  }, [scanServer]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Monitor scanning state and start/stop polling accordingly
  useEffect(() => {
    if (state.scanningServers.size > 0 && !pollingIntervalRef.current) {
      startPolling();
    } else if (state.scanningServers.size === 0 && pollingIntervalRef.current) {
      stopPolling();
    }
  }, [state.scanningServers.size, startPolling, stopPolling]);

  /**
   * Clear all library data
   */
  const clearLibrary = useCallback(() => {
    setState({
      tracks: [],
      artists: [],
      albums: [],
      playlists: [],
      stats: null,
      loading: false,
      error: null,
      scanningServers: new Set()
    });
    storeClearLibrary();
  }, [storeClearLibrary]);

  /**
   * Get tracks from a specific server
   */
  const getTracksByServer = useCallback((serverId: string) => {
    return state.tracks.filter(t => t.serverId === serverId);
  }, [state.tracks]);

  /**
   * Toggle server enabled state
   */
  const toggleServer = useCallback(async (serverId: string, enabled: boolean) => {
      // 1. Update config in localStorage
      const { updateServerConfig } = await import('../services/LibraryService');
      updateServerConfig(serverId, { enabled });

      // 2. Reflect changes in library
      if (enabled) {
          // Enabled: Scan it
          console.log(`✅ Server ${serverId} enabled. Scanning...`);
          await scanServer(serverId);
      } else {
          // Disabled: Remove its tracks
          console.log(`🚫 Server ${serverId} disabled. Removing tracks...`);
          
          const currentStore = useLibraryStore.getState();
          
          const newTracks = currentStore.tracks.filter(t => t.serverId !== serverId);
          const newArtists = currentStore.artists.filter(a => (a as any).serverId !== serverId);
          const newAlbums = currentStore.albums.filter(a => (a as any).serverId !== serverId);
          const newPlaylists = currentStore.playlists.filter(p => (p as any).serverId !== serverId);
          
          setTracks(newTracks);
          setArtists(newArtists);
          setAlbums(newAlbums);
          setPlaylists(newPlaylists);
          // Local state update handled by useEffect syncing with store
      }
  }, [scanServer, setTracks, setArtists, setAlbums, setPlaylists]);

  return {
    ...state,
    scanServer,
    scanAllServers,
    triggerRemoteScan,
    triggerRescanAll,
    clearLibrary,
    getTracksByServer,
    isScanning: state.loading || state.scanningServers.size > 0,
    startPolling,
    stopPolling,
    toggleServer
  };
}
