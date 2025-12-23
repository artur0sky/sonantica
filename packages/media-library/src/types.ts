/**
 * Media Library Types
 * 
 * Domain types for media library management.
 */

import type { MediaMetadata } from '@sonantica/shared';

/**
 * Represents a track in the library
 */
export interface Track {
  id: string;
  path: string;
  filename: string;
  mimeType: string;
  size: number;
  metadata: MediaMetadata;
  addedAt: Date;
  lastModified: Date;
}

/**
 * Represents an album
 */
export interface Album {
  id: string;
  name: string;
  artist: string;
  year?: number;
  coverArt?: string;
  tracks: Track[];
}

/**
 * Represents an artist
 */
export interface Artist {
  id: string;
  name: string;
  albums: Album[];
  trackCount: number;
}

/**
 * Represents a genre
 */
export interface Genre {
  id: string;
  name: string;
  trackCount: number;
}

/**
 * Library statistics
 */
export interface LibraryStats {
  totalTracks: number;
  totalArtists: number;
  totalAlbums: number;
  totalGenres: number;
  totalSize: number;
  lastScan?: Date;
}

/**
 * Scan progress information
 */
export interface ScanProgress {
  status: 'idle' | 'scanning' | 'complete' | 'error';
  filesScanned: number;
  filesFound: number;
  currentFile?: string;
  error?: string;
}

/**
 * Library filter options
 */
export interface LibraryFilter {
  artist?: string;
  album?: string;
  genre?: string;
  year?: number;
  search?: string;
}
