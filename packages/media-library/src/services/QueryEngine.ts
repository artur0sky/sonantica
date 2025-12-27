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
            try {
              const artist = t.metadata.artist;
              if (!artist) return false;
              
              if (Array.isArray(artist)) {
                return artist.some(a => {
                  if (typeof a !== 'string') return false;
                  return QuerySecurityValidator.sanitizeString(a.toLowerCase()).includes(filterArtist);
                });
              }
              
              if (typeof artist !== 'string') return false;
              return QuerySecurityValidator.sanitizeString(artist.toLowerCase()).includes(filterArtist);
            } catch (error) {
              console.warn('Error filtering track by artist:', error);
              return false;
            }
          });
        }

        if (filter.album) {
          QuerySecurityValidator.validateFilterString(filter.album, 'album filter');
          const filterAlbum = QuerySecurityValidator.sanitizeString(filter.album.toLowerCase());
          
          tracks = tracks.filter(t => {
            try {
              const album = t.metadata.album;
              if (!album || typeof album !== 'string') return false;
              return QuerySecurityValidator.sanitizeString(album.toLowerCase()).includes(filterAlbum);
            } catch (error) {
              console.warn('Error filtering track by album:', error);
              return false;
            }
          });
        }

        if (filter.search) {
          QuerySecurityValidator.validateFilterString(filter.search, 'search query');
          const search = QuerySecurityValidator.sanitizeString(filter.search.toLowerCase());
          
          tracks = tracks.filter(t => {
            try {
              const title = t.metadata.title;
              const album = t.metadata.album;
              const artist = t.metadata.artist;

              const titleMatch = title && typeof title === 'string' ? 
                QuerySecurityValidator.sanitizeString(title.toLowerCase()).includes(search) : false;
              
              const albumMatch = album && typeof album === 'string' ? 
                QuerySecurityValidator.sanitizeString(album.toLowerCase()).includes(search) : false;
              
              let artistMatch = false;
              if (artist) {
                if (Array.isArray(artist)) {
                  artistMatch = artist.some(a => {
                    if (typeof a !== 'string') return false;
                    return QuerySecurityValidator.sanitizeString(a.toLowerCase()).includes(search);
                  });
                } else if (typeof artist === 'string') {
                  artistMatch = QuerySecurityValidator.sanitizeString(artist.toLowerCase()).includes(search);
                }
              }
              
              return titleMatch || artistMatch || albumMatch;
            } catch (error) {
              console.warn('Error searching track:', error);
              return false;
            }
          });
        }
      }

      // Sort by artist, album, track number
      return tracks.sort((a, b) => {
        try {
          const artistA = this.getPrimaryArtist(a.metadata.artist);
          const artistB = this.getPrimaryArtist(b.metadata.artist);
          const artistCompare = artistA.localeCompare(artistB);
          if (artistCompare !== 0) return artistCompare;

          const albumA = a.metadata.album || '';
          const albumB = b.metadata.album || '';
          const albumCompare = albumA.localeCompare(albumB);
          if (albumCompare !== 0) return albumCompare;

          const trackA = typeof a.metadata.trackNumber === 'number' ? a.metadata.trackNumber : 0;
          const trackB = typeof b.metadata.trackNumber === 'number' ? b.metadata.trackNumber : 0;
          return trackA - trackB;
        } catch (error) {
          console.warn('Error sorting tracks:', error);
          return 0;
        }
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
        try {
          // Get primary artist (first artist if multiple, or albumArtist if available)
          const albumArtist = track.metadata.albumArtist;
          const primaryArtist = (albumArtist && typeof albumArtist === 'string') ? 
            albumArtist : 
            this.getPrimaryArtist(track.metadata.artist);
          
          const albumName = (track.metadata.album && typeof track.metadata.album === 'string') ? 
            track.metadata.album : 
            'Unknown Album';
          
          // Use consistent key format: "Artist - Album"
          const albumKey = `${primaryArtist} - ${albumName}`;
          const albumId = generateStableId(albumKey);

          if (!albumsMap.has(albumId)) {
            const coverArt = track.metadata.coverArt;
            const year = typeof track.metadata.year === 'number' ? track.metadata.year : undefined;
            
            albumsMap.set(albumId, {
              id: albumId,
              name: albumName,
              artist: primaryArtist,
              artistId: generateStableId(primaryArtist),
              year,
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
        } catch (trackError) {
          console.warn('Error processing track for album:', trackError);
          // Continue with next track
        }
      }

      // Sort tracks within each album by track number
      for (const album of albumsMap.values()) {
        try {
          album.tracks.sort((a, b) => {
            const trackA = typeof a.metadata.trackNumber === 'number' ? a.metadata.trackNumber : 0;
            const trackB = typeof b.metadata.trackNumber === 'number' ? b.metadata.trackNumber : 0;
            return trackA - trackB;
          });
        } catch (sortError) {
          console.warn('Error sorting album tracks:', sortError);
        }
      }

      return Array.from(albumsMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
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
        try {
          const artists = this.normalizeArtists(track.metadata.artist);
          
          for (const artistName of artists) {
            if (typeof artistName !== 'string') continue;
            
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

            const albumName = (track.metadata.album && typeof track.metadata.album === 'string') ? 
              track.metadata.album : 
              'Unknown Album';
            
            // For sub-filtering in artists, we still want the GLOBAL album ID 
            // to be based on the Primary Artist to ensure consistency across the app.
            const albumArtist = track.metadata.albumArtist;
            const albumPrimaryArtist = (albumArtist && typeof albumArtist === 'string') ? 
              albumArtist : 
              this.getPrimaryArtist(track.metadata.artist);
            
            const globalAlbumKey = `${albumPrimaryArtist} - ${albumName}`;
            const albumId = generateStableId(globalAlbumKey);
            const albumsForArtist = artistAlbumsMap.get(artistId)!;

            if (!albumsForArtist.has(albumId)) {
              const year = typeof track.metadata.year === 'number' ? track.metadata.year : undefined;
              
              albumsForArtist.set(albumId, {
                id: albumId,
                name: albumName,
                artist: artistName,
                artistId: artistId,
                year,
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
        } catch (trackError) {
          console.warn('Error processing track for artist:', trackError);
          // Continue with next track
        }
      }

      // Second pass: populate artists with their albums
      for (const [artistName, artist] of artistsMap.entries()) {
        try {
          const albumsForArtist = artistAlbumsMap.get(artistName)!;
          artist.albums = Array.from(albumsForArtist.values());
          
          // Sort tracks within each album
          for (const album of artist.albums) {
            try {
              album.tracks.sort((a, b) => {
                const trackA = typeof a.metadata.trackNumber === 'number' ? a.metadata.trackNumber : 0;
                const trackB = typeof b.metadata.trackNumber === 'number' ? b.metadata.trackNumber : 0;
                return trackA - trackB;
              });
            } catch (sortError) {
              console.warn('Error sorting tracks in album:', sortError);
            }
          }
          
          // Sort albums by name
          artist.albums.sort((a, b) => a.name.localeCompare(b.name));
          
          // Calculate total track count
          artist.trackCount = artist.albums.reduce((sum, album) => sum + album.tracks.length, 0);
        } catch (artistError) {
          console.warn('Error processing artist:', artistError);
        }
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
        try {
          const genres = this.normalizeGenres(track.metadata.genre);
          
          for (const genreName of genres) {
            if (typeof genreName !== 'string') continue;
            
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
        } catch (trackError) {
          console.warn('Error processing track for genre:', trackError);
          // Continue with next track
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
