/**
 * Media Library Types
 * 
 * Re-exports types from @sonantica/shared for consistency.
 * Following architecture principle: packages use shared types.
 */

// Re-export all library types from shared
export type {
  Track,
  Artist,
  Album,
  AudioFormat,
} from '@sonantica/shared';

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
