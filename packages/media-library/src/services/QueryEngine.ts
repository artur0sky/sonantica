/**
 * Query Engine
 * 
 * Provides querying and aggregation of library data
 * 
 * Security: Hardened against injection attacks and resource exhaustion
 */

import { generateId, generateStableId } from '@sonantica/shared';
import type { Track, Album, Artist, Genre, LibraryFilter } from '../types';

/**
 * Security constants
 */
const MAX_TRACKS = 100000; // Maximum tracks to process
const MAX_SEARCH_LENGTH = 256; // Maximum search query length
const MAX_FILTER_LENGTH = 256; // Maximum filter string length

/**
 * Security validator for query operations
 */
class QuerySecurityValidator {
  /**
   * Validates search/filter string
   * @throws {Error} If string is invalid or potentially malicious
   */
  static validateFilterString(value: string, fieldName: string): void {
    if (typeof value !== 'string') {
      throw new Error(`Invalid ${fieldName}: Must be a string`);
    }

    if (value.length > MAX_FILTER_LENGTH) {
      throw new Error(`${fieldName} too long: ${value.length} characters (max: ${MAX_FILTER_LENGTH})`);
    }

    // Prevent null bytes
    if (value.includes('\0')) {
      throw new Error(`${fieldName} contains null byte`);
    }
  }

  /**
   * Validates tracks map size
   * @throws {Error} If map is too large
   */
  static validateTracksMapSize(size: number): void {
    if (size > MAX_TRACKS) {
      throw new Error(`Too many tracks: ${size} (max: ${MAX_TRACKS})`);
    }
  }

  /**
   * Sanitizes string for safe comparison
   */
  static sanitizeString(value: string): string {
    // Remove null bytes and control characters
    return value.replace(/[\0-\x1F\x7F]/g, '');
  }
}

export class QueryEngine {
  constructor() {}

  /**
   * Get all tracks with optional filtering
   * @param tracksMap - Map of tracks
   * @param filter - Optional filter criteria
   * @returns Filtered and sorted array of tracks
   */
  getTracks(tracksMap: Map<string, Track>, filter?: LibraryFilter): Track[] {
    try {
      // Validate input
      if (!(tracksMap instanceof Map)) {
        throw new Error('Invalid tracksMap: Must be a Map');
      }

      QuerySecurityValidator.validateTracksMapSize(tracksMap.size);

      let tracks = Array.from(tracksMap.values());

      if (filter) {
        // Validate filter object
        if (typeof filter !== 'object' || filter === null) {
          throw new Error('Invalid filter: Must be an object');
        }

        if (filter.artist) {
          QuerySecurityValidator.validateFilterString(filter.artist, 'artist filter');
          const filterArtist = QuerySecurityValidator.sanitizeString(filter.artist.toLowerCase());
          
          tracks = tracks.filter(t => {
            const artist = t.artist;
            if (!artist) return false;
            return QuerySecurityValidator.sanitizeString(artist.toLowerCase()).includes(filterArtist);
          });
        }

        if (filter.album) {
          QuerySecurityValidator.validateFilterString(filter.album, 'album filter');
          const filterAlbum = QuerySecurityValidator.sanitizeString(filter.album.toLowerCase());
          
          tracks = tracks.filter(t => {
            const album = t.album;
            if (!album) return false;
            return QuerySecurityValidator.sanitizeString(album.toLowerCase()).includes(filterAlbum);
          });
        }

        if (filter.search) {
          QuerySecurityValidator.validateFilterString(filter.search, 'search query');
          const search = QuerySecurityValidator.sanitizeString(filter.search.toLowerCase());
          
          tracks = tracks.filter(t => {
            const title = t.title || '';
            const album = t.album || '';
            const artist = t.artist || '';

            return (
              QuerySecurityValidator.sanitizeString(title.toLowerCase()).includes(search) ||
              QuerySecurityValidator.sanitizeString(artist.toLowerCase()).includes(search) ||
              QuerySecurityValidator.sanitizeString(album.toLowerCase()).includes(search)
            );
          });
        }
      }

      // Sort by artist, album, track number
      return tracks.sort((a, b) => {
        const artistCompare = (a.artist || '').localeCompare(b.artist || '');
        if (artistCompare !== 0) return artistCompare;

        const albumCompare = (a.album || '').localeCompare(b.album || '');
        if (albumCompare !== 0) return albumCompare;

        const trackA = a.trackNumber || 0;
        const trackB = b.trackNumber || 0;
        return trackA - trackB;
      });
    } catch (error) {
      console.error('Error getting tracks:', error);
      return [];
    }
  }

  /**
   * Get all albums
   * @param tracksMap - Map of tracks
   * @returns Array of albums with tracks
   */
  getAlbums(tracksMap: Map<string, Track>): Album[] {
    try {
      // Validate input
      if (!(tracksMap instanceof Map)) {
        throw new Error('Invalid tracksMap: Must be a Map');
      }

      QuerySecurityValidator.validateTracksMapSize(tracksMap.size);

      const albumsMap = new Map<string, Album>();

      for (const track of tracksMap.values()) {
        const primaryArtist = track.albumArtist || track.artist || 'Unknown Artist';
        const albumTitle = track.album || 'Unknown Album';
        
        // Use consistent key format: "Artist - Album"
        const albumKey = `${primaryArtist} - ${albumTitle}`;
        const albumId = generateStableId(albumKey);

        if (!albumsMap.has(albumId)) {
          albumsMap.set(albumId, {
            id: albumId,
            title: albumTitle,
            artist: primaryArtist,
            year: track.year,
            coverArt: track.coverArt,
            trackCount: 0,
            tracks: [], // Internal use for enrichment
          } as any);
        }

        const album = albumsMap.get(albumId)!;
        (album as any).tracks.push(track);
        album.trackCount++;
        
        // Update cover art if this track has one and album doesn't
        if (!album.coverArt && track.coverArt) {
          album.coverArt = track.coverArt;
        }
        
        // Update year if missing
        if (!album.year && track.year) {
          album.year = track.year;
        }
      }

      // Final processing: sort tracks and calculate duration
      for (const album of albumsMap.values()) {
        const tracks = (album as any).tracks as Track[];
        tracks.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
        
        album.totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
      }

      return Array.from(albumsMap.values()).sort((a, b) =>
        a.title.localeCompare(b.title)
      );
    } catch (error) {
      console.error('Error getting albums:', error);
      return [];
    }
  }

  /**
   * Get all artists
   * @param tracksMap - Map of tracks
   * @returns Array of artists with albums and tracks
   */
  getArtists(tracksMap: Map<string, Track>): Artist[] {
    try {
      // Validate input
      if (!(tracksMap instanceof Map)) {
        throw new Error('Invalid tracksMap: Must be a Map');
      }

      QuerySecurityValidator.validateTracksMapSize(tracksMap.size);

      const artistsMap = new Map<string, Artist>();
      const artistAlbumsMap = new Map<string, Map<string, Album>>();

      // First pass: collect all albums for each artist
      for (const track of tracksMap.values()) {
        const artistName = track.artist || 'Unknown Artist';
        const artistId = generateStableId(artistName);

        if (!artistsMap.has(artistId)) {
          artistsMap.set(artistId, {
            id: artistId,
            name: artistName,
            trackCount: 0,
            albumCount: 0,
            imageUrl: track.coverArt, // Use first found cover art as representative
          });
        }

        const artist = artistsMap.get(artistId)!;
        artist.trackCount++;
        
        // Track unique albums for albumCount
        if (!artistAlbumsMap.has(artistId)) {
          artistAlbumsMap.set(artistId, new Map());
        }
        
        const albumsSet = artistAlbumsMap.get(artistId)!;
        const albumKey = `${artistName} - ${track.album || 'Unknown Album'}`;
        const albumId = generateStableId(albumKey);
        
        if (!albumsSet.has(albumId)) {
          albumsSet.set(albumId, {} as any);
        }
      }

      // Populate album counts
      for (const [artistId, artist] of artistsMap.entries()) {
        artist.albumCount = artistAlbumsMap.get(artistId)?.size || 0;
      }

      return Array.from(artistsMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    } catch (error) {
      console.error('Error getting artists:', error);
      return [];
    }
  }

  /**
   * Get all genres
   * @param tracksMap - Map of tracks
   * @returns Array of genres with track counts
   */
  getGenres(tracksMap: Map<string, Track>): Genre[] {
    try {
      // Validate input
      if (!(tracksMap instanceof Map)) {
        throw new Error('Invalid tracksMap: Must be a Map');
      }

      QuerySecurityValidator.validateTracksMapSize(tracksMap.size);

      const genresMap = new Map<string, Genre>();

      for (const track of tracksMap.values()) {
        const genreField = track.genre || '';
        const genres = genreField.split(',').map(g => g.trim()).filter(Boolean);
        
        for (const genreName of genres) {
          if (!genresMap.has(genreName)) {
            genresMap.set(genreName, {
              id: generateStableId(genreName),
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
    } catch (error) {
      console.error('Error getting genres:', error);
      return [];
    }
  }

  // Helpers

  /**
   * Normalize artist field to array
   * @private
   */
  private normalizeArtists(artist: string | string[] | undefined): string[] {
    try {
      if (!artist) return ['Unknown Artist'];
      if (Array.isArray(artist)) {
        // Filter out non-string values
        return artist.filter(a => typeof a === 'string' && a.length > 0);
      }
      if (typeof artist === 'string') return [artist];
      return ['Unknown Artist'];
    } catch (error) {
      console.warn('Error normalizing artists:', error);
      return ['Unknown Artist'];
    }
  }

  /**
   * Get primary artist from artist field
   * @private
   */
  private getPrimaryArtist(artist: string | string[] | undefined): string {
    try {
      if (!artist) return 'Unknown Artist';
      if (Array.isArray(artist)) {
        const firstArtist = artist.find(a => typeof a === 'string' && a.length > 0);
        return firstArtist || 'Unknown Artist';
      }
      if (typeof artist === 'string') return artist;
      return 'Unknown Artist';
    } catch (error) {
      console.warn('Error getting primary artist:', error);
      return 'Unknown Artist';
    }
  }

  /**
   * Normalize genre field to array
   * @private
   */
  private normalizeGenres(genre: string | string[] | undefined): string[] {
    try {
      if (!genre) return [];
      if (Array.isArray(genre)) {
        // Filter out non-string values
        return genre.filter(g => typeof g === 'string' && g.length > 0);
      }
      if (typeof genre === 'string') return [genre];
      return [];
    } catch (error) {
      console.warn('Error normalizing genres:', error);
      return [];
    }
  }
}
