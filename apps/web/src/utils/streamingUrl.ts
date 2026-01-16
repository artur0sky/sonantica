/**
 * Streaming URL Utilities
 * 
 * Helper functions to construct streaming URLs from track data and server configuration.
 */

import { getServersConfig } from '../services/LibraryService';
import { useOfflineStore } from '@sonantica/offline-manager';
import { OfflineStatus, extractOriginalId } from '@sonantica/shared';
import { useLibraryStore } from '@sonantica/media-library';

/**
 * Build streaming URL for a track
 * Resolves the server URL from the serverId and constructs the full streaming URL
 * 
 * @param serverId Server identifier or full URL
 * @param filePath Relative path for fallback
 * @param trackId Global unique ID (used for offline cache key)
 * @param originalId Raw ID from server (used for remote stream endpoint)
 */
export function buildStreamingUrl(serverId: string, filePath: string, trackId?: string, originalId?: string): string {
  try {
    // Check if available offline first
    if (trackId) {
      const offlineItem = useOfflineStore.getState().items[trackId];
      if (offlineItem?.status === OfflineStatus.COMPLETED) {
        const encodedId = encodeURIComponent(trackId);
        const offlineUrl = `/offline/track?id=${encodedId}`;
        console.log(`📦 Serving track ${trackId} from offline cache: ${offlineUrl}`);
        return offlineUrl;
      }
    }

    // If serverId is already a full URL (from RemoteLibraryAdapter), use it directly
    let baseUrl: string;
    if (serverId.startsWith('http://') || serverId.startsWith('https://')) {
      baseUrl = serverId.replace(/\/$/, ''); // Remove trailing slash
    } else {
      // Legacy: Try to find server in configuration
      const config = getServersConfig();
      const server = config.servers.find(s => s.id === serverId);
      
      if (!server) {
        console.error(`❌ Server not found for serverId: ${serverId}`);
        console.error('Available servers:', config.servers.map(s => ({ id: s.id, name: s.name })));
        return `/api/stream/${serverId}/${encodeURIComponent(filePath)}`;
      }
      
      baseUrl = server.serverUrl.replace(/\/$/, '');
    }
    
    
    // Determine the ID to use for the remote stream request
    // Favor explicit originalId, then extract from trackId if it has the remote- prefix
    const streamId = originalId || extractOriginalId(trackId);
    
    // Use streamId for secure ID-based streaming
    if (streamId) {
      const streamUrl = `${baseUrl}/stream/${streamId}`;
      console.log(`🎵 Stream URL: ${streamUrl}`);
      return streamUrl;
    }

    // Fallback to path-based streaming (may fail on newer backends)
    console.warn("⚠️ trackId missing, falling back to legacy path streaming (may fail)");
    const encodedPath = encodeURIComponent(filePath);
    return `${baseUrl}/stream/${encodedPath}`;
  } catch (error) {
    console.error('❌ Error constructing streaming URL:', error);
    console.error('serverId:', serverId, 'filePath:', filePath);
    return `/api/stream/${serverId}/${encodeURIComponent(filePath)}`;
  }
}

/**
 * Build streaming URL from a track object
 */
export function buildTrackStreamingUrl(track: { id?: string; originalId?: string; serverId?: string; filePath?: string }): string {
  if (!track.serverId || !track.filePath) {
    console.error('❌ Track missing serverId or filePath:', track);
    return '';
  }
  
  return buildStreamingUrl(track.serverId, track.filePath, track.id, track.originalId);
}

import { useSettingsStore } from '../stores/settingsStore';
import { getBestSource } from '@sonantica/shared';
import { type Track } from '@sonantica/media-library';

/**
 * Convert Track to MediaSource with proper metadata structure
 * This is the canonical way to convert library tracks to playable sources
 */
export function trackToMediaSource(track: any): any {
  // If track has multiple sources, select the best one based on priority
  const settings = useSettingsStore.getState();
  const bestTrack = getBestSource(track, settings.sourcePriority) as Track;

  // Try to get enriched cover art from library store if missing
  let coverArt = bestTrack.coverArt || bestTrack.metadata?.coverArt;
  
  if (!coverArt) {
    try {
      // Direct access to store to avoid hook issues in utils
      const libraryTracks = useLibraryStore.getState().tracks;
      const foundTrack = libraryTracks.find((t: any) => t.id === bestTrack.id);
      if (foundTrack) {
        coverArt = foundTrack.coverArt;
      }
    } catch (e) {
      // Ignore if store not available
    }
  }

  // Determine the URL to use
  let url: string;
  
  // Check if this is a local file (from Tauri desktop app)
  if (bestTrack.source === 'local' && bestTrack.filePath) {
    // Local files already have Tauri asset URL in filePath
    url = bestTrack.filePath;
    console.log(`🎵 Local file URL: ${url}`);
  } else if (bestTrack.serverId && bestTrack.filePath) {
    // Remote server track - build streaming URL
    url = buildStreamingUrl(bestTrack.serverId, bestTrack.filePath, bestTrack.id, bestTrack.originalId);
  } else {
    console.error('❌ Track missing required fields for playback:', bestTrack);
    url = '';
  }

  return {
    id: bestTrack.id,
    url,
    metadata: {
      title: bestTrack.title || bestTrack.metadata?.title,
      artist: bestTrack.artist || bestTrack.metadata?.artist,
      album: bestTrack.album || bestTrack.metadata?.album,
      duration: bestTrack.duration || bestTrack.metadata?.duration,
      coverArt: coverArt,
      year: bestTrack.year || bestTrack.metadata?.year,
      trackNumber: bestTrack.trackNumber || bestTrack.metadata?.trackNumber,
      genre: bestTrack.genre || bestTrack.metadata?.genre,
      albumArtist: bestTrack.albumArtist || bestTrack.metadata?.albumArtist,
      bitrate: bestTrack.format?.bitrate || bestTrack.metadata?.bitrate,
      sampleRate: bestTrack.format?.sampleRate || bestTrack.metadata?.sampleRate,
      bitsPerSample: bestTrack.format?.bitsPerSample || bestTrack.metadata?.bitsPerSample,
      lyrics: bestTrack.lyrics || bestTrack.metadata?.lyrics,
    },
  };
}

