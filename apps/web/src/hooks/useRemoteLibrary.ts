/**
 * Remote Library Integration Hook
 * 
 * Provides integration with remote Sonántica API server.
 * Handles fetching tracks, artists, albums from the server.
 * 
 * Philosophy: "Server-First" - The server is the source of truth
 */

import { useState, useEffect } from 'react';
import { createLibraryAdapter, isServerConfigured } from '../services/LibraryService';
import type { Track, Artist, Album } from '@sonantica/shared';
import type { LibraryStats } from '@sonantica/media-library';

interface RemoteLibraryState {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  stats: LibraryStats | null;
  loading: boolean;
  error: string | null;
  configured: boolean;
}

export function useRemoteLibrary() {
  const [state, setState] = useState<RemoteLibraryState>({
    tracks: [],
    artists: [],
    albums: [],
    stats: null,
    loading: false,
    error: null,
    configured: isServerConfigured()
  });

  const adapter = createLibraryAdapter();

  useEffect(() => {
    if (!adapter) {
      setState(prev => ({
        ...prev,
        configured: false,
        loading: false,
        error: 'No server configured'
      }));
      return;
    }

    const loadLibrary = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        // Test connection first
        const connected = await adapter.testConnection();
        if (!connected) {
          throw new Error('Unable to connect to server');
        }

        // Load library data
        const [tracks, artists, albums, stats] = await Promise.all([
          adapter.getTracks(),
          adapter.getArtists(),
          adapter.getAlbums(),
          adapter.getStats()
        ]);

        setState({
          tracks,
          artists,
          albums,
          stats,
          loading: false,
          error: null,
          configured: true
        });

        console.log('📡 Remote library loaded:', {
          tracks: tracks.length,
          artists: artists.length,
          albums: albums.length
        });
      } catch (error) {
        console.error('Failed to load remote library:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load library'
        }));
      }
    };

    loadLibrary();
  }, [adapter]);

  const triggerScan = async () => {
    if (!adapter) {
      throw new Error('No server configured');
    }
    
    try {
      await adapter.startScan();
      console.log('🔄 Remote scan triggered');
    } catch (error) {
      console.error('Failed to trigger scan:', error);
      throw error;
    }
  };

  const getScanStatus = async () => {
    if (!adapter) return null;
    
    try {
      return await adapter.getScanStatus();
    } catch (error) {
      console.error('Failed to get scan status:', error);
      return null;
    }
  };

  return {
    ...state,
    adapter,
    triggerScan,
    getScanStatus,
    reload: () => {
      if (adapter) {
        setState(prev => ({ ...prev, loading: true }));
        // Trigger re-load by changing a dependency
      }
    }
  };
}
