import { useEffect } from "react";
import { usePlayerStore, useQueueStore } from "@sonantica/player-core";

const STORAGE_KEYS = {
  PLAYER: "sonantica_player_state",
  QUEUE: "sonantica_queue_state",
};

/**
 * Playback Persistence Component
 *
 * Handles persistence of player and queue state.
 * Library persistence is now handled by server-side storage.
 */
export function PlaybackPersistence() {
  const { setOnSave: setPlayerOnSave, setOnLoad: setPlayerOnLoad } =
    usePlayerStore();
  const { setOnSave: setQueueOnSave, setOnLoad: setQueueOnLoad } =
    useQueueStore();

  useEffect(() => {
    const setupPersistence = async () => {
      // 1. Setup Player Persistence (localStorage is fine for small state)
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
          const thinQueue = (tracks: any[]) =>
            tracks.map((t) => ({
              id: t.id,
              url: t.url,
              mimeType: t.mimeType,
              metadata: {
                title: t.metadata?.title || t.title,
                artist: t.metadata?.artist || t.artist,
                album: t.metadata?.album || t.album,
                duration: t.metadata?.duration || t.duration,
              },
            }));

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
          console.warn("⚠️ [Persistence] Failed to save queue state:", e);
        }
      });

      setQueueOnLoad(async () => {
        try {
          const saved = localStorage.getItem(STORAGE_KEYS.QUEUE);
          if (saved) return JSON.parse(saved);
        } catch (e) {
          console.warn("⚠️ [Persistence] Failed to load queue state:", e);
        }
        return null;
      });

      console.log("✅ [Persistence] Player and queue persistence initialized");
    };

    setupPersistence();
  }, [setPlayerOnSave, setPlayerOnLoad, setQueueOnSave, setQueueOnLoad]);

  return null;
}
