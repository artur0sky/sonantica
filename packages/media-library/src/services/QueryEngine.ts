import { generateId, generateStableId } from '@sonantica/shared';
import type { Track, Album, Artist, Genre, LibraryFilter } from '../types';

export class QueryEngine {
  constructor() {}

  /**
   * Get all tracks with optional filtering
   */
  getTracks(tracksMap: Map<string, Track>, filter?: LibraryFilter): Track[] {
    let tracks = Array.from(tracksMap.values());

    if (filter) {
      if (filter.artist) {
        const filterArtist = filter.artist.toLowerCase();
        tracks = tracks.filter(t => {
          const artist = t.metadata.artist;
          if (!artist) return false;
          if (Array.isArray(artist)) {
            return artist.some(a => a.toLowerCase().includes(filterArtist));
          }
          return artist.toLowerCase().includes(filterArtist);
        });
      }
      if (filter.album) {
        tracks = tracks.filter(t =>
          t.metadata.album?.toLowerCase().includes(filter.album!.toLowerCase())
        );
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        tracks = tracks.filter(t => {
          const titleMatch = t.metadata.title?.toLowerCase().includes(search);
          const albumMatch = t.metadata.album?.toLowerCase().includes(search);
          
          // Handle artist as string or array
          let artistMatch = false;
          const artist = t.metadata.artist;
          if (artist) {
            if (Array.isArray(artist)) {
              artistMatch = artist.some(a => a.toLowerCase().includes(search));
            } else {
              artistMatch = artist.toLowerCase().includes(search);
            }
          }
          
          return titleMatch || artistMatch || albumMatch;
        });
      }
    }

    // Sort by artist, album, track number
    return tracks.sort((a, b) => {
      const artistA = this.getPrimaryArtist(a.metadata.artist);
      const artistB = this.getPrimaryArtist(b.metadata.artist);
      const artistCompare = artistA.localeCompare(artistB);
      if (artistCompare !== 0) return artistCompare;

      const albumCompare = (a.metadata.album || '').localeCompare(b.metadata.album || '');
      if (albumCompare !== 0) return albumCompare;

      return (a.metadata.trackNumber || 0) - (b.metadata.trackNumber || 0);
    });
  }

  /**
   * Get all albums
   */
  getAlbums(tracksMap: Map<string, Track>): Album[] {
    const albumsMap = new Map<string, Album>();

    for (const track of tracksMap.values()) {
      // Get primary artist (first artist if multiple, or albumArtist if available)
      const primaryArtist = track.metadata.albumArtist || 
                           this.getPrimaryArtist(track.metadata.artist) || 
                           'Unknown Artist';
      const albumName = track.metadata.album || 'Unknown Album';
      // Use consistent key format: "Artist - Album"
      const albumKey = `${primaryArtist} - ${albumName}`;

      const albumId = generateStableId(albumKey);

      if (!albumsMap.has(albumId)) {
        // Find cover art from any track in the album
        const coverArt = track.metadata.coverArt;
        
        albumsMap.set(albumId, {
          id: albumId,
          name: albumName,
          artist: primaryArtist,
          artistId: generateStableId(primaryArtist),
          year: track.metadata.year,
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
    }

    // Sort tracks within each album by track number
    for (const album of albumsMap.values()) {
      album.tracks.sort((a, b) => (a.metadata.trackNumber || 0) - (b.metadata.trackNumber || 0));
    }

    return Array.from(albumsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Get all artists
   */
  getArtists(tracksMap: Map<string, Track>): Artist[] {
    const artistsMap = new Map<string, Artist>();
    const artistAlbumsMap = new Map<string, Map<string, Album>>();

    // First pass: collect all albums for each artist
    for (const track of tracksMap.values()) {
      const artists = this.normalizeArtists(track.metadata.artist);
      
      for (const artistName of artists) {
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

        const albumName = track.metadata.album || 'Unknown Album';
        // For sub-filtering in artists, we still want the GLOBAL album ID 
        // to be based on the Primary Artist to ensure consistency across the app.
        const albumPrimaryArtist = track.metadata.albumArtist || 
                                   this.getPrimaryArtist(track.metadata.artist) || 
                                   'Unknown Artist';
        const globalAlbumKey = `${albumPrimaryArtist} - ${albumName}`;
        const albumId = generateStableId(globalAlbumKey);
        const albumsForArtist = artistAlbumsMap.get(artistId)!;

        if (!albumsForArtist.has(albumId)) {
          albumsForArtist.set(albumId, {
            id: albumId,
            name: albumName,
            artist: artistName,
            artistId: artistId,
            year: track.metadata.year,
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
    }

    // Second pass: populate artists with their albums
    for (const [artistName, artist] of artistsMap.entries()) {
      const albumsForArtist = artistAlbumsMap.get(artistName)!;
      artist.albums = Array.from(albumsForArtist.values());
      
      // Sort tracks within each album
      for (const album of artist.albums) {
        album.tracks.sort((a, b) => (a.metadata.trackNumber || 0) - (b.metadata.trackNumber || 0));
      }
      
      // Sort albums by name
      artist.albums.sort((a, b) => a.name.localeCompare(b.name));
      
      // Calculate total track count
      artist.trackCount = artist.albums.reduce((sum, album) => sum + album.tracks.length, 0);
    }

    return Array.from(artistsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Get all genres
   */
  getGenres(tracksMap: Map<string, Track>): Genre[] {
    const genresMap = new Map<string, Genre>();

    for (const track of tracksMap.values()) {
      const genres = this.normalizeGenres(track.metadata.genre);
      
      for (const genreName of genres) {
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
    }

    return Array.from(genresMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  // Helpers

  private normalizeArtists(artist: string | string[] | undefined): string[] {
    if (!artist) return ['Unknown Artist'];
    if (Array.isArray(artist)) return artist;
    return [artist];
  }

  private getPrimaryArtist(artist: string | string[] | undefined): string {
    if (!artist) return 'Unknown Artist';
    if (Array.isArray(artist)) return artist[0] || 'Unknown Artist';
    return artist;
  }

  private normalizeGenres(genre: string | string[] | undefined): string[] {
    if (!genre) return [];
    if (Array.isArray(genre)) return genre;
    return [genre];
  }
}
