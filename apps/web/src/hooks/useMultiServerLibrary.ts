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
  type Track,
  type Artist,
  type Album,
  type Playlist
} from '@sonantica/media-library';
import { useSettingsStore } from '../stores/settingsStore';
import { useOfflineStore } from '@sonantica/offline-manager';
import { OfflineStatus, generateStableId } from '@sonantica/shared';

export function useMultiServerLibrary() {
  // Store state (Reactive)
  const tracks = useLibraryStore(state => state.tracks);
  const artists = useLibraryStore(state => state.artists);
  const albums = useLibraryStore(state => state.albums);
  const playlists = useLibraryStore(state => state.playlists);
  const stats = useLibraryStore(state => state.stats);
  const storeHasHydrated = useLibraryStore(state => state._hasHydrated);
  
  // Store actions
  const updateLibraryBatch = useLibraryStore(state => state.updateLibraryBatch);
  const storeClearLibrary = useLibraryStore(state => state.clearLibrary);
  
  // Local state for scanning process
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanningServers, setScanningServers] = useState<Set<string>>(new Set());

  // Polling interval ref
  const pollingIntervalRef = useRef<number | null>(null);

  /**
   * Load offline content into the library
   * Ensures content is available even without server connection
   */
  const loadOfflineContent = useCallback(() => {
    const offlineItems = useOfflineStore.getState().items;
    const offlineTracks: Track[] = [];

    // 1. Extract tracks from offline store
    Object.values(offlineItems).forEach(item => {
      if (item && item.status === OfflineStatus.COMPLETED && item.track) {
        offlineTracks.push(item.track);
      }
    });

    if (offlineTracks.length === 0) return;

    // 2. Derive Artists and Albums from tracks
    const artistsMap = new Map<string, Artist>();
    const albumsMap = new Map<string, Album>();

    offlineTracks.forEach(track => {
      if (!track) return;
      const artistName = track.artist || 'Unknown Artist';
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

      const albumTitle = track.album || 'Unknown Album';
      const albumKey = `${artistName}||${albumTitle}`;
      
      if (!albumsMap.has(albumKey)) {
        albumsMap.set(albumKey, {
          id: generateStableId(`album-${albumKey}`),
          title: albumTitle,
          artist: artistName,
          year: track.year,
          coverArt: track.coverArt,
          addedAt: track.addedAt || new Date(),
          updatedAt: new Date(),
          trackCount: 0,
          serverIds: ['offline']
        } as unknown as Album);
      }
    });

    const currentStore = useLibraryStore.getState();
    const currentTracks = currentStore.tracks;
    
    // Deduplicate
    const trackMap = new Map(currentTracks.filter(Boolean).map(t => [t.id, t]));
    let tracksChanged = false;
    
    offlineTracks.filter(Boolean).forEach(t => {
      if (!trackMap.has(t.id)) {
        trackMap.set(t.id, t);
        tracksChanged = true;
      }
    });

    if (tracksChanged) {
      console.log('💾 Merging offline content to store');
      const artistMap = new Map(currentStore.artists.filter(Boolean).map(a => [a.name, a]));
      Array.from(artistsMap.values()).forEach(a => {
        if (!artistMap.has(a.name)) artistMap.set(a.name, a);
      });

      const albumMap = new Map(currentStore.albums.filter(Boolean).map(a => [a.title + a.artist, a]));
      Array.from(albumsMap.values()).forEach(a => {
        const key = a.title + a.artist;
        if (!albumMap.has(key)) albumMap.set(key, a);
      });

      updateLibraryBatch({
        tracks: Array.from(trackMap.values()),
        artists: Array.from(artistMap.values()),
        albums: Array.from(albumMap.values())
      });
    }
  }, [updateLibraryBatch]);

  // Load offline content when library is hydrated
  useEffect(() => {
    if (storeHasHydrated) {
      loadOfflineContent();
    }
  }, [loadOfflineContent, storeHasHydrated]);

  /**
   * Scan a specific server
   */
  const scanServer = useCallback(async (
    serverId: string, 
    _isLoadMore = false, 
    type: 'all' | 'tracks' | 'artists' | 'albums' = 'all', 
    offsetOverride?: number,
    sortOptions?: { sort: string; order: 'asc' | 'desc' }
  ) => {
    const config = getServersConfig();
    const server = config.servers.find(s => s.id === serverId);
    
    if (!server || server.enabled === false) return;

    setScanningServers(prev => {
      const next = new Set(prev);
      next.add(serverId);
      return next;
    });

    try {
      const adapter = createLibraryAdapterForServer(serverId);
      if (!adapter) throw new Error('Failed to create adapter');

      // Test connection
      if (offsetOverride === undefined) {
        const connected = await adapter.testConnection();
        if (!connected) throw new Error(`Unable to connect to ${server.name}`);
      }

      let fetchedTracks: Track[] = [];
      let fetchedArtists: Artist[] = [];
      let fetchedAlbums: Album[] = [];
      let fetchedPlaylists: Playlist[] = [];

      const promises = [];
      const shouldFetchTracks = type === 'all' || type === 'tracks';
      const shouldFetchArtists = type === 'all' || type === 'artists';
      const shouldFetchAlbums = type === 'all' || type === 'albums';
      const shouldFetchPlaylists = type === 'all';

      console.log(`🚀 Loading FULL library from ${server.name}`);
      
      if (shouldFetchTracks) {
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
               if (Array.isArray(res)) fetchedPlaylists = res;
               else if (res && typeof res === 'object' && Array.isArray((res as any).playlists)) {
                 fetchedPlaylists = (res as any).playlists;
               }
             })
             .catch(() => fetchedPlaylists = [])
         );
      }

      await Promise.all(promises);

      // Normalize and tag data
      const baseUrl = server.serverUrl.endsWith('/') ? server.serverUrl : `${server.serverUrl}/`;
      const normalizeArt = (art?: string) => {
        if (!art || art.startsWith('http') || art.startsWith('data:') || art.startsWith('blob:')) return art;
        return `${baseUrl}${art.startsWith('/') ? art.slice(1) : art}`;
      };

      const taggedTracks = fetchedTracks.filter(Boolean).map(track => ({
        ...track,
        serverId: server.id,
        serverName: server.name,
        serverColor: server.color,
        coverArt: normalizeArt(track.coverArt)
      }));

      const taggedArtists = fetchedArtists.filter(Boolean).map(artist => ({
        ...artist,
        serverId: server.id,
        imageUrl: normalizeArt(artist.imageUrl) 
      }));

      const taggedAlbums = fetchedAlbums.filter(Boolean).map(album => ({
        ...album,
        serverId: server.id,
        coverArt: normalizeArt(album.coverArt)
      }));

      const taggedPlaylists = fetchedPlaylists.filter(Boolean).map(playlist => ({
        ...playlist,
        serverId: server.id
      }));

      // Update Store Atomically
      const currentStore = useLibraryStore.getState();
      const updates: any = {};

      if (shouldFetchTracks) {
          const offlineItems = useOfflineStore.getState().items;
          const otherTracks = currentStore.tracks.filter(t => t && t.serverId !== serverId);
          const offlineTracksForServer = currentStore.tracks.filter(t => 
            t && t.serverId === serverId && offlineItems[t.id]?.status === OfflineStatus.COMPLETED
          );

          const trackMap = new Map<string, Track>(taggedTracks.filter(Boolean).map(t => [t.id, t as Track]));
          offlineTracksForServer.forEach(t => {
            if (t && !trackMap.has(t.id)) trackMap.set(t.id, t);
          });

          updates.tracks = [...otherTracks, ...Array.from(trackMap.values())];
      }

      if (shouldFetchArtists) {
          const otherArtists = currentStore.artists.filter(a => a && (a as any).serverId !== serverId);
          updates.artists = [...otherArtists, ...taggedArtists];
      }
      
      if (shouldFetchAlbums) {
          const otherAlbums = currentStore.albums.filter(a => a && (a as any).serverId !== serverId);
          updates.albums = [...otherAlbums, ...taggedAlbums];
      }

      if (shouldFetchPlaylists) {
          const otherPlaylists = currentStore.playlists.filter(p => p && (p as any).serverId !== serverId);
          updates.playlists = [...otherPlaylists, ...taggedPlaylists];
      }

      updateLibraryBatch(updates);

      setScanningServers(prev => {
        const next = new Set(prev);
        next.delete(serverId);
        return next;
      });

    } catch (err) {
      console.error(`Failed to scan ${server.name}:`, err);
      setScanningServers(prev => {
        const next = new Set(prev);
        next.delete(serverId);
        return next;
      });
      setError(err instanceof Error ? err.message : 'Scan failed');
    }
  }, [updateLibraryBatch]);

  /**
   * Trigger a remote scan on the server
   */
  const triggerRemoteScan = useCallback(async (serverId: string) => {
    const config = getServersConfig();
    const server = config.servers.find(s => s.id === serverId);
    if (!server) return;

    const settings = useSettingsStore.getState();
    try {
      const adapter = createLibraryAdapterForServer(serverId);
      if (adapter) {
        await adapter.startScan({
           scanFileSizeLimit: settings.scanFileSizeLimit,
           coverArtSizeLimit: settings.coverArtSizeLimit,
           watchFolders: settings.watchFolders,
           parallelScanning: settings.parallelScanning
        });
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
    startPolling();
  }, [triggerRemoteScan]);

  /**
   * Check scan status for all servers and update library
   */
  const checkScanStatus = useCallback(async () => {
    const config = getServersConfig();
    let anyScanning = false;

    await Promise.all(config.servers.map(async (server) => {
      try {
        const adapter = createLibraryAdapterForServer(server.id);
        if (!adapter) return;
        const status = await adapter.getScanStatus();
        if (status.isScanning) anyScanning = true;
      } catch (e) {
        console.error(`Status check failed for ${server.name}`, e);
      }
    }));

    if (anyScanning) {
      await Promise.all(config.servers.map(server => scanServer(server.id, false, 'all', 0)));
    } else {
      stopPolling();
    }
  }, [scanServer]);

  /**
   * Start polling for scan status
   */
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    checkScanStatus();
    pollingIntervalRef.current = setInterval(checkScanStatus, 15000);
  }, [checkScanStatus]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
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
      setError('No servers configured');
      return;
    }

    setLoading(true);
    setError(null);

    const enabledServers = config.servers.filter(s => s.enabled !== false);
    await Promise.all(enabledServers.map(server => scanServer(server.id, false)));
    setLoading(false);
  }, [scanServer]);

  // Cleanup cleanup
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Monitor scanning state
  useEffect(() => {
    if (scanningServers.size > 0 && !pollingIntervalRef.current) {
      startPolling();
    } else if (scanningServers.size === 0 && pollingIntervalRef.current) {
      stopPolling();
    }
  }, [scanningServers.size, startPolling, stopPolling]);

  /**
   * Clear all library data
   */
  const clearLibrary = useCallback(() => {
    setError(null);
    setScanningServers(new Set());
    storeClearLibrary();
  }, [storeClearLibrary]);

  /**
   * Get tracks by server
   */
  const getTracksByServer = useCallback((serverId: string) => {
    return tracks.filter(t => t.serverId === serverId);
  }, [tracks]);

  /**
   * Toggle server enabled state
   */
  const toggleServer = useCallback(async (serverId: string, enabled: boolean) => {
      const { updateServerConfig } = await import('../services/LibraryService');
      updateServerConfig(serverId, { enabled });

      if (enabled) {
          await scanServer(serverId);
      } else {
          const offlineItems = useOfflineStore.getState().items;
          const currentStore = useLibraryStore.getState();
          
          updateLibraryBatch({
            tracks: currentStore.tracks.filter(t => t && (t.serverId !== serverId || offlineItems[t.id]?.status === OfflineStatus.COMPLETED)),
            artists: currentStore.artists.filter(a => a && (a as any).serverId !== serverId),
            albums: currentStore.albums.filter(a => a && (a as any).serverId !== serverId),
            playlists: currentStore.playlists.filter(p => p && (p as any).serverId !== serverId)
          });
      }
  }, [scanServer, updateLibraryBatch]);

  return {
    tracks,
    artists,
    albums,
    playlists,
    stats,
    loading,
    error,
    scanningServers,
    scanServer,
    scanAllServers,
    triggerRemoteScan,
    triggerRescanAll,
    clearLibrary,
    getTracksByServer,
    isScanning: loading || scanningServers.size > 0,
    startPolling,
    stopPolling,
    toggleServer
  };
}
