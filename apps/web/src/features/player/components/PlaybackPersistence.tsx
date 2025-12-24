import { useEffect } from "react";
import { usePlayerStore, useQueueStore } from "@sonantica/player-core";
import { useLibraryStore } from "@sonantica/media-library";

const STORAGE_KEYS = {
  PLAYER: "sonantica_player_state",
  QUEUE: "sonantica_queue_state",
  LIBRARY_STATS: "sonantica_library_stats",
};

// --- IndexedDB Helper for Large Data (Library Tracks) ---
const DB_NAME = "sonantica_db";
const STORE_NAME = "library_tracks";
const DB_VERSION = 1;

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function saveTracksToDB(tracks: any[]) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await store.put(tracks, "all_tracks");
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function loadTracksFromDB(): Promise<any[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get("all_tracks");
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("⚠️ [Persistence] Failed to load tracks from IndexedDB:", e);
    return [];
  }
}

export function PlaybackPersistence() {
  const { setOnSave: setPlayerOnSave, setOnLoad: setPlayerOnLoad } =
    usePlayerStore();
  const { setOnSave: setQueueOnSave, setOnLoad: setQueueOnLoad } =
    useQueueStore();
  const {
    setOnSave: setLibraryOnSave,
    setOnLoad: setLibraryOnLoad,
    _initialize: initLibrary,
    scan,
  } = useLibraryStore();

  useEffect(() => {
    let isInitialized = false;

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
                title: t.metadata?.title,
                artist: t.metadata?.artist,
                album: t.metadata?.album,
                duration: t.metadata?.duration,
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

      // 3. Setup Library Persistence (IndexedDB for Tracks, localStorage for Stats)
      setLibraryOnSave(async (data) => {
        try {
          // A. Save Stats to localStorage
          localStorage.setItem(
            STORAGE_KEYS.LIBRARY_STATS,
            JSON.stringify(data.stats)
          );

          // B. Save tracks to IndexedDB (high capacity)
          // Aggressive thinning to keep DB size manageable
          const minimalTracks = data.tracks.map((t) => ({
            id: t.id,
            path: t.path,
            mimeType: t.mimeType,
            size: t.size,
            metadata: {
              title: t.metadata?.title,
              artist: t.metadata?.artist,
              album: t.metadata?.album,
              duration: t.metadata?.duration,
              year: t.metadata?.year,
              trackNumber: t.metadata?.trackNumber,
              genre: t.metadata?.genre,
            },
            addedAt: t.addedAt,
            lastModified: t.lastModified,
          }));

          await saveTracksToDB(minimalTracks);
          console.log("💾 [Persistence] Library index saved to IndexedDB");
        } catch (e) {
          console.error("❌ [Persistence] Failed to save library state:", e);
        }
      });

      setLibraryOnLoad(async () => {
        try {
          const statsSaved = localStorage.getItem(STORAGE_KEYS.LIBRARY_STATS);
          const tracks = await loadTracksFromDB();

          if (tracks.length > 0) {
            console.log(
              "📖 [Persistence] Restoring library index from IndexedDB:",
              tracks.length,
              "tracks"
            );
            return {
              tracks,
              stats: statsSaved
                ? JSON.parse(statsSaved)
                : { totalTracks: tracks.length },
            };
          }
        } catch (e) {
          console.warn("⚠️ [Persistence] Failed to load library state:", e);
        }
        return null;
      });

      // 4. Initialize Store
      if (!isInitialized) {
        console.log("🛠️ [Persistence] Initializing library store...");
        await initLibrary();
        isInitialized = true;

        // After restoration, trigger a non-destructive scan to catch changes
        // Use a small delay to not block the main UI thread immediately
        setTimeout(() => {
          console.log("🔍 [Persistence] Triggering background refresh scan...");
          scan(["/media/"]);
        }, 2000);
      }
    };

    setupPersistence();
  }, [
    setPlayerOnSave,
    setPlayerOnLoad,
    setQueueOnSave,
    setQueueOnLoad,
    setLibraryOnSave,
    setLibraryOnLoad,
    initLibrary,
    scan,
  ]);

  return null;
}
