/**
 * MediaLibrary - Enhanced implementation with change detection
 * 
 * "Every file has an intention."
 * 
 * Improvements:
 * - Track-based change detection
 * - Optimized recursive scanning
 * - Better metadata extraction
 * - Incremental updates
 */

import { generateId, isSupportedFormat } from '@sonantica/shared';
import type { IMediaLibrary } from './contracts';
import type { Track, Album, Artist, Genre, LibraryStats, ScanProgress, LibraryFilter } from './types';

/**
 * Library event types
 */
export const LIBRARY_EVENTS = {
  SCAN_START: 'library:scan-start',
  SCAN_PROGRESS: 'library:scan-progress',
  SCAN_COMPLETE: 'library:scan-complete',
  SCAN_ERROR: 'library:scan-error',
  TRACK_ADDED: 'library:track-added',
  TRACK_REMOVED: 'library:track-removed',
  LIBRARY_UPDATED: 'library:updated',
} as const;

/**
 * MediaLibrary implementation with enhanced indexing
 */
export class MediaLibrary implements IMediaLibrary {
  private tracks: Map<string, Track> = new Map();
  private tracksByPath: Map<string, string> = new Map(); // path -> trackId mapping
  private scanProgress: ScanProgress = {
    status: 'idle',
    filesScanned: 0,
    filesFound: 0,
  };
  private listeners: Map<string, Set<Function>> = new Map();
  private lastScanPaths: Set<string> = new Set();

  constructor() {
    console.log('📚 Sonántica Media Library initialized (Enhanced)');
  }

  /**
   * Scan for media files with change detection
   */
  async scan(paths: string[]): Promise<void> {
    this.scanProgress = {
      status: 'scanning',
      filesScanned: 0,
      filesFound: 0,
    };

    this.emit(LIBRARY_EVENTS.SCAN_START, {});

    try {
      const scannedPaths = new Set<string>();

      // Scan all paths
      for (const path of paths) {
        await this.scanPathRecursive(path, scannedPaths);
      }

      // Remove tracks that no longer exist
      this.removeOrphanedTracks(scannedPaths);

      this.scanProgress.status = 'complete';
      this.emit(LIBRARY_EVENTS.SCAN_COMPLETE, {
        tracksFound: this.tracks.size,
      });

      this.emit(LIBRARY_EVENTS.LIBRARY_UPDATED, {});

      console.log(`✅ Scan complete: ${this.tracks.size} tracks found`);
    } catch (error) {
      this.scanProgress.status = 'error';
      this.scanProgress.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit(LIBRARY_EVENTS.SCAN_ERROR, { error });
      throw error;
    }
  }

  /**
   * Recursively scan a path
   */
  private async scanPathRecursive(path: string, scannedPaths: Set<string>): Promise<void> {
    try {
      const response = await fetch(path);

      if (!response.ok) {
        console.warn(`Failed to fetch ${path}: ${response.statusText}`);
        return;
      }

      const contentType = response.headers.get('content-type');

      // Check if it's JSON (nginx autoindex with autoindex_format json)
      if (contentType?.includes('application/json')) {
        const files = await response.json();
        await this.processFileListRecursive(files, path, scannedPaths);
      } else {
        // Fallback: try to parse HTML directory listing
        const html = await response.text();
        await this.parseHtmlListingRecursive(html, path, scannedPaths);
      }
    } catch (error) {
      console.error(`Error scanning ${path}:`, error);
    }
  }

  /**
   * Process file list from JSON response (recursive)
   */
  private async processFileListRecursive(
    files: any[],
    basePath: string,
    scannedPaths: Set<string>
  ): Promise<void> {
    for (const file of files) {
      if (file.type === 'file') {
        const filename = file.name;
        const fullPath = `${basePath}${filename}`;
        const ext = filename.split('.').pop()?.toLowerCase();

        // Check if it's a supported audio format
        const mimeType = this.getMimeType(ext || '');
        if (mimeType && isSupportedFormat(mimeType)) {
          scannedPaths.add(fullPath);

          // Check if track already exists
          const existingTrackId = this.tracksByPath.get(fullPath);
          if (!existingTrackId) {
            // New track - add it
            const track = await this.createTrack(basePath, filename, file.size || 0, file.mtime);
            this.addTrack(track);
          } else {
            // Track exists - update scan progress
            this.scanProgress.filesScanned++;
            this.emit(LIBRARY_EVENTS.SCAN_PROGRESS, {
              filesScanned: this.scanProgress.filesScanned,
              currentFile: filename,
            });
          }
        }
      } else if (file.type === 'directory') {
        // Recursively scan subdirectories
        await this.scanPathRecursive(`${basePath}${file.name}/`, scannedPaths);
      }
    }
  }

  /**
   * Parse HTML directory listing (fallback, recursive)
   */
  private async parseHtmlListingRecursive(
    html: string,
    basePath: string,
    scannedPaths: Set<string>
  ): Promise<void> {
    const linkRegex = /href="([^"]+)"/g;
    const matches = html.matchAll(linkRegex);

    for (const match of matches) {
      const href = match[1];

      // Skip parent directory and absolute URLs
      if (href === '../' || href.startsWith('http') || href.startsWith('/')) {
        continue;
      }

      // Check if it's a directory
      if (href.endsWith('/')) {
        await this.scanPathRecursive(`${basePath}${href}`, scannedPaths);
      } else {
        // Check if it's an audio file
        const ext = href.split('.').pop()?.toLowerCase();
        const mimeType = this.getMimeType(ext || '');

        if (mimeType && isSupportedFormat(mimeType)) {
          const fullPath = `${basePath}${href}`;
          scannedPaths.add(fullPath);

          const existingTrackId = this.tracksByPath.get(fullPath);
          if (!existingTrackId) {
            const track = await this.createTrack(basePath, href, 0);
            this.addTrack(track);
          } else {
            this.scanProgress.filesScanned++;
          }
        }
      }
    }
  }

  /**
   * Remove tracks that no longer exist
   */
  private removeOrphanedTracks(scannedPaths: Set<string>): void {
    const tracksToRemove: string[] = [];

    for (const [path, trackId] of this.tracksByPath.entries()) {
      if (!scannedPaths.has(path)) {
        tracksToRemove.push(trackId);
      }
    }

    for (const trackId of tracksToRemove) {
      const track = this.tracks.get(trackId);
      if (track) {
        this.tracks.delete(trackId);
        this.tracksByPath.delete(track.path);
        this.emit(LIBRARY_EVENTS.TRACK_REMOVED, { track });
        console.log(`🗑️ Removed orphaned track: ${track.filename}`);
      }
    }

    if (tracksToRemove.length > 0) {
      console.log(`🧹 Removed ${tracksToRemove.length} orphaned tracks`);
    }
  }

  /**
   * Create a track object with enhanced metadata extraction
   */
  private async createTrack(
    basePath: string,
    filename: string,
    size: number,
    mtime?: string
  ): Promise<Track> {
    const path = `${basePath}${filename}`;
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    // Extract metadata from path structure
    // Supports: Artist/Album/Track.ext or Artist/Year - Album/Track.ext
    const parts = path.split('/').filter(p => p && p !== 'media');

    let artist = 'Unknown Artist';
    let album = 'Unknown Album';
    let title = filename.replace(`.${ext}`, '');
    let year: number | undefined;
    let trackNumber: number | undefined;

    if (parts.length >= 3) {
      artist = parts[parts.length - 3];
      album = parts[parts.length - 2];
      title = parts[parts.length - 1].replace(`.${ext}`, '');

      // Extract year from album name (e.g., "2020 - Album Name")
      const yearMatch = album.match(/^(\d{4})\s*[-–]\s*(.+)$/);
      if (yearMatch) {
        year = parseInt(yearMatch[1]);
        album = yearMatch[2];
      }
    } else if (parts.length === 2) {
      artist = parts[0];
      title = parts[1].replace(`.${ext}`, '');
    }

    // Extract track number from title (e.g., "01 - Song" or "01. Song")
    const trackMatch = title.match(/^(\d+)\s*[-_.]?\s*(.+)$/);
    if (trackMatch) {
      trackNumber = parseInt(trackMatch[1]);
      title = trackMatch[2];
    }

    // Clean up metadata
    artist = this.cleanMetadata(artist);
    album = this.cleanMetadata(album);
    title = this.cleanMetadata(title);

    return {
      id: generateId(),
      path,
      filename,
      mimeType: this.getMimeType(ext),
      size,
      metadata: {
        title,
        artist,
        album,
        year,
        trackNumber,
      },
      addedAt: new Date(),
      lastModified: mtime ? new Date(mtime) : new Date(),
    };
  }

  /**
   * Clean metadata string
   */
  private cleanMetadata(str: string): string {
    return str
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Get MIME type from extension
   */
  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'flac': 'audio/flac',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'opus': 'audio/opus',
      'm4a': 'audio/x-m4a',
      'aac': 'audio/aac',
      'aiff': 'audio/aiff',
      'alac': 'audio/x-m4a',
      'wma': 'audio/x-ms-wma',
      'ape': 'audio/x-ape',
    };

    return mimeTypes[ext.toLowerCase()] || '';
  }

  /**
   * Add track to library
   */
  private addTrack(track: Track): void {
    this.tracks.set(track.id, track);
    this.tracksByPath.set(track.path, track.id);
    this.scanProgress.filesScanned++;
    this.scanProgress.filesFound++;
    this.scanProgress.currentFile = track.filename;

    this.emit(LIBRARY_EVENTS.SCAN_PROGRESS, {
      filesScanned: this.scanProgress.filesScanned,
      currentFile: track.filename,
    });

    this.emit(LIBRARY_EVENTS.TRACK_ADDED, { track });
  }

  /**
   * Get all tracks with optional filtering
   */
  getTracks(filter?: LibraryFilter): Track[] {
    let tracks = Array.from(this.tracks.values());

    if (filter) {
      if (filter.artist) {
        tracks = tracks.filter(t =>
          t.metadata.artist?.toLowerCase().includes(filter.artist!.toLowerCase())
        );
      }
      if (filter.album) {
        tracks = tracks.filter(t =>
          t.metadata.album?.toLowerCase().includes(filter.album!.toLowerCase())
        );
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        tracks = tracks.filter(t =>
          t.metadata.title?.toLowerCase().includes(search) ||
          t.metadata.artist?.toLowerCase().includes(search) ||
          t.metadata.album?.toLowerCase().includes(search)
        );
      }
    }

    // Sort by artist, album, track number
    return tracks.sort((a, b) => {
      const artistCompare = (a.metadata.artist || '').localeCompare(b.metadata.artist || '');
      if (artistCompare !== 0) return artistCompare;

      const albumCompare = (a.metadata.album || '').localeCompare(b.metadata.album || '');
      if (albumCompare !== 0) return albumCompare;

      return (a.metadata.trackNumber || 0) - (b.metadata.trackNumber || 0);
    });
  }

  /**
   * Get all albums
   */
  getAlbums(): Album[] {
    const albumsMap = new Map<string, Album>();

    for (const track of this.tracks.values()) {
      const albumKey = `${track.metadata.artist}-${track.metadata.album}`;

      if (!albumsMap.has(albumKey)) {
        albumsMap.set(albumKey, {
          id: generateId(),
          name: track.metadata.album || 'Unknown Album',
          artist: track.metadata.artist || 'Unknown Artist',
          year: track.metadata.year,
          tracks: [],
        });
      }

      albumsMap.get(albumKey)!.tracks.push(track);
    }

    // Sort tracks within each album by track number
    for (const album of albumsMap.values()) {
      album.tracks.sort((a, b) => (a.metadata.trackNumber || 0) - (b.metadata.trackNumber || 0));
    }

    return Array.from(albumsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Get all artists
   */
  getArtists(): Artist[] {
    const artistsMap = new Map<string, Artist>();

    for (const album of this.getAlbums()) {
      if (!artistsMap.has(album.artist)) {
        artistsMap.set(album.artist, {
          id: generateId(),
          name: album.artist,
          albums: [],
          trackCount: 0,
        });
      }

      const artist = artistsMap.get(album.artist)!;
      artist.albums.push(album);
      artist.trackCount += album.tracks.length;
    }

    return Array.from(artistsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Get all genres
   */
  getGenres(): Genre[] {
    // For now, return empty array (genre detection would require metadata parsing)
    return [];
  }

  /**
   * Get library statistics
   */
  getStats(): LibraryStats {
    return {
      totalTracks: this.tracks.size,
      totalArtists: this.getArtists().length,
      totalAlbums: this.getAlbums().length,
      totalGenres: this.getGenres().length,
      totalSize: Array.from(this.tracks.values()).reduce((sum, t) => sum + t.size, 0),
      lastScan: this.scanProgress.status === 'complete' ? new Date() : undefined,
    };
  }

  /**
   * Get scan progress
   */
  getScanProgress(): ScanProgress {
    return { ...this.scanProgress };
  }

  /**
   * Subscribe to events
   */
  on(eventType: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  /**
   * Emit an event
   */
  private emit(eventType: string, data: any): void {
    this.listeners.get(eventType)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    });
  }

  /**
   * Clear the library
   */
  clear(): void {
    this.tracks.clear();
    this.tracksByPath.clear();
    this.scanProgress = {
      status: 'idle',
      filesScanned: 0,
      filesFound: 0,
    };
    this.emit(LIBRARY_EVENTS.LIBRARY_UPDATED, {});
    console.log('🧹 Library cleared');
  }
}
