/**
 * Library Configuration Types
 * 
 * "User autonomy" - The user decides which folders to scan.
 */

/**
 * Represents a configured music folder
 */
export interface MusicFolder {
  /** Unique identifier for the folder */
  id: string;
  
  /** Absolute path to the folder */
  path: string;
  
  /** Display name (defaults to folder name) */
  name?: string;
  
  /** Whether to scan subfolders recursively */
  recursive: boolean;
  
  /** Whether this folder is currently enabled for scanning */
  enabled: boolean;
  
  /** When this folder was added */
  addedAt: Date;
  
  /** Last time this folder was scanned */
  lastScanned?: Date;
  
  /** Number of tracks found in this folder */
  trackCount?: number;
}

/**
 * Library configuration
 */
export interface LibraryConfig {
  /** List of configured music folders */
  folders: MusicFolder[];
  
  /** Auto-scan on startup */
  autoScanOnStartup: boolean;
  
  /** Watch folders for changes (future feature) */
  watchForChanges: boolean;
  
  /** Last configuration update */
  lastUpdated: Date;
}

/**
 * Folder validation result
 */
export interface FolderValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}
