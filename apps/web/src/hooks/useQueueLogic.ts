import { useState, useRef, useEffect, useMemo } from "react";
import { usePlayerStore, useQueueStore } from "@sonantica/player-core";
import { useLibraryStore } from "@sonantica/media-library";
import { useUIStore } from "@sonantica/ui";
import { useOfflineStore } from "@sonantica/offline-manager";
import { useSettingsStore } from "../stores/settingsStore";
import { OfflineStatus } from "@sonantica/shared";

export function useQueueLogic() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const { loadTrack, play } = usePlayerStore();
  const { toggleQueue } = useUIStore();
  const {
    getRemainingTracks,
    clearQueue,
    reorderUpcoming,
    queue: fullQueue,
    currentIndex,
  } = useQueueStore();
  const libraryTracks = useLibraryStore((s) => s.tracks);

  const { offlineMode, hideUnavailableOffline } = useSettingsStore();
  const offlineItems = useOfflineStore((state: any) => state.items);

  const upcomingQueue = useMemo(() => {
    const remaining = getRemainingTracks();
    if (offlineMode && hideUnavailableOffline) {
      return remaining.filter((track: any) => 
        offlineItems[track.id]?.status === OfflineStatus.COMPLETED
      );
    }
    return remaining;
  }, [getRemainingTracks, offlineMode, hideUnavailableOffline, offlineItems]);

  // Infinite Scroll State
  const [displayedCount, setDisplayedCount] = useState(50);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayedCount((prev) =>
            Math.min(prev + 50, upcomingQueue.length)
          );
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [upcomingQueue.length]);

  const visibleQueue = useMemo(
    () => upcomingQueue.slice(0, displayedCount),
    [upcomingQueue, displayedCount]
  );

  const handleReorder = (newVisibleQueue: any[]) => {
    // Merge reordered visible tracks with the rest of the upcoming tracks
    const remaining = upcomingQueue.slice(displayedCount);
    reorderUpcoming([...newVisibleQueue, ...remaining]);
  };

  const getExtension = (url: string): string => {
    try {
      const filename = url.split("/").pop() || "";
      const parts = filename.split(".");
      if (parts.length > 1) {
        const ext = parts.pop();
        return ext ? ext.toUpperCase() : "AUDIO";
      }
      return "AUDIO";
    } catch {
      return "AUDIO";
    }
  };

  const getBadgeClass = (ext: string) => {
    if (ext === "FLAC")
      return "bg-[#C0C0C0] text-black border-none ring-1 ring-white/20 shadow-[0_0_10px_rgba(192,192,192,0.3)]";
    if (ext === "WAV")
      return "bg-[#FFD700] text-black border-none ring-1 ring-white/20 shadow-[0_0_10px_rgba(255,215,0,0.3)]";
    return "";
  };

  async function handlePlay(track: any) {
    const queueStore = useQueueStore.getState();
    const absoluteIndex = queueStore.queue.findIndex(
      (t, idx) => idx > queueStore.currentIndex && t.id === track.id
    );

    if (absoluteIndex !== -1) {
      queueStore.jumpTo(absoluteIndex);
      await loadTrack(track);
      await play();
    }
  }

  function handleRemove(trackId: string) {
    const queueStore = useQueueStore.getState();
    const absoluteIndex = queueStore.queue.findIndex(
      (t, idx) => idx > queueStore.currentIndex && t.id === trackId
    );

    if (absoluteIndex !== -1) {
      queueStore.removeFromQueue(absoluteIndex);
    }
  }

  return {
    currentTrack,
    toggleQueue,
    fullQueue,
    currentIndex,
    upcomingQueue,
    libraryTracks,
    displayedCount,
    observerTarget,
    visibleQueue,
    handleReorder,
    getExtension,
    getBadgeClass,
    clearQueue,
    handlePlay,
    handleRemove
  };
}
