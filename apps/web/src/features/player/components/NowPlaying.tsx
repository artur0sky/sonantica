/**
 * Now Playing Component
 *
 * Displays current track information with album art.
 * On mobile: Swipe up on cover art to view lyrics.
 */

import { useState } from "react";
import { Badge } from "@sonantica/ui";
import { usePlayerStore } from "@sonantica/player-core";
import { formatArtists } from "@sonantica/shared";
import { motion, AnimatePresence } from "framer-motion";
import { IconMusic, IconChevronUp, IconChevronDown } from "@tabler/icons-react";
import { LyricsDisplay } from "./LyricsDisplay";

export function NowPlaying() {
  const { currentTrack, state } = usePlayerStore();
  const [showLyrics, setShowLyrics] = useState(false);

  if (!currentTrack) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted italic text-lg">
          "Every file has an intention."
        </p>
        <p className="text-text-muted text-sm mt-2">
          Load a track from the library or use the demo
        </p>
      </div>
    );
  }

  const hasLyrics = currentTrack.metadata?.lyrics;

  return (
    <div className="bg-surface-elevated rounded-lg overflow-hidden">
      {/* Desktop/Tablet View - Traditional Layout */}
      <div className="hidden md:block p-6 text-center">
        <Badge variant="accent" className="mb-4">
          {state}
        </Badge>

        <h2 className="text-2xl font-bold mb-2">
          {currentTrack.metadata?.title || "Unknown Title"}
        </h2>

        <p className="text-lg text-text-muted mb-1">
          {formatArtists(currentTrack.metadata?.artist)}
        </p>

        <p className="text-sm text-text-muted">
          {currentTrack.metadata?.album || "Unknown Album"}
        </p>
      </div>

      {/* Mobile View - Swipeable Cover Art */}
      <div className="md:hidden">
        <AnimatePresence mode="wait">
          {!showLyrics ? (
            <motion.div
              key="cover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              {/* Album Art with Swipe Indicator */}
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.y < -50 && hasLyrics) {
                    setShowLyrics(true);
                  }
                }}
                className="relative cursor-grab active:cursor-grabbing"
              >
                {/* Cover Art */}
                <div className="aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden shadow-2xl bg-surface border border-border relative">
                  {currentTrack.metadata?.coverArt ? (
                    <img
                      src={currentTrack.metadata.coverArt}
                      alt="Album Cover"
                      className="w-full h-full object-cover"
                      draggable="false"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IconMusic
                        size={80}
                        className="text-text-muted/30"
                        stroke={1.5}
                      />
                    </div>
                  )}

                  {/* Swipe Up Indicator */}
                  {hasLyrics && (
                    <motion.div
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-1 text-white drop-shadow-lg"
                    >
                      <IconChevronUp size={24} stroke={2} />
                      <span className="text-xs font-medium">
                        Swipe up for lyrics
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Track Info */}
                <div className="mt-6 text-center">
                  <Badge variant="accent" className="mb-3">
                    {state}
                  </Badge>

                  <h2 className="text-xl font-bold mb-2">
                    {currentTrack.metadata?.title || "Unknown Title"}
                  </h2>

                  <p className="text-base text-text-muted mb-1">
                    {formatArtists(currentTrack.metadata?.artist)}
                  </p>

                  <p className="text-sm text-text-muted">
                    {currentTrack.metadata?.album || "Unknown Album"}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="lyrics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowLyrics(false)}
                className="absolute top-4 right-4 z-10 bg-surface-elevated/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-surface transition-colors"
              >
                <IconChevronDown size={24} stroke={1.5} />
              </button>

              {/* Lyrics Display */}
              <div className="p-6 min-h-[500px]">
                <LyricsDisplay />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
