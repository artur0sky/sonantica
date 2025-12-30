import { OfflineStatus, DownloadQuality, Track } from '@sonantica/shared';

/**
 * Interface for offline storage adapters (Web Cache API, Native Filesystem, etc.)
 */
export interface IOfflineAdapter {
  /**
   * Check if a track is available offline
   */
  isAvailable(trackId: string): Promise<boolean>;

  /**
   * Save a track for offline use
   */
  saveTrack(trackId: string, url: string, blob: Blob, coverArt?: string): Promise<void>;

  /**
   * Remove a track from offline storage
   */
  removeTrack(trackId: string): Promise<void>;

  /**
   * Get the local URL for an offline track
   */
  getOfflineUrl(trackId: string): Promise<string | undefined>;

  /**
   * Clear all offline storage
   */
  clear(): Promise<void>;
  
  /**
   * Get storage usage in bytes
   */
  getUsage(): Promise<number>;
}

/**
 * Manager for offline downloads
 */
export interface IOfflineManager {
  /**
   * Add a track to the download queue
   */
  downloadTrack(track: Track, quality?: DownloadQuality): Promise<void>;

  /**
   * Add multiple tracks to the download queue (with deduplication)
   */
  downloadTracks(tracks: Track[], quality?: DownloadQuality): Promise<void>;

  /**
   * Remove a track from offline storage
   */
  removeTrack(trackId: string): Promise<void>;

  /**
   * Get the status of a track
   */
  getTrackStatus(trackId: string): OfflineStatus;

  /**
   * Get all tracks that are available offline
   */
  getOfflineTracks(): string[];

  /**
   * Set the download quality
   */
  setDefaultQuality(quality: DownloadQuality): void;
}
