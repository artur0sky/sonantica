/**
 * LibraryService - Server-side library management
 * 
 * Handles:
 * - File system scanning
 * - Metadata extraction
 * - In-memory indexing
 * - Real-time updates
 */

import { promises as fs } from 'fs';
import path from 'path';
import { extractMetadataFromFile } from '@sonantica/metadata/node';
import { EventEmitter } from 'events';
import type { Track, Artist, Album, AudioFormat } from '@sonantica/shared';

export class LibraryService extends EventEmitter {
  private tracks: Map<string, Track> = new Map();
  private artists: Map<string, Artist> = new Map();
  private albums: Map<string, Album> = new Map();
  private mediaPath: string;
  private scanning = false;

  constructor(mediaPath: string) {
    super();
    this.mediaPath = mediaPath;
  }

  /**
   * Scan the media directory for audio files
   */
  async scan(): Promise<void> {
    if (this.scanning) {
      throw new Error('Scan already in progress');
    }

    this.scanning = true;
    this.emit('scan:start');

    try {
      console.log(`📂 Scanning: ${this.mediaPath}`);
      await this.scanDirectory(this.mediaPath);
      console.log(`✅ Scan complete: ${this.tracks.size} tracks found`);
      this.emit('scan:complete', {
        trackCount: this.tracks.size,
        artistCount: this.artists.size,
        albumCount: this.albums.size
      });
    } catch (error) {
      console.error('❌ Scan failed:', error);
      this.emit('scan:error', error);
      throw error;
    } finally {
      this.scanning = false;
    }
  }

  /**
   * Recursively scan a directory
   */
  /**
   * Recursively scan a directory with parallel processing
   */
  private async scanDirectory(dirPath: string, visited: Set<string> = new Set()): Promise<void> {
    try {
      // Resolve real path to prevent infinite loops with circular symlinks
      const realPath = await fs.realpath(dirPath);
      if (visited.has(realPath)) {
        // console.log(`  Skipping visited path: ${dirPath} -> ${realPath}`);
        return;
      }
      visited.add(realPath);

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      const files: string[] = [];
      const directories: string[] = [];

      // Categorize entries first
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        try {
          if (entry.isDirectory() || entry.isSymbolicLink()) {
             // We'll check isDirectory/Symlink logic deeply inside the loop for safety, 
             // but here we just group them.
             // For symlinks we need to stat them to know if they are dirs, 
             // but to stay fast we can just assume potential dir and let the processor handle it.
             directories.push(fullPath);
          } else if (this.isAudioFile(entry.name)) {
            files.push(fullPath);
          }
        } catch (e) {
          // ignore stat errors here
        }
      }

      // 1. Process Files in parallel (Higher concurrency)
      // Batch size 20 for file processing
      await this.processInBatches(files, 20, async (filePath) => {
        await this.indexFile(filePath);
      });

      // 2. Process Subdirectories in parallel (Lower concurrency to save file handles)
      // Batch size 5 for directory recursion
      await this.processInBatches(directories, 5, async (subdirPath) => {
        try {
           const stats = await fs.stat(subdirPath);
           if (!stats.isDirectory()) return;
           
           const name = path.basename(subdirPath);
           // Security/System checks
           if (['.git', 'node_modules', '$RECYCLE.BIN', 'System Volume Information'].includes(name)) return;
           
           await this.scanDirectory(subdirPath, visited);
        } catch (error) {
           console.warn(`⚠️ Failed to access subdir: ${subdirPath}`, error);
        }
      });

    } catch (error) {
      console.error(`❌ Failed to scan directory: ${dirPath}`, error);
    }
  }

  /**
   * Helper to process an array in batches (concurrency limit)
   */
  private async processInBatches<T>(items: T[], batchSize: number, task: (item: T) => Promise<void>): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await Promise.all(batch.map(item => task(item)));
    }
  }

  /**
   * Check if file is a supported audio format
   */
  private isAudioFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return [
      '.mp3', '.flac', '.m4a', '.m4b', '.aac', '.ogg', '.opus', '.wav', 
      '.aiff', '.aif', '.dsf', '.dff', '.ape', '.alac', '.wma'
    ].includes(ext);
  }

  /**
   * Extract metadata and index a file
   */
  private async indexFile(filePath: string): Promise<void> {
    try {
      // Extract metadata using Node.js file system
      const metadata = await extractMetadataFromFile(filePath);
      const relativePath = path.relative(this.mediaPath, filePath);

      // Extract format information
      const format: AudioFormat | undefined = metadata.bitrate || metadata.sampleRate ? {
        codec: path.extname(filePath).slice(1).toLowerCase(),
        bitrate: metadata.bitrate,
        sampleRate: metadata.sampleRate,
        bitsPerSample: metadata.bitsPerSample,
        lossless: ['.flac', '.alac', '.wav', '.aiff'].includes(path.extname(filePath).toLowerCase())
      } : undefined;

      // Normalize path to POSIX style (forward slashes) for stable IDs across platforms
      const normalizedPath = relativePath.split(path.sep).join('/');
      
      const track: Track = {
        id: this.generateId(normalizedPath),
        title: metadata.title || path.basename(filePath, path.extname(filePath)),
        artist: Array.isArray(metadata.artist) ? metadata.artist[0] : (metadata.artist || 'Unknown Artist'),
        album: metadata.album || 'Unknown Album',
        albumArtist: metadata.albumArtist,
        duration: metadata.duration || 0,
        filePath: normalizedPath,
        format,
        year: metadata.year,
        genre: Array.isArray(metadata.genre) ? metadata.genre[0] : metadata.genre,
        trackNumber: metadata.trackNumber,
        coverArt: metadata.coverArt,
        addedAt: new Date()
      };

      this.tracks.set(track.id, track);
      this.indexArtist(track);
      this.indexAlbum(track);

      this.emit('track:indexed', track);
    } catch (error) {
      console.warn(`⚠️ Failed to index: ${filePath}`, error);
    }
  }

  /**
   * Index artist from track
   */
  private indexArtist(track: Track): void {
    const artistName = track.artist || 'Unknown Artist';
    const artistId = this.generateId(artistName);
    
    if (!this.artists.has(artistId)) {
      this.artists.set(artistId, {
        id: artistId,
        name: artistName,
        trackCount: 0,
        albumCount: 0,
        imageUrl: track.coverArt, // Use first found cover art as representative
      });
    }

    const artist = this.artists.get(artistId)!;
    artist.trackCount++;
    
    // Update image if missing
    if (!artist.imageUrl && track.coverArt) {
      artist.imageUrl = track.coverArt;
    }
  }

  /**
   * Index album from track
   */
  private indexAlbum(track: Track): void {
    const primaryArtist = track.albumArtist || track.artist || 'Unknown Artist';
    const albumId = this.generateId(`${primaryArtist}-${track.album}`);
    
    if (!this.albums.has(albumId)) {
      this.albums.set(albumId, {
        id: albumId,
        title: track.album,
        artist: primaryArtist,
        year: track.year,
        trackCount: 0,
        coverArt: track.coverArt,
      });
    }

    const album = this.albums.get(albumId)!;
    album.trackCount++;
    
    // Update cover art if missing
    if (!album.coverArt && track.coverArt) {
      album.coverArt = track.coverArt;
    }
    
    // Update artist's album count if it's a new album for this artist
    const artistId = this.generateId(primaryArtist);
    const artist = this.artists.get(artistId);
    if (artist) {
        // This is a bit inefficient but correct for a simple indexer
        const albumsForArtist = this.getAlbums().filter(a => a.artist === primaryArtist);
        artist.albumCount = albumsForArtist.length;
    }
  }

  /**
   * Generate deterministic ID from string
   */
  private generateId(str: string): string {
    return Buffer.from(str).toString('base64url').slice(0, 16);
  }

  // Public getters
  getTracks(): Track[] {
    return Array.from(this.tracks.values());
  }

  getTrack(id: string): Track | undefined {
    return this.tracks.get(id);
  }

  getArtists(): Artist[] {
    return Array.from(this.artists.values());
  }

  getAlbums(): Album[] {
    return Array.from(this.albums.values());
  }

  getTracksByArtist(artistId: string): Track[] {
    const artist = this.artists.get(artistId);
    if (!artist) return [];
    return this.getTracks().filter(t => this.generateId(t.artist) === artistId);
  }

  getTracksByAlbum(albumId: string): Track[] {
    const album = this.albums.get(albumId);
    if (!album) return [];
    return this.getTracks().filter(t => 
      this.generateId(`${t.artist}-${t.album}`) === albumId
    );
  }

  getStats() {
    return {
      tracks: this.tracks.size,
      artists: this.artists.size,
      albums: this.albums.size
    };
  }

  getScanningStatus(): boolean {
    return this.scanning;
  }
}
