/**
 * Streaming URL Utilities
 * 
 * Helper functions to construct streaming URLs from track data and server configuration.
 */

import { getServersConfig } from '../services/LibraryService';
import { useOfflineStore } from '@sonantica/offline-manager';
import { OfflineStatus } from '@sonantica/shared';
import { useLibraryStore } from '@sonantica/media-library';

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
    
    // Use trackId for secure ID-based streaming
    if (trackId) {
      const streamUrl = `${baseUrl}/stream/${trackId}`;
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
  // Try to get enriched cover art from library store if missing
  let coverArt = track.coverArt || track.metadata?.coverArt;
  
  if (!coverArt) {
    try {
      // Direct access to store to avoid hook issues in utils
      const libraryTracks = useLibraryStore.getState().tracks;
      const foundTrack = libraryTracks.find((t: any) => t.id === track.id);
      if (foundTrack) {
        coverArt = foundTrack.coverArt;
      }
    } catch (e) {
      // Ignore if store not available
    }
  }

  return {
    id: track.id,
    url: buildStreamingUrl(track.serverId!, track.filePath!, track.id),
    metadata: {
      title: track.title || track.metadata?.title,
      artist: track.artist || track.metadata?.artist,
      album: track.album || track.metadata?.album,
      duration: track.duration || track.metadata?.duration,
      coverArt: coverArt,
      year: track.year || track.metadata?.year,
      trackNumber: track.trackNumber || track.metadata?.trackNumber,
      genre: track.genre || track.metadata?.genre,
      albumArtist: track.albumArtist || track.metadata?.albumArtist,
      bitrate: track.format?.bitrate || track.metadata?.bitrate,
      sampleRate: track.format?.sampleRate || track.metadata?.sampleRate,
      bitsPerSample: track.format?.bitsPerSample || track.metadata?.bitsPerSample,
      lyrics: track.lyrics || track.metadata?.lyrics,
    },
  };
}

