/**
 * Offline status for media items
 */
export enum OfflineStatus {
  NONE = 'none',
  QUEUED = 'queued',
  DOWNLOADING = 'downloading',
  COMPLETED = 'completed',
  ERROR = 'error',
}

/**
 * Download quality options
 */
export enum DownloadQuality {
  ORIGINAL = 'original',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low',
}

/**
 * Library Domain Types
 * 
 * Core types for music library management.
 * "Every file has an intention."
 */

/**
 * Audio format information
 */
export interface AudioFormat {
  /** Codec name (e.g., 'flac', 'mp3', 'aac') */
  codec?: string;
  /** Bitrate in kbps */
  bitrate?: number;
  /** Sample rate in Hz */
  sampleRate?: number;
  /** Bit depth (e.g., 16, 24) */
  bitsPerSample?: number;
  /** Number of channels */
  channels?: number;
  /** Lossless format */
  lossless?: boolean;
}

/**
 * Represents a music track in the library
 */
export interface Track {
  /** Unique identifier */
  id: string;
  
  /** Server ID (for multi-server support) */
  serverId?: string;
  
  /** Server name (for display) */
  serverName?: string;
  
  /** Track title */
  title: string;
  
  /** Artist name(s) */
  artist: string;
  
  /** Album name */
  album: string;

  /** Album ID */
  albumId?: string;
  
  /** Duration in seconds */
  duration: number;
  
  /** Relative file path from media root */
  filePath: string;
  
  /** Audio format information */
  format?: AudioFormat;
  
  /** Release year */
  year?: number;
  
  /** Genre(s) */
  genre?: string;
  
  /** Track number in album */
  trackNumber?: number;
  
  /** Disc number (for multi-disc albums) */
  discNumber?: number;
  
  /** Album artist (for compilations) */
  albumArtist?: string;
  
  /** When this track was added to library */
  addedAt: Date;
  
  /** Last time this track was played */
  lastPlayed?: Date;
  
  /** Play count */
  playCount?: number;
  
  /** User rating (1-5 stars) */
  rating?: number;
  
  /** Cover art URL or data URI */
  coverArt?: string;

  /** Offline availability status */
  offlineStatus?: OfflineStatus;

  /** Quality used for offline storage */
  offlineQuality?: DownloadQuality;

  /** When the track was downloaded for offline use */
  downloadedAt?: Date;

  /** File Modification Timestamp (for incremental scanning) */
  fileModifiedAt?: number;
}

/**
 * Represents an artist in the library
 */
export interface Artist {
  /** Unique identifier */
  id: string;
  
  /** Artist name */
  name: string;
  
  /** Number of tracks by this artist */
  trackCount: number;
  
  /** Number of albums by this artist */
  albumCount: number;
  
  /** Artist biography (optional) */
  bio?: string;
  
  /** Artist image URL */
  imageUrl?: string;
  
  /** Genres associated with this artist */
  genres?: string[];

  /** Whether the artist is marked for offline availability (all tracks) */
  offlineStatus?: OfflineStatus;
}

/**
 * Represents an album in the library
 */
export interface Album {
  /** Unique identifier */
  id: string;
  
  /** Album title */
  title: string;
  
  /** Album artist */
  artist: string;
  
  /** Release year */
  year?: number;
  
  /** Number of tracks in album */
  trackCount: number;
  
  /** Total duration in seconds */
  totalDuration?: number;
  
  /** Album cover art URL or data URI */
  coverArt?: string;
  
  /** Genre(s) */
  genres?: string[];
  
  /** Record label */
  label?: string;

  /** Whether the album is marked for offline availability (all tracks) */
  offlineStatus?: OfflineStatus;
}

/**
 * Library statistics
 */
export interface LibraryStats {
  /** Total number of tracks */
  trackCount: number;
  
  /** Total number of artists */
  artistCount: number;
  
  /** Total number of albums */
  albumCount: number;
  
  /** Total library duration in seconds */
  totalDuration: number;
  
  /** Total library size in bytes */
  totalSize?: number;
  
  /** Last scan timestamp */
  lastScan?: Date;
}

/**
 * Scan progress information
 */
export interface ScanProgress {
  /** Current phase */
  phase: 'scanning' | 'indexing' | 'complete' | 'error';
  
  /** Current file being processed */
  currentFile?: string;
  
  /** Number of files processed */
  processed: number;
  
  /** Total number of files to process */
  total: number;
  
  /** Percentage complete (0-100) */
  percentage: number;
  
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
}
