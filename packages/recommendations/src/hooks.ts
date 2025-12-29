/**
 * Recommendation Hooks
 * 
 * React hooks for using the recommendation engine.
 * Integrates with media library and queue.
 */

import { useMemo } from 'react';
import { useLibraryStore } from '@sonantica/media-library';
import { useQueueStore } from '@sonantica/player-core';
import type { Track, Album, Artist } from '@sonantica/media-library';
import { RecommendationEngine } from './RecommendationEngine';
import type { Recommendation, RecommendationOptions, AlbumRecommendation, ArtistRecommendation } from './types';

/**
 * Hook to get track recommendations based on current track
 */
export function useTrackRecommendations(
  track: Track | null,
  options?: RecommendationOptions
): Recommendation<Track>[] {
  const tracks = useLibraryStore((s) => s.tracks);
  const queue = useQueueStore((s) => s.queue);

  return useMemo(() => {
    if (!track) return [];

    const engine = new RecommendationEngine();
    const recommendations = engine.getTrackRecommendations(
      { type: 'track', track },
      tracks,
      {
        ...options,
        excludeQueued: options?.excludeQueued ?? true,
      }
    );

    // Filter out queued tracks if requested
    if (options?.excludeQueued) {
      const queuedIds = new Set(queue.map(t => t.id));
      return recommendations.filter(rec => !queuedIds.has(rec.item.id));
    }

    return recommendations;
  }, [track, tracks, queue, options]);
}

/**
 * Hook to get album recommendations based on current track
 */
export function useAlbumRecommendations(
  track: Track | null,
  options?: RecommendationOptions
): AlbumRecommendation[] {
  const albums = useLibraryStore((s) => s.albums);

  return useMemo(() => {
    if (!track) return [];

    const engine = new RecommendationEngine();
    const tracks = useLibraryStore.getState().tracks;
    return engine.getAlbumRecommendations(track, albums, tracks, options);
  }, [track, albums, options]);
}

/**
 * Hook to get artist recommendations based on current track
 */
export function useArtistRecommendations(
  track: Track | null,
  options?: RecommendationOptions
): ArtistRecommendation[] {
  const artists = useLibraryStore((s) => s.artists);

  return useMemo(() => {
    if (!track) return [];

    const engine = new RecommendationEngine();
    const tracks = useLibraryStore.getState().tracks;
    return engine.getArtistRecommendations(track, artists, tracks, options);
  }, [track, artists, options]);
}

/**
 * Hook to get recommendations for a specific album
 */
export function useAlbumSimilarAlbums(
  album: Album | null,
  options?: RecommendationOptions
): AlbumRecommendation[] {
  const albums = useLibraryStore((s) => s.albums);
  const tracks = useLibraryStore((s) => s.tracks);

  return useMemo(() => {
    // Get tracks for this album from library
    const albumTracks = tracks.filter(t => t.album === album?.title && t.artist === album?.artist);
    if (!album || albumTracks.length === 0) return [];

    const engine = new RecommendationEngine();
    
    // Use first track as reference
    const referenceTrack = albumTracks[0];
    return engine.getAlbumRecommendations(referenceTrack, albums, tracks, options);
  }, [album, albums, tracks, options]);
}

/**
 * Hook to get similar artists for a specific artist
 */
export function useArtistSimilarArtists(
  artist: Artist | null,
  options?: RecommendationOptions
): ArtistRecommendation[] {
  const artists = useLibraryStore((s) => s.artists);
  const tracks = useLibraryStore((s) => s.tracks);

  return useMemo(() => {
    // Get tracks for this artist from library
    const artistTracks = tracks.filter(t => t.artist === artist?.name);
    if (!artist || artistTracks.length === 0) return [];

    const engine = new RecommendationEngine();
    
    // Use first track as reference
    const referenceTrack = artistTracks[0];
    if (!referenceTrack) return [];

    return engine.getArtistRecommendations(referenceTrack, artists, tracks, options);
  }, [artist, artists, tracks, options]);
}

/**
 * Hook to get recommendations by genre
 */
export function useGenreRecommendations(
  genre: string | null,
  options?: RecommendationOptions
): Recommendation<Track>[] {
  const tracks = useLibraryStore((s) => s.tracks);

  return useMemo(() => {
    if (!genre) return [];

    const engine = new RecommendationEngine();
    return engine.getRecommendationsByGenre(genre, tracks, options);
  }, [genre, tracks, options]);
}

/**
 * Hook to get recommendations by year
 */
export function useYearRecommendations(
  year: number | null,
  options?: RecommendationOptions
): Recommendation<Track>[] {
  const tracks = useLibraryStore((s) => s.tracks);

  return useMemo(() => {
    if (!year) return [];

    const engine = new RecommendationEngine();
    return engine.getRecommendationsByYear(year, tracks, options);
  }, [year, tracks, options]);
}

/**
 * Hook to get dynamic recommendations for queue
 * Based on current playing track
 */
export function useQueueRecommendations(
  options?: RecommendationOptions
): {
  trackRecommendations: Recommendation<Track>[];
  albumRecommendations: AlbumRecommendation[];
  artistRecommendations: ArtistRecommendation[];
} {
  const currentMediaSource = useQueueStore((s) => s.queue[s.currentIndex]);
  const tracks = useLibraryStore((s) => s.tracks);
  
  // Find the full Track object from library
  const currentTrack = useMemo(() => {
    if (!currentMediaSource) return null;
    return tracks.find(t => t.id === currentMediaSource.id) || null;
  }, [currentMediaSource, tracks]);
  
  const trackRecommendations = useTrackRecommendations(currentTrack, {
    limit: 5,
    minScore: 0.4,
    diversity: 0.2,
    ...options,
  });

  const albumRecommendations = useAlbumRecommendations(currentTrack, {
    limit: 3,
    minScore: 0.5,
    ...options,
  });

  const artistRecommendations = useArtistRecommendations(currentTrack, {
    limit: 3,
    minScore: 0.5,
    ...options,
  });

  return {
    trackRecommendations,
    albumRecommendations,
    artistRecommendations,
  };
}
