import { useState, useEffect } from "react";
import { useQueueStore } from "@sonantica/player-core";
import { useLibraryStore } from "@sonantica/media-library";
import { RecommendationEngine } from "@sonantica/recommendations";
import type { Recommendation, AlbumRecommendation, ArtistRecommendation } from "@sonantica/recommendations";
import { PluginService } from "../services/PluginService";
import type { Track } from "@sonantica/shared";

interface SmartRecommendationsResult {
  trackRecommendations: Recommendation<Track>[];
  albumRecommendations: AlbumRecommendation[];
  artistRecommendations: ArtistRecommendation[];
  isAI: boolean;
  isLoading: boolean;
}

export function useSmartRecommendations({ diversity = 0.2 }: { diversity?: number } = {}): SmartRecommendationsResult {
  const [results, setResults] = useState<{
      tracks: Recommendation<Track>[];
      albums: AlbumRecommendation[];
      artists: ArtistRecommendation[];
  }>({ tracks: [], albums: [], artists: [] });

  const [isLoading, setIsLoading] = useState(false);
  const [isAI, setIsAI] = useState(false);

  // Store selections
  const currentMediaSource = useQueueStore((s) => s.queue[s.currentIndex]);
  const tracks = useLibraryStore((s) => s.tracks);
  const albums = useLibraryStore((s) => s.albums);
  const artists = useLibraryStore((s) => s.artists);

  useEffect(() => {
    let isMounted = true;

    const fetchSmart = async () => {
      if (!currentMediaSource) {
          if(isMounted) {
             setResults({ tracks: [], albums: [], artists: [] });
             setIsAI(false);
          }
          return;
      }
      
      // Find current track object
      const currentTrack = tracks.find(t => t.id === currentMediaSource.id);
      if (!currentTrack) return;

      setIsLoading(true);

      try {
        const engine = new RecommendationEngine();
        
        // Use the engine's smart method which handles AI + Fallback internally
        const smartResults = await engine.getSmartRecommendations(
            { type: 'track', track: currentTrack },
            { tracks, albums, artists },
            (req: any) => PluginService.getRecommendations(req), // Fetcher adapter
            { diversity, limit: 10 }
        );

        if (isMounted) {
            setResults(smartResults);
            
            // Check if we got AI results by looking at reasons
            const hasAI = smartResults.tracks.some((t: Recommendation<Track>) => t.reasons.some((r: any) => r.type === 'ai'));
            setIsAI(hasAI);
        }
      } catch (err) {
          console.error("Smart recommendations failed completely:", err);
          // Should not happen as engine handles fallback, but safety net
          if (isMounted) setResults({ tracks: [], albums: [], artists: [] });
      } finally {
          if (isMounted) setIsLoading(false);
      }
    };

    fetchSmart();

    return () => { isMounted = false; };
  }, [currentMediaSource, tracks, albums, artists, diversity]);

  return {
    trackRecommendations: results.tracks,
    albumRecommendations: results.albums,
    artistRecommendations: results.artists,
    isAI,
    isLoading
  };
}
