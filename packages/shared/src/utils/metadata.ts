/**
 * Utility functions for formatting metadata
 * 
 * Security: Hardened input checking
 */

const MAX_DISPLAY_LENGTH = 500;

/**
 * Format artist(s) for display
 * Handles both single artist and multiple artists
 */
export function formatArtists(artist: string | string[] | undefined): string {
  if (!artist) return 'Unknown Artist';
  
  let result = '';
  if (Array.isArray(artist)) {
    // Escape or simple join? Text content safe usually for display if UI framework escapes.
    // We trim array to avoid massive checking
    result = artist.slice(0, 50).join(', ');
  } else if (typeof artist === 'string') {
    result = artist;
  } else {
      return 'Unknown Artist';
  }

  return result.length > MAX_DISPLAY_LENGTH ? result.slice(0, MAX_DISPLAY_LENGTH) + '...' : result;
}

/**
 * Format genre(s) for display
 * Handles both single genre and multiple genres
 */
export function formatGenres(genre: string | string[] | undefined): string {
  if (!genre) return '-';
  
  let result = '';
  if (Array.isArray(genre)) {
    result = genre.slice(0, 50).join(', ');
  } else if (typeof genre === 'string') {
    result = genre;
  } else {
      return '-';
  }

  return result.length > MAX_DISPLAY_LENGTH ? result.slice(0, MAX_DISPLAY_LENGTH) + '...' : result;
}

/**
 * Get primary artist from artist field
 */
export function getPrimaryArtist(artist: string | string[] | undefined): string {
  if (!artist) return 'Unknown Artist';
  if (Array.isArray(artist)) {
      const first = artist[0];
      if (typeof first === 'string') return first.slice(0, MAX_DISPLAY_LENGTH);
      return 'Unknown Artist';
  }
  if (typeof artist === 'string') return artist.slice(0, MAX_DISPLAY_LENGTH);
  return 'Unknown Artist';
}
