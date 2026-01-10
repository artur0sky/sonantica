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

import type { IMediaLibrary } from './contracts';
import type { Track, Album, Artist, Genre, LibraryStats, ScanProgress, LibraryFilter, Playlist, PlaylistType } from './types';
import { MetadataFactory } from './services/MetadataFactory';
import { QueryEngine } from './services/QueryEngine';
import { LibraryScanner, ScannerCallbacks } from './services/LibraryScanner';

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
  PLAYLIST_CREATED: 'library:playlist-created',
  PLAYLIST_UPDATED: 'library:playlist-updated',
  PLAYLIST_DELETED: 'library:playlist-deleted',
} as const;

/**
 * MediaLibrary implementation with enhanced indexing
 */
export class MediaLibrary implements IMediaLibrary {
  private tracks: Map<string, Track> = new Map();
  private playlists: Map<string, Playlist> = new Map();
  private tracksByPath: Map<string, string> = new Map(); // path -> trackId mapping
  private scanProgress: ScanProgress = {
    status: 'idle',
    filesScanned: 0,
    filesFound: 0,
  };
  private listeners: Map<string, Set<Function>> = new Map();
  
  private cancelScanFlag = false;
  private currentScanPromise: Promise<void> | null = null;

  // Services
  private metadataFactory: MetadataFactory;
  private queryEngine: QueryEngine;
  private libraryScanner: LibraryScanner;

  constructor() {
    this.metadataFactory = new MetadataFactory();
    this.queryEngine = new QueryEngine();
    this.libraryScanner = new LibraryScanner(this.metadataFactory);
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
      if (track.path) {
        this.tracksByPath.set(track.path, track.id);
      }
    }
    console.log(`📋 Library pre-populated with ${tracks.length} tracks`);
    this.emit(LIBRARY_EVENTS.LIBRARY_UPDATED, {});
  }

  /**
   * Scan for media files with change detection
   */
  async scan(
    paths: string[], 
    parallel: boolean = false, 
    options: { scanFileSizeLimit?: number; coverArtSizeLimit?: number } = {}
  ): Promise<void> {
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

        const callbacks: ScannerCallbacks = {
          shouldCancel: () => this.cancelScanFlag,
          getExistingTrack: (path: string) => {
            const id = this.tracksByPath.get(path);
            return id ? this.tracks.get(id) : undefined;
          },
          onTrackFound: (track: Track) => {
             this.addTrack(track);
          },
          onTrackUnchanged: (filename: string) => {
            this.scanProgress.filesScanned++;
            this.emit(LIBRARY_EVENTS.SCAN_PROGRESS, {
              filesScanned: this.scanProgress.filesScanned,
              currentFile: filename,
            });
          },
          onProgress: (filename: string) => {
             // Redundant if onTrackUnchanged/Found handles it, but kept for interface completeness
          }
        };

        // Pass parallel parameter and options to scanner
        await this.libraryScanner.scanPaths(paths, scannedPaths, callbacks, parallel, options);

        if (this.cancelScanFlag) {
          console.log('🛑 Scan cancelled by user');
          return;
        }

        // Remove tracks that no longer exist (scoped to scanned paths)
        this.removeOrphanedTracks(scannedPaths, paths);

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
        // Cast to any to access generated tracks array
        const tracks = (album as any).tracks as Track[];
        if (tracks) {
          for (const track of tracks) {
            if (!track.metadata) {
                track.metadata = {};
            }
            if (!track.metadata.coverArt) {
              track.metadata.coverArt = album.coverArt;
              // Also update root property
              if (!track.coverArt) {
                  track.coverArt = album.coverArt;
              }
            }
          }
        }
      }
    }
    
    console.log(`✨ Library enriched with album metadata`);
  }

  /**
   * Remove tracks that no longer exist within the scanned roots
   */
  private removeOrphanedTracks(scannedPaths: Set<string>, scannedRoots: string[]): void {
    const tracksToRemove: string[] = [];

    for (const [path, trackId] of this.tracksByPath.entries()) {
      // Only consider tracks that belong to one of the scanned roots
      const belongsToScannedRoot = scannedRoots.some(root => path.startsWith(root));
      
      if (belongsToScannedRoot && !scannedPaths.has(path)) {
        tracksToRemove.push(trackId);
      }
    }

    for (const trackId of tracksToRemove) {
      const track = this.tracks.get(trackId);
      if (track) {
        this.tracks.delete(trackId);
        if (track.path) {
          this.tracksByPath.delete(track.path);
        }
        this.emit(LIBRARY_EVENTS.TRACK_REMOVED, { track });
        console.log(`🗑️ Removed orphaned track: ${track.filename}`);
      }
    }

    if (tracksToRemove.length > 0) {
      console.log(`🧹 Removed ${tracksToRemove.length} orphaned tracks`);
    }
  }

  /**
   * Add track to library
   */
  private addTrack(track: Track): void {
    // Prevent duplicates: If this path already exists with a different ID, remove the old one first
    const existingId = track.path ? this.tracksByPath.get(track.path) : undefined;
    if (existingId && existingId !== track.id) {
      this.tracks.delete(existingId);
    }

    this.tracks.set(track.id, track);
    if (track.path) {
      this.tracksByPath.set(track.path, track.id);
    }
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
   * Get track by ID
   */
  getTrack(id: string): Track | undefined {
    return this.tracks.get(id);
  }

  /**
   * Hydrate track metadata (lazy extraction)
   */
  async hydrateTrack(trackId: string): Promise<Track | undefined> {
    const track = this.tracks.get(trackId);
    if (!track) return undefined;

    const hydrated = await this.metadataFactory.hydrateTrack(track);
    
    if (hydrated !== track) { // Only emit if changed (not perfect check but factory returns same obj if no change)
         // Actually factory modifies in place and returns it.
         this.emit(LIBRARY_EVENTS.LIBRARY_UPDATED, {});
    }
    
    return hydrated;
  }

  /**
   * Get all tracks with optional filtering
   */
  getTracks(filter?: LibraryFilter): Track[] {
    return this.queryEngine.getTracks(this.tracks, filter);
  }

  /**
   * Get all albums
   */
  getAlbums(): Album[] {
    return this.queryEngine.getAlbums(this.tracks);
  }

  /**
   * Get all artists
   */
  getArtists(): Artist[] {
    return this.queryEngine.getArtists(this.tracks);
  }

  /**
   * Get all genres
   */
  getGenres(): Genre[] {
    return this.queryEngine.getGenres(this.tracks);
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
      totalSize: Array.from(this.tracks.values()).reduce((sum, t) => sum + (t.size || 0), 0),
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
      if (track.path) {
        this.tracksByPath.set(track.path, track.id);
      }
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

  // --- Playlist Management Implementation ---

  async createPlaylist(name: string, type: PlaylistType, trackIds: string[] = []): Promise<Playlist> {
    const id = crypto.randomUUID();
    const now = new Date();
    
    // Verify tracks exist? Not strictly necessary for loose coupling, but good for data integrity.
    // We allow orphaned IDs in playlists (e.g. file removed but might come back),
    // but maybe we should filter invalid ones if desired. For now, assume raw IDs are fine.
    
    const playlist: Playlist = {
      id,
      name,
      type,
      trackIds: [...trackIds],
      createdAt: now,
      updatedAt: now,
    };

    if (type === 'HISTORY_SNAPSHOT') {
      playlist.snapshotDate = now;
    }

    this.playlists.set(id, playlist);
    this.emit(LIBRARY_EVENTS.PLAYLIST_CREATED, { playlist });
    console.log(`📝 Playlist created: ${name} (${type})`);
    
    return playlist;
  }

  getPlaylists(filter?: { type?: PlaylistType }): Playlist[] {
    const all = Array.from(this.playlists.values());
    if (!filter) return all;
    
    return all.filter(p => {
      if (filter.type && p.type !== filter.type) return false;
      return true;
    });
  }

  getPlaylist(id: string): Playlist | undefined {
    return this.playlists.get(id);
  }

  async updatePlaylist(id: string, updates: Partial<Omit<Playlist, 'id' | 'type' | 'createdAt'>>): Promise<Playlist> {
    const playlist = this.playlists.get(id);
    if (!playlist) {
      throw new Error(`Playlist ${id} not found`);
    }

    const updated = {
      ...playlist,
      ...updates,
      updatedAt: new Date(),
    };

    this.playlists.set(id, updated);
    this.emit(LIBRARY_EVENTS.PLAYLIST_UPDATED, { playlist: updated });
    return updated;
  }

  async deletePlaylist(id: string): Promise<void> {
    if (this.playlists.has(id)) {
      const playlist = this.playlists.get(id);
      this.playlists.delete(id);
      this.emit(LIBRARY_EVENTS.PLAYLIST_DELETED, { id, playlist }); // Send playlist object for undo potential
    }
  }

  async addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<Playlist> {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) throw new Error(`Playlist ${playlistId} not found`);

    const newTrackIds = [...playlist.trackIds, ...trackIds];
    return this.updatePlaylist(playlistId, { trackIds: newTrackIds });
  }

  async removeTracksFromPlaylist(playlistId: string, trackIdsToRemove: string[]): Promise<Playlist> {
     const playlist = this.playlists.get(playlistId);
    if (!playlist) throw new Error(`Playlist ${playlistId} not found`);

    // Remove ALL instances of the trackIds? Or just specific indices?
    // Usually "remove from playlist" implies removing occurrences.
    const toRemoveSet = new Set(trackIdsToRemove);
    const newTrackIds = playlist.trackIds.filter(tid => !toRemoveSet.has(tid));
    
    return this.updatePlaylist(playlistId, { trackIds: newTrackIds });
  }

  async reorderPlaylist(playlistId: string, newTrackIds: string[]): Promise<Playlist> {
     const playlist = this.playlists.get(playlistId);
    if (!playlist) throw new Error(`Playlist ${playlistId} not found`);
    
    // We trust the caller to provide valid reordered IDs that match existing content usually,
    // or we just replace the content.
    return this.updatePlaylist(playlistId, { trackIds: newTrackIds });
  }

  async saveQueueSnapshot(trackIds: string[]): Promise<Playlist> {
    const dateStr = new Date().toLocaleString();
    return this.createPlaylist(`Queue ${dateStr}`, 'HISTORY_SNAPSHOT', trackIds);
  }
}
