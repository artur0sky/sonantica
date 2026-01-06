/**
 * Media Library Types
 * 
 * Re-exports types from @sonantica/shared for consistency.
 * Following architecture principle: packages use shared types.
 */

import {
  Track as SharedTrack,
  Artist,
  Album,
  AudioFormat,
} from '@sonantica/shared';

export type { Artist, Album, AudioFormat };

export interface Track extends SharedTrack {
  filename?: string;
  path?: string; // Legacy/Internal path
  size?: number;
  lastModified?: Date;
  mimeType?: string;
  // Keep metadata property for now to avoid massive refactor if other components rely on it,
  // but mark it as optional or try to move away from it.
  // Actually MetadataFactory constructs it.
  metadata?: {
    title?: string;
    artist?: string | string[];
    album?: string;
    year?: number;
    trackNumber?: number;
    coverArt?: string;
    genre?: string | string[];
    albumArtist?: string;
    duration?: number;
  };
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
