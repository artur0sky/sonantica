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
  private async scanDirectory(dirPath: string): Promise<void> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (this.isAudioFile(entry.name)) {
        await this.indexFile(fullPath);
      }
    }
  }

  /**
   * Check if file is a supported audio format
   */
  private isAudioFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return ['.mp3', '.flac', '.m4a', '.aac', '.ogg', '.opus', '.wav'].includes(ext);
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

      const track: Track = {
        id: this.generateId(relativePath),
        title: metadata.title || path.basename(filePath, path.extname(filePath)),
        artist: Array.isArray(metadata.artist) ? metadata.artist[0] : (metadata.artist || 'Unknown Artist'),
        album: metadata.album || 'Unknown Album',
        albumArtist: metadata.albumArtist,
        duration: metadata.duration || 0,
        filePath: relativePath,
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
    const artistId = this.generateId(track.artist);
    
    if (!this.artists.has(artistId)) {
      this.artists.set(artistId, {
        id: artistId,
        name: track.artist,
        trackCount: 0,
        albumCount: 0
      });
    }

    const artist = this.artists.get(artistId)!;
    artist.trackCount++;
  }

  /**
   * Index album from track
   */
  private indexAlbum(track: Track): void {
    const albumId = this.generateId(`${track.artist}-${track.album}`);
    
    if (!this.albums.has(albumId)) {
      this.albums.set(albumId, {
        id: albumId,
        title: track.album,
        artist: track.artist,
        year: track.year,
        trackCount: 0
      });
    }

    const album = this.albums.get(albumId)!;
    album.trackCount++;
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
