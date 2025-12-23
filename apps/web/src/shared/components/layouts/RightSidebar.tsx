/**
 * Right Sidebar - Queue
 *
 * Playback queue management.
 * Shows current track and upcoming tracks.
 */

import { IconX, IconTrash, IconMusic } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { useState, useRef, useEffect, useMemo } from "react";
import { usePlayerStore } from "../../store/playerStore";
import { useQueueStore } from "../../store/queueStore";
import { useUIStore } from "../../store/uiStore";
import { Button } from "../atoms";
import { formatArtists } from "../../utils/metadata";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

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
  const { getRemainingTracks, clearQueue } = useQueueStore();

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
              <motion.ul
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                {visibleQueue.map((track: any, index: number) => (
                  <motion.li
                    key={track.id}
                    variants={itemVariants}
                    layout // Keep basic layout animation but remove complex transitions if sluggish
                    whileHover={{
                      x: 4,
                      backgroundColor: "rgba(255,255,255,0.05)",
                    }}
                    onClick={async () => {
                      // Jump to this track in queue (index + 1 because current track is at index 0)
                      const queueStore = useQueueStore.getState();
                      queueStore.jumpTo(queueStore.currentIndex + index + 1);
                      await loadTrack(track);
                      await play();
                    }}
                    className="flex items-center gap-3 p-3 rounded-md transition-fast cursor-pointer"
                  >
                    {/* Album Art Thumbnail */}
                    <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-surface border border-border">
                      {track.metadata?.coverArt ? (
                        <img
                          src={track.metadata.coverArt}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <IconMusic
                            size={16}
                            className="text-text-muted/30"
                            stroke={1.5}
                          />
                        </div>
                      )}
                    </div>

                    <span className="text-text-muted text-sm w-6">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate text-sm">
                        {track.metadata?.title}
                      </div>
                      <div className="text-xs text-text-muted truncate">
                        {formatArtists(track.metadata?.artist)}
                      </div>
                    </div>
                  </motion.li>
                ))}
                {/* Sentinel */}
                {displayedCount < queue.length && (
                  <div ref={observerTarget} className="py-2 h-4" />
                )}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
