import { useState, useEffect } from "react";
import { useQueueStore } from "@sonantica/player-core";
import { useLibraryStore } from "@sonantica/media-library";
import { useQueueRecommendations } from "@sonantica/recommendations";
import { PluginService } from "../services/PluginService";
import type { Track } from "@sonantica/shared";

interface SmartRecommendationsResult {
  trackRecommendations: { item: Track; reasons: string[]; score?: number }[];
  albumRecommendations: any[];
  artistRecommendations: any[];
  isAI: boolean;
}

export function useSmartRecommendations(): SmartRecommendationsResult {
  // Client-side fallback
  const { trackRecommendations: clientTracksRaw, albumRecommendations, artistRecommendations } = useQueueRecommendations({
    limit: 10,
    minScore: 0.3,
    diversity: 0.2, // Default diversity
  });

  // Map client tracks to match our interface
  const clientTracks = clientTracksRaw.map(rec => ({
    item: rec.item,
    reasons: rec.reasons.map(r => String(r)), // Convert reasons to strings
    score: rec.score
  }));

  const [aiTracks, setAiTracks] = useState<{ item: Track; reasons: string[]; score?: number }[] | null>(null);
  const currentMediaSource = useQueueStore((s) => s.queue[s.currentIndex]);
  const tracks = useLibraryStore((s) => s.tracks);

  useEffect(() => {
    let isMounted = true;

    const fetchAI = async () => {
      if (!currentMediaSource) return;
      
      try {
        // Check local track ID
        const currentTrack = tracks.find(t => t.id === currentMediaSource.id);
        if (!currentTrack) return;

        // Try to fetch from AI
        const recs = await PluginService.getRecommendations({
          track_id: currentTrack.id,
          limit: 10
        });

        if (isMounted && recs && recs.length > 0) {
            const mapped = recs
                .filter(r => r.track) // Ensure hydrated
                .map(r => ({
                    item: r.track,
                    reasons: [r.reason || "AI Logic"],
                    score: r.score
                }));
            setAiTracks(mapped);
        } else {
            setAiTracks(null);
        }
      } catch (err) {
        // Fallback silently
        if (isMounted) setAiTracks(null);
      }
    };

    fetchAI();

    return () => { isMounted = false; };
  }, [currentMediaSource, tracks]);

  return {
    trackRecommendations: aiTracks || clientTracks,
    albumRecommendations, // For now keep client side as AI endpoint only hydrates tracks currently
    artistRecommendations,
    isAI: !!aiTracks
  };
}
