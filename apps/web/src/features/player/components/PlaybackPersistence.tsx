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
const STORE_TRACKS = "library_tracks";
const STORE_ARTWORK = "library_artwork";
const DB_VERSION = 2; // Incremented for new store

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS);
      }
      if (!db.objectStoreNames.contains(STORE_ARTWORK)) {
        db.createObjectStore(STORE_ARTWORK);
      }
    };
  });
}

async function saveLibraryToDB(tracks: any[]) {
  const db = await openDB();
  const tx = db.transaction([STORE_TRACKS, STORE_ARTWORK], "readwrite");

  // 1. Save tracks (thinned but keeping link to album)
  const trackStore = tx.objectStore(STORE_TRACKS);

  // 2. Extract and deduplicate artwork
  const artStore = tx.objectStore(STORE_ARTWORK);
  const processedAlbums = new Set<string>();

  const minimalTracks = tracks.map((t) => {
    const albumKey = `${t.metadata?.artist} - ${t.metadata?.album}`;

    if (t.metadata?.coverArt && !processedAlbums.has(albumKey)) {
      artStore.put(t.metadata.coverArt, albumKey);
      processedAlbums.add(albumKey);
    }

    return {
      ...t,
      metadata: {
        ...t.metadata,
        coverArt: undefined, // Remove from track to save space, will be re-hydrated
      },
    };
  });

  trackStore.put(minimalTracks, "all_tracks");

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function loadLibraryFromDB(): Promise<any[]> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORE_TRACKS, STORE_ARTWORK], "readonly");

    const trackStore = tx.objectStore(STORE_TRACKS);
    const artStore = tx.objectStore(STORE_ARTWORK);

    const requestToPromise = (req: IDBRequest) =>
      new Promise((res, rej) => {
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });

    const tracks =
      ((await requestToPromise(trackStore.get("all_tracks"))) as any[]) || [];
    if (tracks.length === 0) return [];

    // Load both artwork and keys concurrently
    const [artworks, keys] = (await Promise.all([
      requestToPromise(artStore.getAll()),
      requestToPromise(artStore.getAllKeys()),
    ])) as [any[], any[]];

    const artMap = new Map();
    keys.forEach((key, i) => artMap.set(key, artworks[i]));

    // Re-hydrate tracks
    return tracks.map((t) => {
      const albumKey = `${t.metadata?.artist} - ${t.metadata?.album}`;
      const coverArt = artMap.get(albumKey);
      if (coverArt) {
        return {
          ...t,
          metadata: { ...t.metadata, coverArt },
        };
      }
      return t;
    });
  } catch (e) {
    console.warn("⚠️ [Persistence] Failed to load from IndexedDB:", e);
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

          // B. Save library (tracks + deduplicated artwork) to IndexedDB
          await saveLibraryToDB(data.tracks);
          console.log(
            "💾 [Persistence] Library index and artwork saved to IndexedDB"
          );
        } catch (e) {
          console.error("❌ [Persistence] Failed to save library state:", e);
        }
      });

      setLibraryOnLoad(async () => {
        try {
          const statsSaved = localStorage.getItem(STORAGE_KEYS.LIBRARY_STATS);
          const tracks = await loadLibraryFromDB();

          if (tracks.length > 0) {
            console.log(
              "📖 [Persistence] Restoring library index and artwork from IndexedDB:",
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
