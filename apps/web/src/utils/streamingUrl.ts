/**
 * Streaming URL Utilities
 * 
 * Helper functions to construct streaming URLs from track data and server configuration.
 */

import { getServersConfig } from '../services/LibraryService';
import { useOfflineStore } from '@sonantica/offline-manager';
import { OfflineStatus } from '@sonantica/shared';

/**
 * Build streaming URL for a track
 * Resolves the server URL from the serverId and constructs the full streaming URL
 */
export function buildStreamingUrl(serverId: string, filePath: string, trackId?: string): string {
  try {
    // Check if available offline first
    if (trackId) {
      const offlineItem = useOfflineStore.getState().items[trackId];
      if (offlineItem?.status === OfflineStatus.COMPLETED) {
        // Return the canonical offline URL pattern
        // The Service Worker or Cache API will serve this
        // Must match format in WebOfflineAdapter
        const encodedId = encodeURIComponent(trackId);
        const offlineUrl = `/offline/track/${encodedId}`;
        console.log(`📦 Serving track ${trackId} from offline cache: ${offlineUrl}`);
        return offlineUrl;
      }
    }

    // Get server configuration
    const config = getServersConfig();
    const server = config.servers.find(s => s.id === serverId);
    
    if (!server) {
      console.error(`❌ Server not found for serverId: ${serverId}`);
      console.error('Available servers:', config.servers.map(s => ({ id: s.id, name: s.name })));
      // Fallback to relative URL (will fail but at least shows the error)
      return `/api/stream/${serverId}/${encodeURIComponent(filePath)}`;
    }
    
    // Construct absolute URL
    const baseUrl = server.serverUrl.replace(/\/$/, ''); // Remove trailing slash
    const encodedPath = encodeURIComponent(filePath);
    const streamUrl = `${baseUrl}/api/stream/${serverId}/${encodedPath}`;
    
    console.log(`🎵 Stream URL: ${streamUrl}`);
    
    return streamUrl;
  } catch (error) {
    console.error('❌ Error constructing streaming URL:', error);
    console.error('serverId:', serverId, 'filePath:', filePath);
    // Return a fallback URL
    return `/api/stream/${serverId}/${encodeURIComponent(filePath)}`;
  }
}

/**
 * Build streaming URL from a track object
 */
export function buildTrackStreamingUrl(track: { id?: string; serverId?: string; filePath?: string }): string {
  if (!track.serverId || !track.filePath) {
    console.error('❌ Track missing serverId or filePath:', track);
    return '';
  }
  
  return buildStreamingUrl(track.serverId, track.filePath, track.id);
}

/**
 * Convert Track to MediaSource with proper metadata structure
 * This is the canonical way to convert library tracks to playable sources
 */
export function trackToMediaSource(track: any): any {
  return {
    id: track.id,
    url: buildStreamingUrl(track.serverId!, track.filePath!, track.id),
    metadata: {
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration,
      coverArt: track.coverArt,
      year: track.year,
      trackNumber: track.trackNumber,
      genre: track.genre,
      albumArtist: track.albumArtist,
      bitrate: track.format?.bitrate,
      sampleRate: track.format?.sampleRate,
      bitsPerSample: track.format?.bitsPerSample,
      lyrics: track.lyrics,
    },
  };
}

