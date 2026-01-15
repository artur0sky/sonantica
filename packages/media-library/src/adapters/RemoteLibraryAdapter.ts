/**
 * RemoteLibraryAdapter - Client adapter for remote API server
 * 
 * Philosophy: "One core, multiple surfaces"
 * 
 * This adapter allows web/mobile clients to consume the centralized
 * API server instead of accessing local file systems.
 */

import type { Track, Artist, Album } from '@sonantica/shared';
import type { ILibraryAdapter, LibraryStats, ScanProgress, ScanOptions } from '../contracts/ILibraryAdapter';
import type { Playlist, PlaylistType } from '../types';

export interface RemoteLibraryConfig {
  serverUrl: string;
  apiKey?: string;
  serverName?: string;
}

export class RemoteLibraryAdapter implements ILibraryAdapter {
  private serverUrl: string;
  private apiKey?: string;
  private serverName?: string;
  private eventSource?: EventSource;

  constructor(config: RemoteLibraryConfig) {
    this.serverUrl = config.serverUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.serverName = config.serverName;
  }

  /**
   * Normalize Album: prepend server URL to coverArt if path is relative
   */
  private normalizeAlbum(album: any): Album {
    let coverArt = album.coverArt;
    if (coverArt) {
      if (!coverArt.startsWith('http') && coverArt.startsWith('/')) {
        coverArt = `${this.serverUrl}${coverArt}`;
      } else if (!coverArt.startsWith('http')) {
        coverArt = `${this.serverUrl}/api/cover/${album.id}`;
      }
    } else {
      coverArt = `${this.serverUrl}/api/cover/${album.id}`;
    }

    const serverPrefix = btoa(this.serverUrl).substring(0, 8).replace(/[/+=]/g, '');

    return {
      ...album,
      id: `remote-${serverPrefix}-${album.id}`,
      coverArt,
      source: 'remote',
      serverName: this.serverName
    };
  }

  /**
   * Normalize Artist: namespace ID
   */
  private normalizeArtist(artist: any): Artist {
    const serverPrefix = btoa(this.serverUrl).substring(0, 8).replace(/[/+=]/g, '');
    return {
      ...artist,
      id: `remote-${serverPrefix}-${artist.id}`,
      source: 'remote',
      serverName: this.serverName
    };
  }

  /**
   * Normalize Track: prepend server URL to coverArt if path is relative
   * AND add serverId for streaming
   */
  private normalizeTrack(track: any): Track {
    let coverArt = track.coverArt;
    if (coverArt) {
      if (!coverArt.startsWith('http') && coverArt.startsWith('/')) {
        coverArt = `${this.serverUrl}${coverArt}`;
      } else if (!coverArt.startsWith('http')) {
        coverArt = `${this.serverUrl}/api/cover/${track.albumId || track.id}`;
      }
    } else if (track.albumId) {
      coverArt = `${this.serverUrl}/api/cover/${track.albumId}`;
    }

    // Use serverUrl as serverId (it's unique per server)
    // This allows buildStreamingUrl to find the correct server
    const serverId = this.serverUrl;
    const serverPrefix = btoa(serverId).substring(0, 8).replace(/[/+=]/g, '');

    return {
      ...track,
      id: `remote-${serverPrefix}-${track.id}`,
      originalId: track.id, // Keep original for API calls
      albumId: track.albumId ? `remote-${serverPrefix}-${track.albumId}` : undefined,
      coverArt,
      serverId, // Add serverId for streaming
      source: 'remote',
      serverName: this.serverName
    };
  }

  /**
   * Fetch with authentication
   */
  private async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.serverUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  /**
   * Get all tracks
   */
  async getTracks(options?: { limit?: number; offset?: number; sort?: string; order?: 'asc' | 'desc' }): Promise<Track[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.sort) params.append('sort', options.sort);
    if (options?.order) params.append('order', options.order);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await this.fetch(`/api/library/tracks${queryString}`);
    const data = await response.json();
    return (data.tracks || []).map((t: any) => this.normalizeTrack(t));
  }

  /**
   * Get single track
   */
  async getTrack(id: string): Promise<Track> {
    const response = await this.fetch(`/api/library/tracks/${id}`);
    const track = await response.json();
    return this.normalizeTrack(track);
  }

  /**
   * Get all artists
   */
  async getArtists(options?: { limit?: number; offset?: number; sort?: string; order?: 'asc' | 'desc' }): Promise<Artist[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.sort) params.append('sort', options.sort);
    if (options?.order) params.append('order', options.order);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await this.fetch(`/api/library/artists${queryString}`);
    const data = await response.json();
    return (data.artists || []).map((a: any) => this.normalizeArtist(a));
  }

  /**
   * Get tracks by artist
   */
  async getTracksByArtist(artistId: string): Promise<Track[]> {
    const response = await this.fetch(`/api/library/artists/${artistId}/tracks`);
    const data = await response.json();
    return (data.tracks || []).map((t: any) => this.normalizeTrack(t));
  }

  /**
   * Get all albums
   */
  async getAlbums(options?: { limit?: number; offset?: number; sort?: string; order?: 'asc' | 'desc' }): Promise<Album[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.sort) params.append('sort', options.sort);
    if (options?.order) params.append('order', options.order);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await this.fetch(`/api/library/albums${queryString}`);
    const data = await response.json();
    return (data.albums || []).map((album: any) => this.normalizeAlbum(album));
  }

  /**
   * Get tracks by album
   */
  async getTracksByAlbum(albumId: string): Promise<Track[]> {
    const response = await this.fetch(`/api/library/albums/${albumId}/tracks`);
    const data = await response.json();
    return (data.tracks || []).map((t: any) => this.normalizeTrack(t));
  }

  /**
   * Get streaming URL for a track
   */
  getStreamUrl(track: Track): string {
    return `${this.serverUrl}/api/stream/${track.filePath}`;
  }

  /**
   * Get library statistics
   */
  async getStats(): Promise<LibraryStats> {
    const response = await this.fetch('/api/scan/status');
    const data = await response.json();
    return {
      totalTracks: data.stats?.tracks || 0,
      totalArtists: data.stats?.artists || 0,
      totalAlbums: data.stats?.albums || 0,
    };
  }

  /**
   * Trigger library scan
   */
  async startScan(options?: ScanOptions): Promise<void> {
    await this.fetch('/api/scan/start', { 
      method: 'POST',
      body: JSON.stringify(options || {})
    });
  }

  /**
   * Get scan status
   */
  async getScanStatus(): Promise<ScanProgress> {
    const response = await this.fetch('/api/scan/status');
    const data = await response.json();
    return {
      isScanning: data.isScanning,
      filesScanned: data.stats?.tracks,
    };
  }

  /**
   * Get alphabet index
   */
  async getAlphabetIndex(type: 'tracks' | 'artists' | 'albums'): Promise<Record<string, number>> {
      const response = await this.fetch(`/api/library/alphabet-index?type=${type}`);
      return response.json();
  }

  /**
   * Subscribe to real-time scan events
   */
  subscribeToScanEvents(callbacks: {
    onTrackIndexed?: (track: Track) => void;
    onScanComplete?: (stats: any) => void;
    onScanStart?: () => void;
  }): () => void {
    this.eventSource = new EventSource(`${this.serverUrl}/api/scan/events`);

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'track:indexed':
          callbacks.onTrackIndexed?.(data.track);
          break;
        case 'scan:complete':
          callbacks.onScanComplete?.(data.stats);
          break;
        case 'scan:start':
          callbacks.onScanStart?.();
          break;
      }
    };

    // Return unsubscribe function
    return () => {
      this.eventSource?.close();
      this.eventSource = undefined;
    };
  }

  /**
   * Test connection to server
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
  
  // --- Playlist Methods ---

  async createPlaylist(name: string, type: PlaylistType, trackIds: string[] = []): Promise<Playlist> {
    const payload = { name, type, trackIds };
    console.log('[RemoteLibraryAdapter] POST /api/library/playlists', payload);
    
    const response = await this.fetch('/api/library/playlists', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    console.log('[RemoteLibraryAdapter] Playlist created response:', result);
    return result;
  }

  async getPlaylists(filter?: { type?: PlaylistType }): Promise<Playlist[]> {
    const params = new URLSearchParams();
    if (filter?.type) params.append('type', filter.type);
    
    const response = await this.fetch(`/api/library/playlists?${params.toString()}`);
    return response.json();
  }

  async getPlaylist(id: string): Promise<Playlist> {
    const response = await this.fetch(`/api/library/playlists/${id}`);
    return response.json();
  }

  async updatePlaylist(id: string, updates: Partial<Omit<Playlist, 'id' | 'type' | 'createdAt'>>): Promise<Playlist> {
    const response = await this.fetch(`/api/library/playlists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
    return response.json();
  }

  async deletePlaylist(id: string): Promise<void> {
    await this.fetch(`/api/library/playlists/${id}`, {
      method: 'DELETE'
    });
  }

  async addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<Playlist> {
    const response = await this.fetch(`/api/library/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ trackIds })
    });
    return response.json();
  }

  async removeTracksFromPlaylist(playlistId: string, trackIds: string[]): Promise<Playlist> {
    const response = await this.fetch(`/api/library/playlists/${playlistId}/tracks`, {
      method: 'DELETE',
      body: JSON.stringify({ trackIds })
    });
    return response.json();
  }

  async saveQueueSnapshot(trackIds: string[]): Promise<Playlist> {
    const dateStr = new Date().toLocaleString();
    return this.createPlaylist(`Queue ${dateStr}`, 'HISTORY_SNAPSHOT', trackIds);
  }
}
