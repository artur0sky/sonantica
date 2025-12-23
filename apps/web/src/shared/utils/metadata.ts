/**
 * Utility functions for formatting metadata
 */

/**
 * Format artist(s) for display
 * Handles both single artist and multiple artists
 */
export function formatArtists(artist: string | string[] | undefined): string {
  if (!artist) return 'Unknown Artist';
  if (Array.isArray(artist)) {
    return artist.join(', ');
  }
  return artist;
}

/**
 * Format genre(s) for display
 * Handles both single genre and multiple genres
 */
export function formatGenres(genre: string | string[] | undefined): string {
  if (!genre) return '-';
  if (Array.isArray(genre)) {
    return genre.join(', ');
  }
  return genre;
}

/**
 * Get primary artist from artist field
 */
export function getPrimaryArtist(artist: string | string[] | undefined): string {
  if (!artist) return 'Unknown Artist';
  if (Array.isArray(artist)) return artist[0] || 'Unknown Artist';
  return artist;
}
