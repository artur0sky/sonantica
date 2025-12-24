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

import { generateId, generateStableId, isSupportedFormat } from '@sonantica/shared';
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

  private cancelScanFlag = false;
  private currentScanPromise: Promise<void> | null = null;

  constructor() {
    console.log('📚 Sonántica Media Library initialized (Enhanced)');
  }

  cancelScan() {
    this.cancelScanFlag = true;
     this.scanProgress.status = 'idle';
      this.emit(LIBRARY_EVENTS.SCAN_COMPLETE, {
        tracksFound: this.tracks.size,
         aborted: true
      });
  }

  /**
   * Pre-populate library with existing tracks
   */
  setTracks(tracks: Track[]) {
    this.tracks.clear();
    this.tracksByPath.clear();
    for (const track of tracks) {
      this.tracks.set(track.id, track);
      this.tracksByPath.set(track.path, track.id);
    }
    console.log(`📋 Library pre-populated with ${tracks.length} tracks`);
    this.emit(LIBRARY_EVENTS.LIBRARY_UPDATED, {});
  }

  /**
   * Scan for media files with change detection
   */
   async scan(paths: string[]): Promise<void> {
    if (this.currentScanPromise) {
      console.log('⏳ MediaLibrary: Scan already in progress, queuing/returning current promise');
      return this.currentScanPromise;
    }

    this.currentScanPromise = (async () => {
      this.cancelScanFlag = false;
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
          if (this.cancelScanFlag) break;
          await this.scanPathRecursive(path, scannedPaths);
        }

        if (this.cancelScanFlag) {
          console.log('🛑 Scan cancelled by user');
          return;
        }

        // Remove tracks that no longer exist
        this.removeOrphanedTracks(scannedPaths);

        // Enrich tracks with album art if missing
        this.enrichLibrary();

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
      } finally {
        this.currentScanPromise = null;
      }
    })();

    return this.currentScanPromise;
  }

  /**
   * Enrich tracks with album art if missing
   */
  private enrichLibrary(): void {
    const albums = this.getAlbums();
    
    for (const album of albums) {
      if (album.coverArt) {
        for (const track of album.tracks) {
          if (!track.metadata.coverArt) {
            track.metadata.coverArt = album.coverArt;
          }
        }
      }
    }
    
    console.log(`✨ Library enriched with album metadata`);
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
       if (this.cancelScanFlag) return;
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
          const existingTrack = existingTrackId ? this.tracks.get(existingTrackId) : null;
          
          // Basic change detection using mtime and size
          const fileModifiedTime = file.mtime ? new Date(file.mtime).getTime() : 0;
          const trackModifiedTime = existingTrack?.lastModified ? new Date(existingTrack.lastModified).getTime() : 0;
          const sizeChanged = existingTrack && existingTrack.size !== (file.size || 0);
          
          if (!existingTrack || (fileModifiedTime > trackModifiedTime && fileModifiedTime > 0) || sizeChanged) {
            // New or modified track - add it
            const track = await this.createTrack(basePath, filename, file.size || 0, file.mtime);
            this.addTrack(track);
          } else {
            // Track exists and is unchanged - update scan progress only
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
      if (this.cancelScanFlag) return;
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

    let artist: string | string[] = 'Unknown Artist';
    let album = 'Unknown Album';
    let title = filename.replace(`.${ext}`, '');
    let year: number | undefined;
    let trackNumber: number | undefined;
    let coverArt: string | undefined;
    let genre: string | string[] | undefined;
    let albumArtist: string | undefined;

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

    // Clean up metadata from path
    if (typeof artist === 'string') {
      artist = this.cleanMetadata(artist);
    }
    album = this.cleanMetadata(album);
    title = this.cleanMetadata(title);

    // Try to extract actual metadata from the file
    try {
      // Dynamic import to avoid build issues
      const metadataModule = await import('@sonantica/metadata').catch(() => null);
      
      if (metadataModule) {
        const extractedMetadata = await metadataModule.extractMetadata(path);
        
        // Use extracted metadata if available, fallback to path-based
        if (extractedMetadata.title) title = extractedMetadata.title;
        if (extractedMetadata.artist) artist = extractedMetadata.artist;
        if (extractedMetadata.album) album = extractedMetadata.album;
        if (extractedMetadata.year) year = extractedMetadata.year;
        if (extractedMetadata.trackNumber) trackNumber = extractedMetadata.trackNumber;
        if (extractedMetadata.coverArt) coverArt = extractedMetadata.coverArt;
        if (extractedMetadata.genre) genre = extractedMetadata.genre;
        if (extractedMetadata.albumArtist) albumArtist = extractedMetadata.albumArtist;
        
        console.log(`📊 Metadata extracted for ${filename}:`, {
          title,
          artist,
          album,
          hasCoverArt: !!coverArt
        });
      }
    } catch (error) {
      console.warn(`⚠️ Could not extract metadata from ${filename}, using path-based metadata:`, error);
    }

    return {
      id: generateStableId(path),
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
        coverArt,
        genre,
        albumArtist,
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
   * Normalize artists to always return an array
   */
  private normalizeArtists(artist: string | string[] | undefined): string[] {
    if (!artist) return ['Unknown Artist'];
    if (Array.isArray(artist)) return artist;
    return [artist];
  }

  /**
   * Get primary artist from artist field
   */
  private getPrimaryArtist(artist: string | string[] | undefined): string {
    if (!artist) return 'Unknown Artist';
    if (Array.isArray(artist)) return artist[0] || 'Unknown Artist';
    return artist;
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
    // Prevent duplicates: If this path already exists with a different ID, remove the old one first
    const existingId = this.tracksByPath.get(track.path);
    if (existingId && existingId !== track.id) {
      this.tracks.delete(existingId);
    }

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
        const filterArtist = filter.artist.toLowerCase();
        tracks = tracks.filter(t => {
          const artist = t.metadata.artist;
          if (!artist) return false;
          if (Array.isArray(artist)) {
            return artist.some(a => a.toLowerCase().includes(filterArtist));
          }
          return artist.toLowerCase().includes(filterArtist);
        });
      }
      if (filter.album) {
        tracks = tracks.filter(t =>
          t.metadata.album?.toLowerCase().includes(filter.album!.toLowerCase())
        );
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        tracks = tracks.filter(t => {
          const titleMatch = t.metadata.title?.toLowerCase().includes(search);
          const albumMatch = t.metadata.album?.toLowerCase().includes(search);
          
          // Handle artist as string or array
          let artistMatch = false;
          const artist = t.metadata.artist;
          if (artist) {
            if (Array.isArray(artist)) {
              artistMatch = artist.some(a => a.toLowerCase().includes(search));
            } else {
              artistMatch = artist.toLowerCase().includes(search);
            }
          }
          
          return titleMatch || artistMatch || albumMatch;
        });
      }
    }

    // Sort by artist, album, track number
    return tracks.sort((a, b) => {
      const artistA = this.getPrimaryArtist(a.metadata.artist);
      const artistB = this.getPrimaryArtist(b.metadata.artist);
      const artistCompare = artistA.localeCompare(artistB);
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
      // Get primary artist (first artist if multiple, or albumArtist if available)
      const primaryArtist = track.metadata.albumArtist || 
                           this.getPrimaryArtist(track.metadata.artist) || 
                           'Unknown Artist';
      const albumName = track.metadata.album || 'Unknown Album';
      // Use consistent key format: "Artist - Album"
      const albumKey = `${primaryArtist} - ${albumName}`;

      const albumId = generateStableId(albumKey);

      if (!albumsMap.has(albumId)) {
        // Find cover art from any track in the album
        const coverArt = track.metadata.coverArt;
        
        albumsMap.set(albumId, {
          id: albumId,
          name: albumName,
          artist: primaryArtist,
          artistId: generateStableId(primaryArtist),
          year: track.metadata.year,
          coverArt,
          tracks: [],
        });
      }

      const album = albumsMap.get(albumId)!;
      album.tracks.push(track);
      
      // Update cover art if this track has one and album doesn't
      if (!album.coverArt && track.metadata.coverArt) {
        album.coverArt = track.metadata.coverArt;
      }
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
   * Handles multiple artists per track - each artist gets the track listed
   */
  getArtists(): Artist[] {
    const artistsMap = new Map<string, Artist>();
    const artistAlbumsMap = new Map<string, Map<string, Album>>();

    // First pass: collect all albums for each artist
    for (const track of this.tracks.values()) {
      const artists = this.normalizeArtists(track.metadata.artist);
      
      for (const artistName of artists) {
        const artistId = generateStableId(artistName);

        if (!artistsMap.has(artistId)) {
          artistsMap.set(artistId, {
            id: artistId,
            name: artistName,
            albums: [],
            trackCount: 0,
          });
          artistAlbumsMap.set(artistId, new Map());
        }

        const albumName = track.metadata.album || 'Unknown Album';
        // For sub-filtering in artists, we still want the GLOBAL album ID 
        // to be based on the Primary Artist to ensure consistency across the app.
        const albumPrimaryArtist = track.metadata.albumArtist || 
                                   this.getPrimaryArtist(track.metadata.artist) || 
                                   'Unknown Artist';
        const globalAlbumKey = `${albumPrimaryArtist} - ${albumName}`;
        const albumId = generateStableId(globalAlbumKey);
        const albumsForArtist = artistAlbumsMap.get(artistId)!;

        if (!albumsForArtist.has(albumId)) {
          albumsForArtist.set(albumId, {
            id: albumId,
            name: albumName,
            artist: artistName,
            artistId: artistId,
            year: track.metadata.year,
            coverArt: track.metadata.coverArt,
            tracks: [],
          });
        }

        const album = albumsForArtist.get(albumId)!;
        album.tracks.push(track);
        
        // Update cover art if this track has one and album doesn't
        if (!album.coverArt && track.metadata.coverArt) {
          album.coverArt = track.metadata.coverArt;
        }
      }
    }

    // Second pass: populate artists with their albums
    for (const [artistName, artist] of artistsMap.entries()) {
      const albumsForArtist = artistAlbumsMap.get(artistName)!;
      artist.albums = Array.from(albumsForArtist.values());
      
      // Sort tracks within each album
      for (const album of artist.albums) {
        album.tracks.sort((a, b) => (a.metadata.trackNumber || 0) - (b.metadata.trackNumber || 0));
      }
      
      // Sort albums by name
      artist.albums.sort((a, b) => a.name.localeCompare(b.name));
      
      // Calculate total track count
      artist.trackCount = artist.albums.reduce((sum, album) => sum + album.tracks.length, 0);
    }

    return Array.from(artistsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Get all genres
   */
  getGenres(): Genre[] {
    const genresMap = new Map<string, Genre>();

    for (const track of this.tracks.values()) {
      const genres = this.normalizeGenres(track.metadata.genre);
      
      for (const genreName of genres) {
        if (!genresMap.has(genreName)) {
          genresMap.set(genreName, {
            id: generateId(),
            name: genreName,
            trackCount: 0,
          });
        }

        const genre = genresMap.get(genreName)!;
        genre.trackCount++;
      }
    }

    return Array.from(genresMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Normalize genres to always return an array
   */
  private normalizeGenres(genre: string | string[] | undefined): string[] {
    if (!genre) return [];
    if (Array.isArray(genre)) return genre;
    return [genre];
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
   * Restore library from cached tracks
   */
  restore(tracks: Track[]): void {
    this.clear();
    
    for (const track of tracks) {
      // Re-map dates from strings if needed (JSON serialization)
      if (typeof track.addedAt === 'string') track.addedAt = new Date(track.addedAt);
      if (typeof track.lastModified === 'string') track.lastModified = new Date(track.lastModified);
      
      this.tracks.set(track.id, track);
      this.tracksByPath.set(track.path, track.id);
    }
    
    this.scanProgress = {
      status: 'complete',
      filesScanned: tracks.length,
      filesFound: tracks.length,
    };
    
    console.log(`♻️ Restored ${tracks.length} tracks from cache`);
    this.emit(LIBRARY_EVENTS.LIBRARY_UPDATED, {});
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
