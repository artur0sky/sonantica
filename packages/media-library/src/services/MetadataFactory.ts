import { generateStableId, isSupportedFormat } from '@sonantica/shared';
import type { Track } from '../types';

export class MetadataFactory {
  constructor() {}

  /**
   * Create a track object with enhanced metadata extraction
   */
  /**
   * Create a track object with enhanced metadata extraction
   */
  async createTrack(
    basePath: string,
    filename: string,
    size: number,
    mtime?: string,
    options: { maxFileSize?: number; coverArtSizeLimit?: number } = {}
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
    let duration: number | undefined;

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
        // @ts-ignore - MetadataExtractor update might not be picked up by TS yet
        const extractedMetadata = await metadataModule.extractMetadata(path, {
          maxFileSize: options.maxFileSize,
          coverArtSizeLimit: options.coverArtSizeLimit
        });
        
        // Use extracted metadata if available, fallback to path-based
        if (extractedMetadata.title) title = extractedMetadata.title;
        if (extractedMetadata.artist) artist = extractedMetadata.artist;
        if (extractedMetadata.album) album = extractedMetadata.album;
        if (extractedMetadata.year) year = extractedMetadata.year;
        if (extractedMetadata.trackNumber) trackNumber = extractedMetadata.trackNumber;
        if (extractedMetadata.coverArt) coverArt = extractedMetadata.coverArt;
        if (extractedMetadata.genre) genre = extractedMetadata.genre;
        if (extractedMetadata.albumArtist)
          albumArtist = extractedMetadata.albumArtist;
        if (extractedMetadata.duration) duration = extractedMetadata.duration;
        
        // Log removed for brevity in factory
      }
    } catch (error) {
      console.warn(`⚠️ Could not extract metadata from ${filename}, using path-based metadata:`, error);
    }

    // Helper to normalize artist string
    const artistStr = Array.isArray(artist) ? artist.join(', ') : artist;
    
    // Stable ID should be based on relative path within the library architecture, 
    // stripping origin to remain stable if IP/Host changes.
    let stableIdPath = path;
    try {
      const url = new URL(path, window.location.origin);
      stableIdPath = url.pathname; // This includes /api/stream/server-id/...
    } catch (e) {
      // Fallback to original path if not a valid URL
    }

    return {
      id: generateStableId(stableIdPath),
      filePath: path,
      title,
      artist: artistStr,
      album,
      duration: duration || 0,
      
      // Extended properties for media-library
      path,
      filename,
      mimeType: this.getMimeType(ext),
      size,
      lastModified: mtime ? new Date(mtime) : new Date(),
      addedAt: new Date(),
      
      // Metadata (Legacy/Extended)
      metadata: {
        title,
        artist,
        album,
        year,
        trackNumber,
        coverArt,
        genre,
        albumArtist,
        duration,
      },
      
      // Optional SharedTrack properties
      year,
      genre: Array.isArray(genre) ? genre.join(', ') : genre,
      trackNumber,
      coverArt,
      albumArtist,
    };
  }

  /**
   * Hydrate track metadata (lazy extraction)
   */
  async hydrateTrack(
    track: Track,
    options: { maxFileSize?: number; coverArtSizeLimit?: number } = {}
  ): Promise<Track> {
    // Only hydrate if missing critical info like coverArt
    if (track.metadata?.coverArt || track.coverArt) return track;

    try {
      const metadataModule = await import('@sonantica/metadata').catch(() => null);
      
      if (metadataModule) {
        // @ts-ignore - MetadataExtractor update might not be picked up by TS yet
        const extracted = await metadataModule.extractMetadata(track.path, {
           maxFileSize: options.maxFileSize,
           coverArtSizeLimit: options.coverArtSizeLimit
        });
        
        // Merge extracted metadata
        const newMetadata = {
          ...track.metadata,
          ...extracted,
        };
        
        // Update root properties if extracted
        if (extracted.title) track.title = extracted.title;
        if (extracted.artist) track.artist = Array.isArray(extracted.artist) ? extracted.artist.join(', ') : extracted.artist;
        if (extracted.album) track.album = extracted.album;
        if (extracted.duration) track.duration = extracted.duration;
        if (extracted.coverArt) track.coverArt = extracted.coverArt;
        
        track.metadata = newMetadata;
        
        return track;
      }
    } catch (error) {
      // Ignore
    }
    
    return track;
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
  getMimeType(ext: string): string {
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
}
