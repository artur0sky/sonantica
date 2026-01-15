/**
 * LocalLibraryAdapter - Desktop-only adapter for handling local playlists
 * 
 * Philosophy: "One core, multiple surfaces"
 * 
 * This adapter manages playlists when no remote server is connected.
 * It uses localStorage for persistence, allowing the desktop app to
 * have a rich library experience without a Go backend.
 */

import type { Track, Artist, Album } from '@sonantica/shared';
import type { ILibraryAdapter, LibraryStats, ScanProgress, ScanOptions } from '../contracts/ILibraryAdapter';
import type { Playlist, PlaylistType } from '../types';
import { generateStableId } from '@sonantica/shared';

const PLAYLISTS_STORAGE_KEY = 'sonantica:local-playlists';

export class LocalLibraryAdapter implements ILibraryAdapter {
  constructor() {
    // Initialization if needed
  }

  private getStoredPlaylists(): Playlist[] {
    const stored = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return parsed.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        snapshotDate: p.snapshotDate ? new Date(p.snapshotDate) : undefined
      }));
    } catch (e) {
      console.error('Failed to parse local playlists', e);
      return [];
    }
  }

  private savePlaylists(playlists: Playlist[]) {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
  }

  async testConnection(): Promise<boolean> {
    return true; // Local storage is always "connected"
  }

  // Mandatory methods for the interface (Not used for local library management as it's handled by useLocalLibrary directly)
  async getTracks(): Promise<Track[]> { return []; }
  async getTrack(): Promise<Track> { throw new Error('Not implemented'); }
  async getAlbums(): Promise<Album[]> { return []; }
  async getTracksByAlbum(): Promise<Track[]> { return []; }
  async getArtists(): Promise<Artist[]> { return []; }
  async getTracksByArtist(): Promise<Track[]> { return []; }
  getStreamUrl(): string { return ''; }
  async getStats(): Promise<LibraryStats> { 
    return { totalTracks: 0, totalArtists: 0, totalAlbums: 0 }; 
  }
  async startScan(): Promise<void> {}
  async getScanStatus(): Promise<ScanProgress> { 
    return { isScanning: false }; 
  }
  async getAlphabetIndex(): Promise<Record<string, number>> { return {}; }

  // --- Playlist Methods ---

  async createPlaylist(name: string, type: PlaylistType, trackIds: string[] = []): Promise<Playlist> {
    const playlists = this.getStoredPlaylists();
    const id = generateStableId(`local-playlist-${name}-${Date.now()}`);
    
    const newPlaylist: Playlist = {
      id,
      name,
      type,
      trackIds,
      createdAt: new Date(),
      updatedAt: new Date(),
      trackCount: trackIds.length,
      snapshotDate: type === 'HISTORY_SNAPSHOT' ? new Date() : undefined
    };

    playlists.push(newPlaylist);
    this.savePlaylists(playlists);
    
    console.log(`📂 [LocalLibrary] Playlist '${name}' created locally`);
    return newPlaylist;
  }

  async getPlaylists(filter?: { type?: PlaylistType }): Promise<Playlist[]> {
    const playlists = this.getStoredPlaylists();
    if (filter?.type) {
      return playlists.filter(p => p.type === filter.type);
    }
    return playlists;
  }

  async getPlaylist(id: string): Promise<Playlist> {
    const playlists = this.getStoredPlaylists();
    const playlist = playlists.find(p => p.id === id);
    if (!playlist) throw new Error('Playlist not found');
    return playlist;
  }

  async updatePlaylist(id: string, updates: Partial<Omit<Playlist, 'id' | 'type' | 'createdAt'>>): Promise<Playlist> {
    const playlists = this.getStoredPlaylists();
    const index = playlists.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Playlist not found');

    const updated: Playlist = {
      ...playlists[index],
      ...updates,
      updatedAt: new Date(),
      trackCount: updates.trackIds ? updates.trackIds.length : playlists[index].trackCount
    };

    playlists[index] = updated;
    this.savePlaylists(playlists);
    return updated;
  }

  async deletePlaylist(id: string): Promise<void> {
    const playlists = this.getStoredPlaylists();
    const filtered = playlists.filter(p => p.id !== id);
    this.savePlaylists(filtered);
  }

  async addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<Playlist> {
    const playlist = await this.getPlaylist(playlistId);
    const updatedTrackIds = [...playlist.trackIds, ...trackIds];
    return this.updatePlaylist(playlistId, { trackIds: updatedTrackIds });
  }

  async removeTracksFromPlaylist(playlistId: string, trackIds: string[]): Promise<Playlist> {
    const playlist = await this.getPlaylist(playlistId);
    const updatedTrackIds = playlist.trackIds.filter(id => !trackIds.includes(id));
    return this.updatePlaylist(playlistId, { trackIds: updatedTrackIds });
  }

  async saveQueueSnapshot(trackIds: string[]): Promise<Playlist> {
    const dateStr = new Date().toLocaleString();
    return this.createPlaylist(`Queue ${dateStr}`, 'HISTORY_SNAPSHOT', trackIds);
  }
}
