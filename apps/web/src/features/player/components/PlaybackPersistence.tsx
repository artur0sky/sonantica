/**
 * Playback Persistence Component
 *
 * Handles saving and loading player/queue state to localStorage.
 * "user decisions are preserved."
 */

import { useEffect } from "react";
import { usePlayerStore, useQueueStore } from "@sonantica/player-core";
import { useLibraryStore } from "@sonantica/media-library";

const STORAGE_KEYS = {
  PLAYER: "sonantica_player_state",
  QUEUE: "sonantica_queue_state",
  LIBRARY: "sonantica_library_state",
};

export function PlaybackPersistence() {
  const { setOnSave: setPlayerOnSave, setOnLoad: setPlayerOnLoad } =
    usePlayerStore();
  const { setOnSave: setQueueOnSave, setOnLoad: setQueueOnLoad } =
    useQueueStore();
  const { setOnSave: setLibraryOnSave, setOnLoad: setLibraryOnLoad } =
    useLibraryStore();

  useEffect(() => {
    // 1. Setup Player Persistence
    setPlayerOnSave(async (data) => {
      try {
        localStorage.setItem(
          STORAGE_KEYS.PLAYER,
          JSON.stringify({
            currentTrack: data.currentTrack,
            currentTime: data.currentTime,
            volume: data.volume,
          })
        );
      } catch (e) {
        console.warn("⚠️ [Persistence] Failed to save player state:", e);
      }
    });

    setPlayerOnLoad(async () => {
      const saved = localStorage.getItem(STORAGE_KEYS.PLAYER);
      return saved ? JSON.parse(saved) : null;
    });

    // 2. Setup Queue Persistence
    setQueueOnSave(async (data) => {
      try {
        /**
         * "User autonomy" doesn't mean "User has infinite storage".
         * localStorage is limited (usually 5MB). Large queues with embedded coverArt
         * (base64) will crash persistence with QuotaExceededError.
         * We strip heavy metadata before saving.
         */
        const thinQueue = (tracks: any[]) =>
          tracks.map((t) => ({
            id: t.id,
            url: t.url,
            mimeType: t.mimeType,
            metadata: {
              title: t.metadata?.title,
              artist: t.metadata?.artist,
              album: t.metadata?.album,
              duration: t.metadata?.duration,
              // coverArt IS STRIPPED (it's often huge base64)
            },
          }));

        console.log(
          "💾 [Persistence] Saving thinned queue state:",
          data.queue.length,
          "tracks"
        );

        localStorage.setItem(
          STORAGE_KEYS.QUEUE,
          JSON.stringify({
            queue: thinQueue(data.queue),
            currentIndex: data.currentIndex,
            isShuffled: data.isShuffled,
            originalQueue: thinQueue(data.originalQueue || []),
            repeatMode: data.repeatMode,
          })
        );
      } catch (e) {
        if (e instanceof Error && e.name === "QuotaExceededError") {
          console.error(
            "❌ [Persistence] Storage quota exceeded. Queue too large."
          );
        } else {
          console.warn("⚠️ [Persistence] Failed to save queue state:", e);
        }
      }
    });

    setQueueOnLoad(async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.QUEUE);
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log(
            "📖 [Persistence] Loaded queue:",
            parsed.queue?.length,
            "tracks"
          );
          return parsed;
        }
      } catch (e) {
        console.warn("⚠️ [Persistence] Failed to load queue state:", e);
      }
      return null;
    });

    // 3. Setup Library Persistence
    setLibraryOnSave(async (data) => {
      try {
        /**
         * Aggressive thinning for library index.
         * 3000+ tracks will exceed localStorage (5MB) if we're not careful.
         * We strip everything except what's needed for the UI lists and playback.
         */
        const minimalTracks = data.tracks.map((t) => ({
          id: t.id,
          path: t.path,
          // Optimization: Only keep core metadata strings
          metadata: {
            title: t.metadata?.title,
            artist: t.metadata?.artist,
            album: t.metadata?.album,
            duration: t.metadata?.duration,
            trackNumber: t.metadata?.trackNumber,
            // coverArt is RE-HYDRATED during runtime from scan or other sources
          },
        }));

        localStorage.setItem(
          STORAGE_KEYS.LIBRARY,
          JSON.stringify({
            tracks: minimalTracks,
            stats: data.stats,
          })
        );
      } catch (e) {
        if (e instanceof Error && e.name === "QuotaExceededError") {
          console.error(
            "❌ [Persistence] Library quota exceeded. Index too large for localStorage."
          );
        } else {
          console.warn("⚠️ [Persistence] Failed to save library state:", e);
        }
      }
    });

    setLibraryOnLoad(async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.LIBRARY);
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log(
            "📖 [Persistence] Restoring library index:",
            parsed.tracks?.length,
            "tracks"
          );
          return parsed;
        }
      } catch (e) {
        console.warn("⚠️ [Persistence] Failed to load library state:", e);
      }
      return null;
    });
  }, [
    setPlayerOnSave,
    setPlayerOnLoad,
    setQueueOnSave,
    setQueueOnLoad,
    setLibraryOnSave,
    setLibraryOnLoad,
  ]);

  return null; // Headless component
}
