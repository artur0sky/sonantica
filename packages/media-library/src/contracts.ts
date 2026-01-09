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
  Playlist,
  PlaylistType,
} from "./types";

/**
 * Main interface for media library operations
 */
export interface IMediaLibrary {
  /**
   * Scan directories for media files
   */
  scan(paths: string[], parallel?: boolean, options?: { scanFileSizeLimit?: number; coverArtSizeLimit?: number }): Promise<void>;

  /**
   * Cancel an ongoing scan
   */
  cancelScan(): void;

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
  /**
   * Clear the library
   */
  clear(): void;

  // --- Playlist Management ---

  /**
   * Create a new playlist
   */
  createPlaylist(name: string, type: PlaylistType, trackIds?: string[]): Promise<Playlist>;

  /**
   * Get playlists (optional filtering)
   */
  getPlaylists(filter?: { type?: PlaylistType }): Playlist[];

  /**
   * Get specific playlist
   */
  getPlaylist(id: string): Playlist | undefined;

  /**
   * Update playlist metadata
   */
  updatePlaylist(id: string, updates: Partial<Omit<Playlist, 'id' | 'type' | 'createdAt'>>): Promise<Playlist>;

  /**
   * Delete playlist
   */
  deletePlaylist(id: string): Promise<void>;

  /**
   * Add tracks to playlist
   */
  addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<Playlist>;

  /**
   * Remove tracks from playlist
   */
  removeTracksFromPlaylist(playlistId: string, trackIds: string[]): Promise<Playlist>;

  /**
   * Reorder tracks in playlist
   */
  reorderPlaylist(playlistId: string, newTrackIds: string[]): Promise<Playlist>;

  /**
   * Save current queue as a history snapshot
   */
  saveQueueSnapshot(trackIds: string[]): Promise<Playlist>;
}
