/**
 * Recommendation Engine
 * 
 * Core recommendation engine that provides intelligent music suggestions.
 * Supports multiple recommendation contexts and strategies.
 * 
 * "Sound is a form of language" - recommendations help discover connections.
 */

import type { Track, Album, Artist } from '@sonantica/media-library';
import type {
  RecommendationContext,
  Recommendation,
  RecommendationOptions,
  IRecommendationStrategy,
  AlbumRecommendation,
  ArtistRecommendation,
} from './types';
import {
  calculateTrackSimilarity,
  getSimilarityReasons,
  DEFAULT_WEIGHTS,
} from './similarity';

/**
 * Default recommendation strategy based on metadata similarity
 */
export class MetadataRecommendationStrategy implements IRecommendationStrategy {
  calculateSimilarity(track1: Track, track2: Track, weights?: typeof DEFAULT_WEIGHTS): number {
    return calculateTrackSimilarity(track1, track2, weights || DEFAULT_WEIGHTS);
  }

  getRecommendations(
    context: RecommendationContext,
    library: Track[],
    options: RecommendationOptions = {}
  ): Recommendation<Track>[] {
    const {
      limit = 10,
      minScore = 0.3,
      weights,
      diversity = 0.0,
    } = options;

    // Get reference tracks based on context
    const referenceTracks = this.getReferenceTracks(context, library);
    if (referenceTracks.length === 0) return [];

    // Calculate similarities for all library tracks
    const scored: Array<{ track: Track; score: number }> = [];

    for (const candidate of library) {
      // Skip if it's one of the reference tracks
      if (referenceTracks.some(ref => ref.id === candidate.id)) {
        continue;
      }

      // Calculate average similarity to all reference tracks
      const similarities = referenceTracks.map(ref =>
        this.calculateSimilarity(ref, candidate, weights as typeof DEFAULT_WEIGHTS)
      );
      const avgScore = similarities.reduce((a, b) => a + b, 0) / similarities.length;

      if (avgScore >= minScore) {
        scored.push({ track: candidate, score: avgScore });
      }
    }

    // Sort by score (descending)
    scored.sort((a, b) => b.score - a.score);

    // Apply diversity if requested
    const selected = diversity > 0
      ? this.applyDiversity(scored, diversity, limit)
      : scored.slice(0, limit);

    // Convert to Recommendation objects with reasons
    return selected.map(({ track, score }) => ({
      item: track,
      score,
      reasons: getSimilarityReasons(referenceTracks[0], track),
    }));
  }

  /**
   * Get reference tracks based on context
   */
  private getReferenceTracks(context: RecommendationContext, library: Track[]): Track[] {
    switch (context.type) {
      case 'track':
        return [context.track];

      case 'album':
        return context.album.tracks;

      case 'artist':
        return context.artist.albums.flatMap(album => album.tracks);

      case 'genre':
        return library.filter(track => {
          const genres = Array.isArray(track.metadata?.genre)
            ? track.metadata.genre
            : track.metadata?.genre ? [track.metadata.genre] : [];
          return genres.some(g => 
            g.toLowerCase().includes(context.genre.toLowerCase())
          );
        });

      case 'year':
        return library.filter(track => track.metadata?.year === context.year);

      case 'multi-track':
        return context.tracks;

      default:
        return [];
    }
  }

  /**
   * Apply diversity to recommendations
   * Prevents all recommendations from being too similar
   */
  private applyDiversity(
    scored: Array<{ track: Track; score: number }>,
    diversity: number,
    limit: number
  ): Array<{ track: Track; score: number }> {
    if (scored.length <= limit) return scored;

    const selected: Array<{ track: Track; score: number }> = [];
    const remaining = [...scored];

    // Always take the top result
    selected.push(remaining.shift()!);

    while (selected.length < limit && remaining.length > 0) {
      // Calculate diversity score for each remaining track
      const diversityScored = remaining.map((candidate, index) => {
        // How different is this from already selected tracks?
        const avgDifference = selected.reduce((sum, sel) => {
          const similarity = this.calculateSimilarity(sel.track, candidate.track);
          return sum + (1 - similarity);
        }, 0) / selected.length;

        // Blend original score with diversity
        const blendedScore = 
          (1 - diversity) * candidate.score + 
          diversity * avgDifference;

        return { ...candidate, blendedScore, originalIndex: index };
      });

      // Sort by blended score
      diversityScored.sort((a, b) => b.blendedScore - a.blendedScore);

      // Take the best one
      const best = diversityScored[0];
      selected.push(remaining[best.originalIndex]);
      remaining.splice(best.originalIndex, 1);
    }

    return selected;
  }
}

/**
 * Recommendation Engine
 */
export class RecommendationEngine {
  private strategy: IRecommendationStrategy;

  constructor(strategy: IRecommendationStrategy = new MetadataRecommendationStrategy()) {
    this.strategy = strategy;
  }

  /**
   * Get track recommendations based on context
   */
  getTrackRecommendations(
    context: RecommendationContext,
    library: Track[],
    options?: RecommendationOptions
  ): Recommendation<Track>[] {
    return this.strategy.getRecommendations(context, library, options);
  }

  /**
   * Get album recommendations based on a track
   */
  getAlbumRecommendations(
    track: Track,
    albums: Album[],
    options?: RecommendationOptions
  ): AlbumRecommendation[] {
    const { limit = 10, minScore = 0.4 } = options || {};

    // Calculate similarity for each album based on its tracks
    const scored: Array<{ album: Album; score: number }> = [];

    for (const album of albums) {
      // Skip if it's the same album
      if (album.name === track.metadata?.album) continue;

      // Calculate average similarity to album tracks
      const similarities = album.tracks.map(albumTrack =>
        this.strategy.calculateSimilarity(track, albumTrack)
      );
      const avgScore = similarities.reduce((a, b) => a + b, 0) / similarities.length;

      if (avgScore >= minScore) {
        scored.push({ album, score: avgScore });
      }
    }

    // Sort and limit
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(({ album, score }) => ({
      item: album,
      score,
      reasons: [
        {
          type: 'artist',
          weight: score,
          description: `Similar to ${track.metadata?.title || 'current track'}`,
        },
      ],
    }));
  }

  /**
   * Get artist recommendations based on a track
   */
  getArtistRecommendations(
    track: Track,
    artists: Artist[],
    options?: RecommendationOptions
  ): ArtistRecommendation[] {
    const { limit = 10, minScore = 0.4 } = options || {};

    // Calculate similarity for each artist based on their tracks
    const scored: Array<{ artist: Artist; score: number }> = [];

    for (const artist of artists) {
      // Skip if it's the same artist
      const trackArtists = Array.isArray(track.metadata?.artist)
        ? track.metadata.artist
        : track.metadata?.artist ? [track.metadata.artist] : [];
      
      if (trackArtists.some(a => a.toLowerCase() === artist.name.toLowerCase())) {
        continue;
      }

      // Calculate average similarity to artist's tracks
      const artistTracks = artist.albums.flatMap(album => album.tracks);
      const similarities = artistTracks.map(artistTrack =>
        this.strategy.calculateSimilarity(track, artistTrack)
      );
      const avgScore = similarities.reduce((a, b) => a + b, 0) / similarities.length;

      if (avgScore >= minScore) {
        scored.push({ artist, score: avgScore });
      }
    }

    // Sort and limit
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map(({ artist, score }) => ({
      item: artist,
      score,
      reasons: [
        {
          type: 'artist',
          weight: score,
          description: `Similar style to ${track.metadata?.artist || 'current artist'}`,
        },
      ],
    }));
  }

  /**
   * Get recommendations by genre
   */
  getRecommendationsByGenre(
    genre: string,
    library: Track[],
    options?: RecommendationOptions
  ): Recommendation<Track>[] {
    return this.getTrackRecommendations(
      { type: 'genre', genre },
      library,
      options
    );
  }

  /**
   * Get recommendations by year
   */
  getRecommendationsByYear(
    year: number,
    library: Track[],
    options?: RecommendationOptions
  ): Recommendation<Track>[] {
    return this.getTrackRecommendations(
      { type: 'year', year },
      library,
      options
    );
  }

  /**
   * Change recommendation strategy
   */
  setStrategy(strategy: IRecommendationStrategy): void {
    this.strategy = strategy;
  }
}
