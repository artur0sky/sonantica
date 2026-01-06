/**
 * Recommendation Engine Types
 * 
 * Types for the intelligent recommendation system.
 * "Sound is a form of language" - recommendations help discover that language.
 */

import type { Track, Album, Artist } from '@sonantica/shared';

/**
 * Recommendation context - what to base recommendations on
 */
export type RecommendationContext = 
  | { type: 'track'; track: Track }
  | { type: 'album'; album: Album }
  | { type: 'artist'; artist: Artist }
  | { type: 'genre'; genre: string }
  | { type: 'year'; year: number }
  | { type: 'multi-track'; tracks: Track[] };

/**
 * Recommendation result with similarity score
 */
export interface Recommendation<T = Track | Album | Artist> {
  item: T;
  score: number; // 0.0 to 1.0
  reasons: RecommendationReason[];
}

/**
 * Why this item was recommended
 */
export interface RecommendationReason {
  type: 'artist' | 'album' | 'genre' | 'year' | 'tempo' | 'key' | 'mood';
  weight: number; // Contribution to final score
  description: string;
}

/**
 * Recommendation options
 */
export interface RecommendationOptions {
  /** Maximum number of recommendations to return */
  limit?: number;
  
  /** Minimum similarity score (0.0 to 1.0) */
  minScore?: number;
  
  /** Exclude items already in queue */
  excludeQueued?: boolean;
  
  /** Weights for different similarity factors */
  weights?: SimilarityWeights;
  
  /** Diversity factor (0 = similar, 1 = diverse) */
  diversity?: number;
}

/**
 * Weights for similarity calculation
 */
export interface SimilarityWeights {
  artist?: number;      // Default: 0.35
  album?: number;       // Default: 0.20
  genre?: number;       // Default: 0.25
  year?: number;        // Default: 0.10
  tempo?: number;       // Default: 0.05 (if available)
  key?: number;         // Default: 0.05 (if available)
}

/**
 * Recommendation strategy
 */
export interface IRecommendationStrategy {
  /**
   * Calculate similarity between two tracks
   */
  calculateSimilarity(track1: Track, track2: Track, weights?: SimilarityWeights): number;
  
  /**
   * Get recommendations based on context
   */
  getRecommendations(
    context: RecommendationContext,
    library: Track[],
    options?: RecommendationOptions
  ): Recommendation<Track>[];
}

/**
 * Album recommendation result
 */
export type AlbumRecommendation = Recommendation<Album>;

/**
 * Artist recommendation result
 */
export type ArtistRecommendation = Recommendation<Artist>;
