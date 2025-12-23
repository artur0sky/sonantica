/**
 * MediaLibrary - Core library management implementation
 * 
 * "Every file has an intention."
 * 
 * This is a browser-based implementation that works with the File System Access API
 * or accepts pre-scanned file lists from the server.
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
  LIBRARY_UPDATED: 'library:updated',
} as const;

/**
 * MediaLibrary implementation
 * 
 * For the Hello World version, this works with a mock file list
 * or files from the /media endpoint exposed by nginx.
 */
export class MediaLibrary implements IMediaLibrary {
  private tracks: Map<string, Track> = new Map();
  private scanProgress: ScanProgress = {
    status: 'idle',
    filesScanned: 0,
    filesFound: 0,
  };
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    console.log('📚 Sonántica Media Library initialized');
  }

  /**
   * Scan for media files
   * 
   * In browser context, this fetches the file list from /media endpoint
   */
  async scan(paths: string[]): Promise<void> {
    this.scanProgress = {
      status: 'scanning',
      filesScanned: 0,
      filesFound: 0,
    };

    this.emit(LIBRARY_EVENTS.SCAN_START, {});

    try {
      // Fetch file list from nginx autoindex
      for (const path of paths) {
        await this.scanPath(path);
      }

      this.scanProgress.status = 'complete';
      this.emit(LIBRARY_EVENTS.SCAN_COMPLETE, {
        tracksFound: this.tracks.size,
      });

      console.log(`✅ Scan complete: ${this.tracks.size} tracks found`);
    } catch (error) {
      this.scanProgress.status = 'error';
      this.scanProgress.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit(LIBRARY_EVENTS.SCAN_ERROR, { error });
      throw error;
    }
  }

  /**
   * Scan a specific path
   */
  private async scanPath(path: string): Promise<void> {
    try {
      // Fetch directory listing from nginx autoindex (JSON format)
      const response = await fetch(path);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      
      // Check if it's JSON (nginx autoindex with autoindex_format json)
      if (contentType?.includes('application/json')) {
        const files = await response.json();
        await this.processFileList(files, path);
      } else {
        // Fallback: try to parse HTML directory listing
        const html = await response.text();
        await this.parseHtmlListing(html, path);
      }
    } catch (error) {
      console.error(`Error scanning ${path}:`, error);
    }
  }

  /**
   * Process file list from JSON response
   */
  private async processFileList(files: any[], basePath: string): Promise<void> {
    for (const file of files) {
      if (file.type === 'file') {
        const filename = file.name;
        const ext = filename.split('.').pop()?.toLowerCase();
        
        // Check if it's a supported audio format
        const mimeType = this.getMimeType(ext || '');
        if (mimeType && isSupportedFormat(mimeType)) {
          const track = await this.createTrack(basePath, filename, file.size || 0);
          this.addTrack(track);
        }
      } else if (file.type === 'directory') {
        // Recursively scan subdirectories
        await this.scanPath(`${basePath}/${file.name}/`);
      }
    }
  }

  /**
   * Parse HTML directory listing (fallback)
   */
  private async parseHtmlListing(html: string, basePath: string): Promise<void> {
    // Simple HTML parsing for nginx directory listing
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
        await this.scanPath(`${basePath}${href}`);
      } else {
        // Check if it's an audio file
        const ext = href.split('.').pop()?.toLowerCase();
        const mimeType = this.getMimeType(ext || '');
        
        if (mimeType && isSupportedFormat(mimeType)) {
          const track = await this.createTrack(basePath, href, 0);
          this.addTrack(track);
        }
      }
    }
  }

  /**
   * Create a track object
   */
  private async createTrack(basePath: string, filename: string, size: number): Promise<Track> {
    const path = `${basePath}${filename}`;
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    // Extract metadata from filename/path
    // Format: Artist/Album/Track.ext or Artist - Album - Track.ext
    const parts = path.split('/').filter(p => p && p !== 'media');
    
    let artist = 'Unknown Artist';
    let album = 'Unknown Album';
    let title = filename.replace(`.${ext}`, '');

    if (parts.length >= 3) {
      artist = parts[parts.length - 3];
      album = parts[parts.length - 2];
      title = parts[parts.length - 1].replace(`.${ext}`, '');
    } else if (parts.length === 2) {
      artist = parts[0];
      title = parts[1].replace(`.${ext}`, '');
    }

    // Clean up track number from title (e.g., "01 - Song" -> "Song")
    title = title.replace(/^\d+\s*[-_.]\s*/, '');

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
      },
      addedAt: new Date(),
      lastModified: new Date(),
    };
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
    };

    return mimeTypes[ext.toLowerCase()] || '';
  }

  /**
   * Add track to library
   */
  private addTrack(track: Track): void {
    this.tracks.set(track.id, track);
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

    return tracks;
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
          tracks: [],
        });
      }

      albumsMap.get(albumKey)!.tracks.push(track);
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
    this.scanProgress = {
      status: 'idle',
      filesScanned: 0,
      filesFound: 0,
    };
    this.emit(LIBRARY_EVENTS.LIBRARY_UPDATED, {});
    console.log('🧹 Library cleared');
  }
}
