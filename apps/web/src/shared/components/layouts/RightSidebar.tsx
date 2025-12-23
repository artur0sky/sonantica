/**
 * Right Sidebar - Queue
 *
 * Playback queue management.
 * Shows current track and upcoming tracks.
 */

import {
  IconX,
  IconTrash,
  IconMusic,
  IconActivity,
  IconGripVertical,
  IconPlayerPlay,
} from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  Reorder,
  useDragControls,
} from "framer-motion";
import type { Variants } from "framer-motion";
import { useState, useRef, useEffect, useMemo } from "react";
import { usePlayerStore } from "../../store/playerStore";
import { useQueueStore } from "../../store/queueStore";
import { useUIStore } from "../../store/uiStore";
import { Button, Badge } from "../atoms";
import { formatArtists } from "../../utils/metadata";
import { formatTime } from "@sonantica/shared";
import { cn } from "../../utils/cn";

const itemVariants: Variants = {
  hidden: { x: 20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    x: -20,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export function RightSidebar() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const { loadTrack, play } = usePlayerStore();
  const { toggleQueue } = useUIStore();
  const { getRemainingTracks, clearQueue, reorderUpcoming } = useQueueStore();

  const queue = getRemainingTracks();

  // Infinite Scroll State
  const [displayedCount, setDisplayedCount] = useState(50);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayedCount((prev) => Math.min(prev + 50, queue.length));
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [queue.length]);

  const visibleQueue = useMemo(
    () => queue.slice(0, displayedCount),
    [queue, displayedCount]
  );

  const handleReorder = (newVisibleQueue: any[]) => {
    // Merge reordered visible tracks with the rest of the upcoming tracks
    const remaining = queue.slice(displayedCount);
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

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold">Queue</h2>
        <motion.button
          onClick={toggleQueue}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="text-text-muted hover:text-text transition-fast"
          aria-label="Close queue"
        >
          <IconX size={20} stroke={1.5} />
        </motion.button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Now Playing */}
        <AnimatePresence mode="wait">
          {currentTrack && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mb-6"
            >
              <h3 className="text-sm text-text-muted mb-3 uppercase tracking-wide">
                Now Playing
              </h3>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-surface-elevated p-4 rounded-md border border-accent"
              >
                <div className="flex items-center gap-3">
                  {/* Album Art */}
                  <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-surface border border-border relative">
                    {currentTrack.metadata?.coverArt ? (
                      <img
                        src={currentTrack.metadata.coverArt}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IconMusic
                          size={20}
                          className="text-text-muted/30"
                          stroke={1.5}
                        />
                      </div>
                    )}
                    {/* Playing indicator */}
                    <div className="absolute inset-0 bg-accent/10 animate-pulse" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {currentTrack.metadata?.title || "Unknown Title"}
                    </div>
                    <div className="text-sm text-text-muted truncate">
                      {formatArtists(currentTrack.metadata?.artist)}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Queue List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-text-muted uppercase tracking-wide">
              Next Up
            </h3>
            {queue.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearQueue}>
                <IconTrash size={16} stroke={1.5} />
                <span className="ml-1">Clear</span>
              </Button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {queue.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <p className="text-text-muted text-sm">No tracks in queue</p>
                <p className="text-text-muted text-xs mt-2">
                  Tracks will appear here when you play them
                </p>
              </motion.div>
            ) : (
              <Reorder.Group
                axis="y"
                values={visibleQueue}
                onReorder={handleReorder}
                className="space-y-1"
              >
                {visibleQueue.map((track, index) => (
                  <QueueItem
                    key={track.id}
                    track={track}
                    onPlay={async () => {
                      const queueStore = useQueueStore.getState();
                      queueStore.jumpTo(queueStore.currentIndex + index + 1);
                      await loadTrack(track);
                      await play();
                    }}
                    getExtension={getExtension}
                    getBadgeClass={getBadgeClass}
                  />
                ))}
                {/* Sentinel */}
                {displayedCount < queue.length && (
                  <div ref={observerTarget} className="py-2 h-4" />
                )}
              </Reorder.Group>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

interface QueueItemProps {
  track: any;
  onPlay: () => void;
  getExtension: (url: string) => string;
  getBadgeClass: (ext: string) => string;
}

function QueueItem({
  track,
  onPlay,
  getExtension,
  getBadgeClass,
}: QueueItemProps) {
  const dragControls = useDragControls();
  const ext = getExtension(track.url);

  return (
    <Reorder.Item
      value={track}
      dragListener={false}
      dragControls={dragControls}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileDrag={{
        scale: 1.02,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        zIndex: 50,
      }}
      transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
      className="group relative flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-white/5 border border-transparent hover:border-white/5"
    >
      {/* Drag Handle */}
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="w-6 h-10 flex items-center justify-center text-text-muted/20 group-hover:text-text-muted/60 cursor-grab active:cursor-grabbing transition-colors"
      >
        <IconGripVertical size={18} stroke={1.5} />
      </div>

      {/* Album Art Thumbnail */}
      <div
        className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-surface border border-border group-hover:border-accent/40 transition-all relative"
        onClick={onPlay}
      >
        {track.metadata?.coverArt ? (
          <img
            src={track.metadata.coverArt}
            alt="Cover"
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IconMusic size={16} className="text-text-muted/30" stroke={1.5} />
          </div>
        )}
        {/* Play Icon on Hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
          <IconPlayerPlay size={18} className="text-white fill-current" />
        </div>
      </div>

      <div className="min-w-0 flex-1 cursor-pointer" onClick={onPlay}>
        <div className="font-medium truncate text-sm group-hover:text-accent transition-colors">
          {track.metadata?.title}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted truncate">
          <span className="truncate">
            {formatArtists(track.metadata?.artist)}
          </span>

          {/* Hover Metadata (Bitrate) */}
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            whileHover={{ opacity: 1, x: 0 }}
            className="hidden group-hover:inline-flex items-center gap-1 text-[10px] text-accent font-mono bg-accent/10 px-1.5 py-0.5 rounded shadow-sm border border-accent/20"
          >
            <IconActivity size={10} />
            {track.metadata?.bitrate || "1411"} kbps
            {track.metadata?.sampleRate && (
              <span className="ml-1 opacity-60">
                {(track.metadata.sampleRate / 1000).toFixed(1)}kHz
              </span>
            )}
            {track.metadata?.bitsPerSample && (
              <span className="ml-1 opacity-60">
                {track.metadata.bitsPerSample}-bit
              </span>
            )}
          </motion.span>
        </div>
      </div>

      {/* Right Section: Duration & Badges */}
      <div className="flex flex-col items-end gap-1.5 min-w-fit pr-1">
        <span className="text-[11px] text-text-muted tabular-nums font-mono opacity-60 group-hover:opacity-100 transition-opacity">
          {formatTime(track.metadata?.duration || 0)}
        </span>

        {/* Extension Badge */}
        <div className="flex gap-1 items-center">
          <Badge
            variant="custom"
            className={cn(
              "text-[9px] px-1.5 py-0 transition-all transform scale-90 group-hover:scale-100 shadow-sm",
              getBadgeClass(ext),
              ext !== "FLAC" && ext !== "WAV"
                ? "opacity-0 group-hover:opacity-100"
                : "opacity-100"
            )}
          >
            {ext}
          </Badge>
        </div>
      </div>
    </Reorder.Item>
  );
}
