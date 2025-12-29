/**
 * RemoteLibraryAdapter - Client adapter for remote API server
 * 
 * Philosophy: "One core, multiple surfaces"
 * 
 * This adapter allows web/mobile clients to consume the centralized
 * API server instead of accessing local file systems.
 */

import type { Track, Artist, Album } from '@sonantica/shared';

export interface RemoteLibraryConfig {
  serverUrl: string;
  apiKey?: string;
}

export class RemoteLibraryAdapter {
  private serverUrl: string;
  private apiKey?: string;
  private eventSource?: EventSource;

  constructor(config: RemoteLibraryConfig) {
    this.serverUrl = config.serverUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
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
  async getTracks(): Promise<Track[]> {
    const response = await this.fetch('/api/library/tracks');
    const data = await response.json();
    return data.tracks;
  }

  /**
   * Get single track
   */
  async getTrack(id: string): Promise<Track> {
    const response = await this.fetch(`/api/library/tracks/${id}`);
    return response.json();
  }

  /**
   * Get all artists
   */
  async getArtists(): Promise<Artist[]> {
    const response = await this.fetch('/api/library/artists');
    const data = await response.json();
    return data.artists;
  }

  /**
   * Get tracks by artist
   */
  async getTracksByArtist(artistId: string): Promise<Track[]> {
    const response = await this.fetch(`/api/library/artists/${artistId}/tracks`);
    const data = await response.json();
    return data.tracks;
  }

  /**
   * Get all albums
   */
  async getAlbums(): Promise<Album[]> {
    const response = await this.fetch('/api/library/albums');
    const data = await response.json();
    return data.albums;
  }

  /**
   * Get tracks by album
   */
  async getTracksByAlbum(albumId: string): Promise<Track[]> {
    const response = await this.fetch(`/api/library/albums/${albumId}/tracks`);
    const data = await response.json();
    return data.tracks;
  }

  /**
   * Get streaming URL for a track
   */
  getStreamUrl(track: Track): string {
    return `${this.serverUrl}/api/stream/${track.filePath}`;
  }

  /**
   * Trigger library scan
   */
  async startScan(): Promise<void> {
    await this.fetch('/api/scan/start', { method: 'POST' });
  }

  /**
   * Get scan status
   */
  async getScanStatus(): Promise<{
    isScanning: boolean;
    stats: { tracks: number; artists: number; albums: number };
  }> {
    const response = await this.fetch('/api/scan/status');
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
}
