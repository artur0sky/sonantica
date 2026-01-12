/**
 * Recommendation Engine
 * 
 * Core recommendation engine that provides intelligent music suggestions.
 * Supports multiple recommendation contexts and strategies.
 * 
 * "Sound is a form of language" - recommendations help discover connections.
 * 
 * Security: Hardened against DoS via complexity, infinite loops, and resource exhaustion.
 */

import type { Track, Album, Artist } from '@sonantica/shared';
import type {
  RecommendationContext,
  Recommendation,
  RecommendationOptions,
  IRecommendationStrategy,
  AlbumRecommendation,
  ArtistRecommendation,
  RecommendationReason,
} from './types';
import type { 
    ExternalFetcher, 
    ExternalRecommendationRequest 
} from './external';
import {
  calculateTrackSimilarity,
  getSimilarityReasons,
  DEFAULT_WEIGHTS,
} from './similarity';

// Security Constants
const MAX_LIBRARY_FOR_ANALYSIS = 10000; // Limit library size for similarity search
const MAX_DIVERSITY_ITERATIONS = 500; // Prevent infinite loops in diversity
const REC_TIME_LIMIT_MS = 200; // 200ms budget for sync calculations
const MAX_RECOMMENDATION_LIMIT = 50; // Max items to return

/**
 * Security Validator
 */
class RecommendationSecurityValidator {
    static validateOptions(options: RecommendationOptions): RecommendationOptions {
        const safeOptions: RecommendationOptions = { ...options };
        
        if (typeof safeOptions.limit === 'number') {
            safeOptions.limit = Math.max(1, Math.min(safeOptions.limit, MAX_RECOMMENDATION_LIMIT));
        } else {
            safeOptions.limit = 10;
        }

        if (typeof safeOptions.minScore === 'number') {
            safeOptions.minScore = Math.max(0, Math.min(safeOptions.minScore, 1));
        }

        if (typeof safeOptions.diversity === 'number') {
            safeOptions.diversity = Math.max(0, Math.min(safeOptions.diversity, 1));
        }

        return safeOptions;
    }

    static validateLibrary(library: Track[]): Track[] {
        if (!Array.isArray(library)) return [];
        // If library is huge, we might want to sample or just truncate for performance safety
        // In a real app we'd use a search index/vector DB, but for in-memory JS, we cap it.
        if (library.length > MAX_LIBRARY_FOR_ANALYSIS) {
            console.warn(`Library too large (${library.length}), analyzing top ${MAX_LIBRARY_FOR_ANALYSIS}`);
            return library.slice(0, MAX_LIBRARY_FOR_ANALYSIS);
        }
        return library;
    }
}

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
    try {
        const safeOptions = RecommendationSecurityValidator.validateOptions(options);
        const {
        limit = 10,
        minScore = 0.3,
        weights,
        diversity = 0.0,
        } = safeOptions;

        const safeLibrary = RecommendationSecurityValidator.validateLibrary(library);

        // Get reference tracks based on context
        const referenceTracks = this.getReferenceTracks(context, safeLibrary);
        if (!referenceTracks || referenceTracks.length === 0) return [];
        
        // Limit references to avoid O(N*M) explosion
        // 5 reference tracks is enough to capture "vibe"
        const limitedRefs = referenceTracks.slice(0, 5);

        const startTime = Date.now();
        const scored: Array<{ track: Track; score: number }> = [];

        for (const candidate of safeLibrary) {
            
            // Time budget check
            if (Date.now() - startTime > REC_TIME_LIMIT_MS) {
                console.warn('Recommendation calculation time budget exceeded, returning partial results');
                break;
            }

            // Skip if it's one of the reference tracks
            if (limitedRefs.some(ref => ref.id === candidate.id)) {
                continue;
            }

            // Calculate average similarity to all reference tracks
            const similarities = limitedRefs.map(ref =>
                this.calculateSimilarity(ref, candidate, weights as typeof DEFAULT_WEIGHTS)
            );
            const avgScore = similarities.reduce((a, b) => a + b, 0) / similarities.length;

            // Strict score check
            if (avgScore >= (minScore || 0.3)) {
                scored.push({ track: candidate, score: avgScore });
            }
        }

        // Sort by score (descending)
        scored.sort((a, b) => b.score - a.score);

        // Apply diversity if requested
        let selected: Array<{ track: Track; score: number }> = [];
        
        if (diversity > 0) {
            selected = this.applyDiversity(scored, diversity, limit!);
        } else {
            selected = scored.slice(0, limit);
        }

        // Convert to Recommendation objects with reasons
        return selected.map(({ track, score }) => ({
        item: track,
        score,
        // Use first ref for reasons for simplicity and speed
        reasons: getSimilarityReasons(limitedRefs[0], track),
        }));
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
    }
  }

  /**
   * ASYNC VERSION: Get recommendations without blocking the main thread
   * Uses batching to yield control periodically - React Native/Expo compatible
   */
  async getRecommendationsAsync(
    context: RecommendationContext,
    library: Track[],
    options: RecommendationOptions = {}
  ): Promise<Recommendation<Track>[]> {
    try {
        const safeOptions = RecommendationSecurityValidator.validateOptions(options);
        const {
        limit = 10,
        minScore = 0.3,
        weights,
        diversity = 0.0,
        } = safeOptions;

        const safeLibrary = RecommendationSecurityValidator.validateLibrary(library);

        // Get reference tracks based on context
        const referenceTracks = this.getReferenceTracks(context, safeLibrary);
        if (!referenceTracks || referenceTracks.length === 0) return [];
        
        const limitedRefs = referenceTracks.slice(0, 5);
        const scored: Array<{ track: Track; score: number }> = [];

        // PERFORMANCE: Process in batches to avoid blocking
        const BATCH_SIZE = 50; // Process 50 tracks at a time
        
        for (let i = 0; i < safeLibrary.length; i += BATCH_SIZE) {
            const batch = safeLibrary.slice(i, i + BATCH_SIZE);
            
            for (const candidate of batch) {
                // Skip if it's one of the reference tracks
                if (limitedRefs.some(ref => ref.id === candidate.id)) {
                    continue;
                }

                // Calculate average similarity to all reference tracks
                const similarities = limitedRefs.map(ref =>
                    this.calculateSimilarity(ref, candidate, weights as typeof DEFAULT_WEIGHTS)
                );
                const avgScore = similarities.reduce((a, b) => a + b, 0) / similarities.length;

                if (avgScore >= (minScore || 0.3)) {
                    scored.push({ track: candidate, score: avgScore });
                }
            }

            // Yield to main thread after each batch (React Native compatible)
            if (i + BATCH_SIZE < safeLibrary.length) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        // Sort by score (descending)
        scored.sort((a, b) => b.score - a.score);

        // Apply diversity if requested
        let selected: Array<{ track: Track; score: number }> = [];
        
        if (diversity > 0) {
            selected = this.applyDiversity(scored, diversity, limit!);
        } else {
            selected = scored.slice(0, limit);
        }

        // Convert to Recommendation objects with reasons
        return selected.map(({ track, score }) => ({
        item: track,
        score,
        reasons: getSimilarityReasons(limitedRefs[0], track),
        }));
    } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
    }
  }

  /**
   * Get reference tracks based on context
   */
  private getReferenceTracks(context: RecommendationContext, library: Track[]): Track[] {
    if (!context || !library) return [];

    try {
        switch (context.type) {
        case 'track':
            return context.track ? [context.track] : [];

        case 'album':
            // Get tracks from library that match this album
            return library.filter(t => t.album === context.album?.title && t.artist === context.album?.artist).slice(0, 20);

        case 'artist':
            // Get tracks from library that match this artist
            return library.filter(t => t.artist === context.artist?.name).slice(0, 20);

        case 'genre':
            if (!context.genre) return [];
            return library.filter(track => {
            const genres = Array.isArray(track.genre)
                ? track.genre
                : track.genre ? [track.genre] : [];
            return genres.some(g => 
                typeof g === 'string' && g.toLowerCase().includes(context.genre.toLowerCase())
            );
            // Limit genre references
            }).slice(0, 50);

        case 'year':
            if (typeof context.year !== 'number') return [];
            return library.filter(track => track.year === context.year).slice(0, 50);

        case 'multi-track':
            return context.tracks?.slice(0, 20) || [];

        default:
            return [];
        }
    } catch (e) {
        console.warn('Error getting reference tracks:', e);
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
    const remaining = [...scored]; // Shallow copy OK

    // Always take the top result
    const first = remaining.shift();
    if(first) selected.push(first);

    let iterations = 0;

    while (selected.length < limit && remaining.length > 0) {
      iterations++;
      if (iterations > MAX_DIVERSITY_ITERATIONS) {
          console.warn('Max diversity iterations reached');
          break;
      }

      // Calculate diversity score for each remaining track
      // Only process top candidates to save time if remaining is huge
      // e.g. only re-rank the next 100 best candidates
      const searchSpace = remaining.slice(0, 100);
      
      const diversityScored = searchSpace.map((candidate, index) => {
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
      if (diversityScored.length > 0) {
        const best = diversityScored[0];
        selected.push(remaining[best.originalIndex]);
        remaining.splice(best.originalIndex, 1);
      } else {
          break;
      }
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
    if (!library || !Array.isArray(library)) return [];
    return this.strategy.getRecommendations(context, library, options);
  }

  /**
   * ASYNC VERSION: Get track recommendations without blocking UI
   * Recommended for React Native and large libraries (>1000 tracks)
   */
  async getTrackRecommendationsAsync(
    context: RecommendationContext,
    library: Track[],
    options?: RecommendationOptions
  ): Promise<Recommendation<Track>[]> {
    if (!library || !Array.isArray(library)) return [];
    
    // Check if strategy supports async (our MetadataRecommendationStrategy does)
    if ('getRecommendationsAsync' in this.strategy && typeof (this.strategy as any).getRecommendationsAsync === 'function') {
      return await (this.strategy as any).getRecommendationsAsync(context, library, options);
    }
    
    // Fallback to sync version (shouldn't happen with our default strategy)
    return this.strategy.getRecommendations(context, library, options);
  }

  /**
   * Get album recommendations based on a track
   */
  getAlbumRecommendations(track: Track, albums: Album[], library: Track[],
    options?: RecommendationOptions
  ): AlbumRecommendation[] {
    if (!track || !albums || !Array.isArray(albums)) return [];

    try {
        const { limit = 10, minScore = 0.4 } = RecommendationSecurityValidator.validateOptions(options || {});

        const scored: Array<{ album: Album; score: number }> = [];
        const startTime = Date.now();

        // Limit albums check
        const safeAlbums = albums.slice(0, 2000); 

        for (const album of safeAlbums) {
             if (Date.now() - startTime > REC_TIME_LIMIT_MS) break;

            // Skip if it's the same album
            if (album.title === track.album) continue;

            // Calculate simple similarity
            // Get sample tracks from library for this album
            const sampleTracks = library.filter((t: Track) => t.album === album.title && t.artist === album.artist).slice(0, 3);
            if (sampleTracks.length === 0) continue;

            const similarities = sampleTracks.map((albumTrack: Track) =>
                this.strategy.calculateSimilarity(track, albumTrack)
            );
            const avgScore = similarities.reduce((a: number, b: number) => a + b, 0) / similarities.length;

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
            description: `Similar to ${track.title || 'current track'}`,
            },
        ],
        }));
    } catch (e) {
        console.error('Error getting album recommendations:', e);
        return [];
    }
  }

  /**
   * Get artist recommendations based on a track
   */
  getArtistRecommendations(track: Track, artists: Artist[], library: Track[],
    options?: RecommendationOptions
  ): ArtistRecommendation[] {
     if (!track || !artists || !Array.isArray(artists)) return [];

     try {
        const { limit = 10, minScore = 0.4 } = RecommendationSecurityValidator.validateOptions(options || {});

        const scored: Array<{ artist: Artist; score: number }> = [];
        const startTime = Date.now();
        const safeArtists = artists.slice(0, 2000);

        for (const artist of safeArtists) {
             if (Date.now() - startTime > REC_TIME_LIMIT_MS) break;

            // Skip if it's the same artist
            const trackArtists = Array.isArray(track.artist)
                ? track.artist
                : track.artist ? [track.artist] : [];
            
            // Safe string comparison
            if (trackArtists.some(a => typeof a === 'string' && a.toLowerCase() === artist.name.toLowerCase())) {
                continue;
            }

            // Calculate average similarity
            // Optimize: Sample max 5 tracks from artist to judge fit
            const artistTracks = library.filter((t: Track) => t.artist === artist.name).slice(0, 5);
            if (artistTracks.length === 0) continue;

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
            description: `Similar style to ${track.artist || 'current artist'}`,
            },
        ],
        }));
    } catch (e) {
        console.error('Error getting artist recommendations:', e);
        return [];
    }
  }

  /**
   * Get recommendations by genre
   */
  getRecommendationsByGenre(
    genre: string,
    library: Track[],
    options?: RecommendationOptions
  ): Recommendation<Track>[] {
    if (typeof genre !== 'string' || !genre) return [];
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
    if (typeof year !== 'number') return [];
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
    if (!strategy) throw new Error('Invalid strategy');
    this.strategy = strategy;
  }
  /**
   * Get hybrid recommendations (AI + Local Fallback)
   * 
   * Attempts to fetch from external source (AI). If that fails or returns empty,
   * falls back to the local strategy.
   * 
   * "Do not break it when it involves not having it active"
   */
  async getHybridRecommendations(
    context: RecommendationContext,
    library: Track[],
    fetcher: ExternalFetcher,
    options: RecommendationOptions = {}
  ): Promise<Recommendation<Track>[]> {
      const { limit = 10, diversity = 0.2 } = options;
      
      try {
          // 1. Prepare Request
          const req: ExternalRecommendationRequest = {
              limit,
              diversity
          };

          if (context.type === 'track') {
              req.track_id = context.track.id;
          } else if (context.type === 'artist') {
             // If we had artist ID in shared Track/Artist types we'd use it.
             // For now, we might skipping generic context mapping if ID is missing or pass context text
             req.context = [`artist:${context.artist.name}`];
          }

          // 2. Fetch from External AI
          const results = await fetcher(req);
          
          if (results && results.length > 0) {
              // 3. Map Results
              const mapped: Recommendation<Track>[] = [];
              
              for (const res of results) {
                  if (res.type === 'track' && res.track) {
                      mapped.push({
                          item: res.track, // AI returned hydrated track
                          score: res.score,
                          reasons: [{
                              type: 'ai',
                              weight: 1.0,
                              description: res.reason || 'AI Recommendation'
                          }]
                      });
                  } else if (res.type === 'track' && res.id) {
                      // Try to hydrate from local library if AI didn't return full object
                      const localTrack = library.find(t => t.id === res.id);
                      if (localTrack) {
                          mapped.push({
                              item: localTrack,
                              score: res.score,
                              reasons: [{
                                  type: 'ai',
                                  weight: 1.0,
                                  description: res.reason || 'AI Recommendation'
                              }]
                          });
                      }
                  }
              }

              if (mapped.length > 0) {
                   return mapped;
              }
          }
      } catch (error) {
          // AI failed or disabled, proceed to fallback transparently
          console.debug('Hybrid strategy fallback (AI likely inactive):', error);
      }

      // 4. Fallback to Local Strategy
      return this.getTrackRecommendationsAsync(context, library, options);
  }

  /**
   * Get comprehensive smart recommendations (Tracks + Albums + Artists)
   * 
   * Unified method that tries AI first for all types, then falls back to local algorithms.
   */
  async getSmartRecommendations(
    context: RecommendationContext,
    libraries: { tracks: Track[], albums: Album[], artists: Artist[] },
    fetcher: ExternalFetcher,
    options: RecommendationOptions = {}
  ): Promise<{
      tracks: Recommendation<Track>[],
      albums: AlbumRecommendation[],
      artists: ArtistRecommendation[]
  }> {
      const { limit = 10, diversity = 0.2 } = options;
      
      // 1. Prepare Request (Same as hybrid)
      const req: ExternalRecommendationRequest = {
          limit,
          diversity,
          weights: options.weights ? {
              audio: options.weights.audio || 1.0,
              lyrics: options.weights.lyrics || 0.0,
              visual: options.weights.visual || 0.0,
              stems: options.weights.stems || 0.0,
          } : undefined
      };

      if (context.type === 'track') {
          req.track_id = context.track.id;
      } else if (context.type === 'artist') {
         req.context = [`artist:${context.artist.name}`];
      }

      try {
           // 2. Fetch from External AI
          const results = await fetcher(req);

          if (results && results.length > 0) {
              const tracks: Recommendation<Track>[] = [];
              const albums: AlbumRecommendation[] = [];
              const artists: ArtistRecommendation[] = [];

              for (const res of results) {
                  const score = res.score || 0.8;
                  const reasonObj: RecommendationReason = {
                      type: 'ai',
                      weight: 1.0,
                      description: res.reason || 'AI Insight'
                  };

                  if (res.type === 'track') {
                       if (res.track) {
                           tracks.push({ item: res.track, score, reasons: [reasonObj] });
                       } else if (res.id) {
                           const local = libraries.tracks.find(t => t.id === res.id);
                           if (local) tracks.push({ item: local, score, reasons: [reasonObj] });
                       }
                  } 
                  else if (res.type === 'album') {
                      if (res.album) {
                           albums.push({ item: res.album, score, reasons: [reasonObj] });
                      } else if (res.id) {
                           const local = libraries.albums.find(a => a.id === res.id);
                           if (local) albums.push({ item: local, score, reasons: [reasonObj] });
                      }
                  }
                  else if (res.type === 'artist') {
                      if (res.artist) {
                           artists.push({ item: res.artist, score, reasons: [reasonObj] });
                      } else if (res.id) {
                           const local = libraries.artists.find(a => a.id === res.id);
                           if (local) artists.push({ item: local, score, reasons: [reasonObj] });
                      }
                  }
              }

              // Return if we found anything meaningful
              if (tracks.length > 0 || albums.length > 0 || artists.length > 0) {
                  return { tracks, albums, artists };
              }
          }

      } catch (error) {
          console.debug('Smart recommendations fallback (AI inactive):', error);
      }

      // 3. Fallback: Calculate locally
      // We run these in parallel for speed
      const [tracks, albums, artists] = await Promise.all([
          this.getTrackRecommendationsAsync(context, libraries.tracks, options),
          // For albums/artists, we only support 'track' context fallback properly in the current engine
          // If context is track, use it.
          context.type === 'track' ? Promise.resolve(this.getAlbumRecommendations(context.track, libraries.albums, libraries.tracks, options)) : Promise.resolve([]),
          context.type === 'track' ? Promise.resolve(this.getArtistRecommendations(context.track, libraries.artists, libraries.tracks, options)) : Promise.resolve([])
      ]);

      return { tracks, albums, artists };
  }
}

