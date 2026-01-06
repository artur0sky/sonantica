/**
 * useOfflineManager Hook
 * 
 * Manages offline downloads and provides a clean API for components.
 * Follows Sonántica's philosophy: "User autonomy" - full control over offline content.
 */

import { useCallback, useMemo } from 'react';
import { OfflineManager, WebOfflineAdapter, useOfflineStore } from '@sonantica/offline-manager';
import { useSettingsStore } from '../stores/settingsStore';
import { buildTrackStreamingUrl } from '../utils/streamingUrl';
import type { Track } from '@sonantica/shared';

// Singleton instance
let offlineManagerInstance: OfflineManager | null = null;

function getOfflineManager(): OfflineManager {
  if (!offlineManagerInstance) {
    const adapter = new WebOfflineAdapter();
    offlineManagerInstance = new OfflineManager(adapter, (track: Track) => {
      return buildTrackStreamingUrl(track);
    });
    
    // Auto-verify integrity on startup to fix any "zombie" tracks
    // (tracks marked as downloaded but missing from cache or corrupt)
    offlineManagerInstance.verifyIntegrity().catch((err: unknown) => {
      console.error('Failed to verify offline integrity:', err);
    });
  }
  return offlineManagerInstance;
}

export function useOfflineManager() {
  const { downloadQuality } = useSettingsStore();
  const offlineItems = useOfflineStore((state: any) => state.items);
  const manager = useMemo(() => getOfflineManager(), []);

  const downloadTrack = useCallback(async (track: Track) => {
    try {
      await manager.downloadTrack(track, downloadQuality as any);
      console.log(`✅ Queued track for download: ${track.title}`);
    } catch (error) {
      console.error('❌ Failed to queue track for download:', error);
    }
  }, [manager, downloadQuality]);

  const downloadTracks = useCallback(async (tracks: Track[]) => {
    try {
      await manager.downloadTracks(tracks, downloadQuality as any);
      console.log(`✅ Queued ${tracks.length} tracks for download`);
    } catch (error) {
      console.error('❌ Failed to queue tracks for download:', error);
    }
  }, [manager, downloadQuality]);

  const removeTrack = useCallback(async (trackId: string) => {
    try {
      await manager.removeTrack(trackId);
      console.log(`✅ Removed track from offline: ${trackId}`);
    } catch (error) {
      console.error('❌ Failed to remove track from offline:', error);
    }
  }, [manager]);

  const getTrackStatus = useCallback((trackId: string) => {
    return manager.getTrackStatus(trackId);
  }, [manager]);

  const getOfflineTracks = useCallback(() => {
    return manager.getOfflineTracks();
  }, [manager]);

  return {
    downloadTrack,
    downloadTracks,
    removeTrack,
    getTrackStatus,
    getOfflineTracks,
    offlineItems,
  };
}
