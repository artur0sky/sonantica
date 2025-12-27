/**
 * Similarity Calculator
 * 
 * Calculates similarity between tracks based on metadata.
 * Handles missing metadata gracefully - uses available fields without discrimination.
 * 
 * "Every file has an intention" - even with incomplete metadata.
 * 
 * Security: Hardened against ReDoS and resource exhaustion.
 */

import type { Track } from '@sonantica/media-library';
import type { SimilarityWeights } from './types';

/**
 * Default weights for similarity calculation
 */
export const DEFAULT_WEIGHTS: Required<SimilarityWeights> = {
  artist: 0.35,
  album: 0.20,
  genre: 0.25,
  year: 0.10,
  tempo: 0.05,
  key: 0.05,
};

// Security Constants
const MAX_STRING_LENGTH = 1000;
const MAX_ARRAY_LENGTH = 100;

/**
 * Normalize artist name for comparison
 */
function normalizeString(str: string | undefined): string {
  if (!str) return '';
  if (typeof str !== 'string') return '';
  
  // Truncate
  if (str.length > MAX_STRING_LENGTH) str = str.slice(0, MAX_STRING_LENGTH);

  return str
    .toLowerCase()
    .trim()
    .replace(/^the\s+/i, '') // Remove leading "The"
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Convert artist field to array
 */
function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_LENGTH).filter(v => typeof v === 'string');
  }
  if (typeof value === 'string') {
    return [value];
  }
  return [];
}

/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity(set1: string[], set2: string[]): number {
  if (!Array.isArray(set1) || !Array.isArray(set2)) return 0;
  if (set1.length === 0 || set2.length === 0) return 0;
  
  // Limit processing
  const s1 = set1.slice(0, MAX_ARRAY_LENGTH).map(normalizeString);
  const s2 = set2.slice(0, MAX_ARRAY_LENGTH).map(normalizeString);
  
  const intersection = s1.filter(item => s2.includes(item)).length;
  // Use simple Set for union
  const union = new Set([...s1, ...s2]).size;
  
  return union > 0 ? intersection / union : 0;
}

/**
 * Calculate artist similarity
 */
export function calculateArtistSimilarity(track1: Track, track2: Track): number {
  if (!track1?.metadata || !track2?.metadata) return 0;

  const artists1 = toArray(track1.metadata.artist);
  const artists2 = toArray(track2.metadata.artist);
  
  if (artists1.length === 0 || artists2.length === 0) return 0;
  
  // Exact match bonus
  // O(N*M) but N,M are small (max 100)
  const exactMatch = artists1.some(a1 => 
    artists2.some(a2 => normalizeString(a1) === normalizeString(a2))
  );
  
  if (exactMatch) return 1.0;
  
  // Partial match using Jaccard
  return jaccardSimilarity(artists1, artists2);
}

/**
 * Calculate album similarity
 */
export function calculateAlbumSimilarity(track1: Track, track2: Track): number {
  const album1 = track1.metadata?.album;
  const album2 = track2.metadata?.album;
  
  if (!album1 || !album2) return 0;
  
  // Exact match
  if (normalizeString(album1) === normalizeString(album2)) {
    return 1.0;
  }
  
  return 0;
}

/**
 * Calculate genre similarity
 */
export function calculateGenreSimilarity(track1: Track, track2: Track): number {
  const genres1 = toArray(track1.metadata?.genre);
  const genres2 = toArray(track2.metadata?.genre);
  
  if (genres1.length === 0 || genres2.length === 0) return 0;
  
  return jaccardSimilarity(genres1, genres2);
}

/**
 * Calculate year similarity (closer years = higher similarity)
 */
export function calculateYearSimilarity(track1: Track, track2: Track): number {
  const year1 = track1.metadata?.year;
  const year2 = track2.metadata?.year;
  
  if (typeof year1 !== 'number' || typeof year2 !== 'number') return 0;
  
  // Sanity check year
  if (year1 < 1000 || year1 > 3000 || year2 < 1000 || year2 > 3000) return 0;

  const diff = Math.abs(year1 - year2);
  
  // Same year = 1.0
  // 1 year apart = 0.9
  // 5 years apart = 0.5
  // 10+ years apart = 0.0
  return Math.max(0, 1 - (diff / 10));
}

/**
 * Calculate overall similarity between two tracks
 * 
 * Uses only available metadata fields - missing fields don't penalize the score.
 * Weights are normalized based on available fields.
 */
export function calculateTrackSimilarity(
  track1: Track,
  track2: Track,
  weights: SimilarityWeights = DEFAULT_WEIGHTS
): number {
  if (!track1 || !track2) return 0;

  const mergedWeights = { ...DEFAULT_WEIGHTS, ...weights };
  
  // Calculate individual similarities
  const similarities: Array<{ score: number; weight: number }> = [];
  
  // Artist similarity
  const artistScore = calculateArtistSimilarity(track1, track2);
  if (artistScore > 0 || (track1.metadata?.artist && track2.metadata?.artist)) {
    similarities.push({ score: artistScore, weight: mergedWeights.artist });
  }
  
  // Album similarity
  const albumScore = calculateAlbumSimilarity(track1, track2);
  if (albumScore > 0 || (track1.metadata?.album && track2.metadata?.album)) {
    similarities.push({ score: albumScore, weight: mergedWeights.album });
  }
  
  // Genre similarity
  const genreScore = calculateGenreSimilarity(track1, track2);
  if (genreScore > 0 || (track1.metadata?.genre && track2.metadata?.genre)) {
    similarities.push({ score: genreScore, weight: mergedWeights.genre });
  }
  
  // Year similarity
  const yearScore = calculateYearSimilarity(track1, track2);
  if (yearScore > 0 || (track1.metadata?.year && track2.metadata?.year)) {
    similarities.push({ score: yearScore, weight: mergedWeights.year });
  }
  
  // If no similarities could be calculated, return 0
  if (similarities.length === 0) return 0;
  
  // Normalize weights based on available fields
  const totalWeight = similarities.reduce((sum, s) => sum + s.weight, 0);
  
  // Calculate weighted average
  const weightedSum = similarities.reduce(
    (sum, s) => sum + (s.score * s.weight),
    0
  );
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Get reasons why two tracks are similar
 */
export function getSimilarityReasons(track1: Track, track2: Track): Array<{ type: 'artist' | 'album' | 'genre' | 'year' | 'tempo' | 'key' | 'mood'; weight: number; description: string }> {
  if (!track1 || !track2) return [];

  const reasons: Array<{ type: 'artist' | 'album' | 'genre' | 'year' | 'tempo' | 'key' | 'mood'; weight: number; description: string }> = [];
  
  const artistScore = calculateArtistSimilarity(track1, track2);
  if (artistScore > 0.5) {
    const artists = toArray(track1.metadata?.artist);
    
    // Sanitize output description
    const safeDesc = artists.join(', ').slice(0, 100);

    reasons.push({
      type: 'artist',
      weight: artistScore,
      description: `Same artist${artists.length > 1 ? 's' : ''}: ${safeDesc}`,
    });
  }
  
  const albumScore = calculateAlbumSimilarity(track1, track2);
  if (albumScore > 0.5) {
     const safeAlbum = (track1.metadata?.album || 'Unknown').slice(0, 100);
    reasons.push({
      type: 'album',
      weight: albumScore,
      description: `From album: ${safeAlbum}`,
    });
  }
  
  const genreScore = calculateGenreSimilarity(track1, track2);
  if (genreScore > 0.3) {
    const genres = toArray(track1.metadata?.genre);
    const safeGenres = genres.join(', ').slice(0, 100);
    reasons.push({
      type: 'genre',
      weight: genreScore,
      description: `Similar genre: ${safeGenres}`,
    });
  }
  
  const yearScore = calculateYearSimilarity(track1, track2);
  if (yearScore > 0.5 && track1.metadata?.year) {
    reasons.push({
      type: 'year',
      weight: yearScore,
      description: `From ${track1.metadata.year}`,
    });
  }
  
  return reasons;
}
