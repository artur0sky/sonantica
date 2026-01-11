/**
 * @sonantica/recommendations
 * 
 * Intelligent music recommendation engine.
 * Analyzes metadata to suggest similar tracks, albums, and artists.
 * 
 * "Sound is a form of language" - recommendations help discover connections.
 */

// Core engine
export { RecommendationEngine, MetadataRecommendationStrategy } from './RecommendationEngine';

// Similarity calculations
export {
  calculateTrackSimilarity,
  calculateArtistSimilarity,
  calculateAlbumSimilarity,
  calculateGenreSimilarity,
  calculateYearSimilarity,
  getSimilarityReasons,
  DEFAULT_WEIGHTS,
} from './similarity';

// React hooks
export {
  useTrackRecommendations,
  useAlbumRecommendations,
  useArtistRecommendations,
  useAlbumSimilarAlbums,
  useArtistSimilarArtists,
  useGenreRecommendations,
  useYearRecommendations,
  useQueueRecommendations,
} from './hooks';

// Types
export type {
  RecommendationContext,
  Recommendation,
  RecommendationReason,
  RecommendationOptions,
  SimilarityWeights,
  IRecommendationStrategy,
  AlbumRecommendation,
  ArtistRecommendation,
} from './types';

export type {
    ExternalFetcher,
    ExternalRecommendationRequest,
    ExternalRecommendationResponse
} from './external';
