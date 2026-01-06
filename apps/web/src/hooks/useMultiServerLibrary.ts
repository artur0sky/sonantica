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
import { useOfflineStore } from '@sonantica/offline-manager';
import { OfflineStatus, generateStableId } from '@sonantica/shared';

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
  const { 
    tracks: storeTracks, 
    artists: storeArtists, 
    albums: storeAlbums,
    setTracks,
    setArtists,
    setAlbums,
    clearLibrary: storeClearLibrary
  } = useLibraryStore();
  
  const [state, setState] = useState<MultiServerLibraryState>({
    tracks: storeTracks,
    artists: storeArtists,
    albums: storeAlbums,
    stats: null,
    loading: false,
    error: null,
    scanningServers: new Set()
  });

  // Sync with store on mount
  useEffect(() => {
    setState(prev => ({
      ...prev,
      tracks: storeTracks,
      artists: storeArtists,
      albums: storeAlbums
    }));
  }, [storeTracks, storeArtists, storeAlbums]);

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

      // Normalize and tag data
      const baseUrl = server.serverUrl.endsWith('/') ? server.serverUrl : `${server.serverUrl}/`;
      
      const normalizeArt = (art?: string) => {
        if (!art || art.startsWith('http') || art.startsWith('data:') || art.startsWith('blob:')) return art;
        // If relative path, prefix with server base URL
        return `${baseUrl}${art.startsWith('/') ? art.slice(1) : art}`;
      };

      const taggedTracks = tracks.map(track => ({
        ...track,
        serverId: server.id,
        serverName: server.name,
        coverArt: normalizeArt(track.coverArt)
      }));

      const taggedArtists = artists.map(artist => ({
        ...artist,
        serverId: server.id,
        imageUrl: normalizeArt(artist.imageUrl) 
      }));

      const taggedAlbums = albums.map(album => ({
        ...album,
        serverId: server.id,
        coverArt: normalizeArt(album.coverArt)
      }));

      console.log(`🏷️ Tagged data from ${server.name}`);

      // Merge with existing data (remove old data from this server first)
      setState(prev => {
        const otherTracks = prev.tracks.filter(t => t.serverId !== serverId);
        const otherArtists = prev.artists.filter(a => (a as any).serverId !== serverId);
        const otherAlbums = prev.albums.filter(a => (a as any).serverId !== serverId);

        const newTracks = [...otherTracks, ...taggedTracks];
        const newArtists = [...otherArtists, ...taggedArtists];
        const newAlbums = [...otherAlbums, ...taggedAlbums];

        // Sync with library store
        setTracks(newTracks);
        setArtists(newArtists);
        setAlbums(newAlbums);

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
    storeClearLibrary();
  }, [storeClearLibrary]);

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
