/**
 * Library Adapter Contract
 * 
 * Defines the interface that all library providers must implement.
 * This ensures SOLID principles (Dependency Inversion) and allows
 * swapping between different library sources (Remote, Local, Mock).
 * 
 * Philosophy: "One core, multiple surfaces"
 */

import type { Track, Artist, Album } from '@sonantica/shared';
import type { Playlist, PlaylistType } from '../types';

export interface LibraryStats {
    totalTracks: number;
    totalArtists: number;
    totalAlbums: number;
    totalSize?: number;
}

export interface ScanProgress {
    isScanning: boolean;
    progress?: number;
    filesScanned?: number;
    totalFiles?: number;
}

export interface ScanOptions {
    scanFileSizeLimit?: number;
    coverArtSizeLimit?: number;
    watchFolders?: boolean;
    parallelScanning?: boolean;
}

export interface ILibraryAdapter {
    /**
     * Test connection to the library source
     * @returns true if connection is successful
     */
    testConnection(): Promise<boolean>;

    /**
     * Get all tracks from the library
     */
    getTracks(options?: { limit?: number; offset?: number; sort?: string; order?: 'asc' | 'desc' }): Promise<Track[]>;

    /**
     * Get a single track by ID
     */
    getTrack(id: string): Promise<Track>;

    /**
     * Get all albums from the library
     */
    getAlbums(options?: { limit?: number; offset?: number; sort?: string; order?: 'asc' | 'desc' }): Promise<Album[]>;

    /**
     * Get tracks for a specific album
     */
    getTracksByAlbum(albumId: string): Promise<Track[]>;

    /**
     * Get all artists from the library
     */
    getArtists(options?: { limit?: number; offset?: number; sort?: string; order?: 'asc' | 'desc' }): Promise<Artist[]>;

    /**
     * Get tracks for a specific artist
     */
    getTracksByArtist(artistId: string): Promise<Track[]>;

    /**
     * Get streaming URL for a track
     * @param track The track to stream
     * @returns URL for streaming the track
     */
    getStreamUrl(track: Track): string;

    /**
     * Get library statistics
     */
    getStats(): Promise<LibraryStats>;

    /**
     * Request a library scan/refresh
     */
    startScan(options?: ScanOptions): Promise<void>;

    /**
     * Get current scan status
     */
    getScanStatus(): Promise<ScanProgress>;

    /**
     * Get alphabet index (mapping of Letter -> Offset)
     */
    getAlphabetIndex(type: 'tracks' | 'artists' | 'albums'): Promise<Record<string, number>>;

    /**
     * Subscribe to real-time scan events (optional)
     * @returns Unsubscribe function
     */
    subscribeToScanEvents?(callbacks: {
        onTrackIndexed?: (track: Track) => void;
        onScanComplete?: (stats: LibraryStats) => void;
        onScanStart?: () => void;
    }): () => void;

    // --- Playlist Methods ---

    createPlaylist(name: string, type: PlaylistType, trackIds?: string[]): Promise<Playlist>;
    getPlaylists(filter?: { type?: PlaylistType }): Promise<Playlist[]>;
    getPlaylist(id: string): Promise<Playlist>;
    updatePlaylist(id: string, updates: Partial<Omit<Playlist, 'id' | 'type' | 'createdAt'>>): Promise<Playlist>;
    deletePlaylist(id: string): Promise<void>;
    addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<Playlist>;
    removeTracksFromPlaylist(playlistId: string, trackIds: string[]): Promise<Playlist>;
    saveQueueSnapshot(trackIds: string[]): Promise<Playlist>;
}
