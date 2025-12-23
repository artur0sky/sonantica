/**
 * Media Library Contracts
 *
 * Interfaces defining the public API for media library operations.
 */

import type {
  Track,
  Album,
  Artist,
  Genre,
  LibraryStats,
  ScanProgress,
  LibraryFilter,
} from "./types";

/**
 * Main interface for media library operations
 */
export interface IMediaLibrary {
  /**
   * Scan directories for media files
   */
  scan(paths: string[]): Promise<void>;

  /**
   * Get all tracks
   */
  getTracks(filter?: LibraryFilter): Track[];

  /**
   * Get all albums
   */
  getAlbums(): Album[];

  /**
   * Get all artists
   */
  getArtists(): Artist[];

  /**
   * Get all genres
   */
  getGenres(): Genre[];

  /**
   * Get library statistics
   */
  getStats(): LibraryStats;

  /**
   * Get scan progress
   */
  getScanProgress(): ScanProgress;

  /**
   * Subscribe to library events
   */
  on(eventType: string, callback: (data: any) => void): () => void;

  /**
   * Restore library from cached tracks
   */
  restore(tracks: Track[]): void;

  /**
   * Clear the library
   */
  clear(): void;
}
