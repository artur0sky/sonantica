/**
 * Mini Player Component
 *
 * Sticky bottom player inspired by SoundCloud.
 * "Functional elegance" - minimal but complete controls.
 */

import { usePlayerStore } from "../../../shared/store/playerStore";
import { useUIStore } from "../../../shared/store/uiStore";
import { ShuffleButton, RepeatButton } from "../../../shared/components/atoms";
import { EnhancedVolumeControl } from "../../../shared/components/molecules/EnhancedVolumeControl";
import { WaveformScrubber } from "../../../shared/components/molecules/WaveformScrubber";
import { BackgroundSpectrum } from "../../../shared/components/molecules/BackgroundSpectrum";
import { TrackRating } from "../../../shared/components/molecules/TrackRating";
import { formatTime, PlaybackState } from "@sonantica/shared";
import { cn } from "../../../shared/utils";
import { formatArtists } from "../../../shared/utils/metadata";
import {
  IconPlayerSkipBack,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerSkipForward,
  IconPlaylist,
  IconMusic,
  IconActivityHeartbeat,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

export function MiniPlayer() {
  const {
    currentTrack,
    state,
    currentTime,
    duration,
    play,
    pause,
    seek,
    next,
    previous,
    getAudioElement,
  } = usePlayerStore();

  const {
    togglePlayerExpanded,
    toggleQueue,
    isVisualizationEnabled,
    toggleVisualization,
  } = useUIStore();

  if (!currentTrack) return null;

  const isPlaying = state === PlaybackState.PLAYING;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="border-t border-border"
    >
      {/* Progress Bar */}
      {/* Progress Bar with Waveform */}
      <WaveformScrubber
        trackId={currentTrack.id}
        progress={progress}
        duration={duration}
        onSeek={seek}
        className="absolute -top-1 left-0 right-0 z-10"
      />

      {/* Spacer to preserve layout if needed, though scrubber is absolute top-aligned */}

      {/* Real-time Visualization Background */}
      <BackgroundSpectrum
        audioElement={getAudioElement()}
        enabled={isVisualizationEnabled}
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        height={64} // Matches approximate height of player
      />

      {/* Player Controls - 5 Equal Sections Layout */}
      <div className="flex items-center px-4 py-2.5 relative z-10">
        {/* Section 1: Track Info (Left - 1/5) */}
        <div className="w-1/5">
          <motion.button
            onClick={togglePlayerExpanded}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              // Swipe left = next track, Swipe right = previous track
              if (info.offset.x > 100) {
                previous();
              } else if (info.offset.x < -100) {
                next();
              }
            }}
            whileHover={{
              scale: 1.01,
              backgroundColor: "rgba(255,255,255,0.02)",
            }}
            whileTap={{ scale: 0.99 }}
            className="flex items-center gap-2 min-w-0 py-1 px-2 rounded-lg transition-colors text-left"
          >
            <motion.div
              layoutId="player-artwork"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                // Swipe on artwork to change tracks
                if (info.offset.x > 80) {
                  previous();
                } else if (info.offset.x < -80) {
                  next();
                }
              }}
              className="w-12 h-12 flex-shrink-0 bg-surface rounded-md flex items-center justify-center text-text-muted border border-border overflow-hidden cursor-grab active:cursor-grabbing"
            >
              {currentTrack.metadata?.coverArt ? (
                <img
                  src={currentTrack.metadata.coverArt}
                  alt="Cover"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  draggable="false"
                  onError={() => {
                    console.error("❌ MiniPlayer: Failed to load cover art");
                  }}
                  onLoad={() => {
                    console.log("✅ MiniPlayer: Cover art loaded successfully");
                  }}
                />
              ) : (
                <IconMusic size={24} stroke={1.5} />
              )}
            </motion.div>

            {/* Track text + Rating - All within 20% */}
            <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 overflow-hidden">
                {/* Title with marquee on hover */}
                <div className="relative overflow-hidden group/title">
                  <motion.div
                    layoutId="player-title"
                    className="font-medium text-sm leading-tight whitespace-nowrap"
                    animate={{
                      x: 0,
                    }}
                    whileHover={{
                      x: [0, -100, 0],
                      transition: {
                        x: {
                          repeat: Infinity,
                          repeatType: "loop",
                          duration: 8,
                          ease: "linear",
                        },
                      },
                    }}
                    style={{
                      display: "inline-block",
                      minWidth: "100%",
                    }}
                  >
                    <span className="group-hover/title:inline block truncate">
                      {currentTrack.metadata?.title || "Unknown Title"}
                    </span>
                  </motion.div>
                </div>

                {/* Artist with marquee on hover */}
                <div className="relative overflow-hidden group/artist mt-0.5">
                  <motion.div
                    layoutId="player-artist"
                    className="text-xs text-text-muted leading-tight whitespace-nowrap"
                    animate={{
                      x: 0,
                    }}
                    whileHover={{
                      x: [0, -100, 0],
                      transition: {
                        x: {
                          repeat: Infinity,
                          repeatType: "loop",
                          duration: 8,
                          ease: "linear",
                        },
                      },
                    }}
                    style={{
                      display: "inline-block",
                      minWidth: "100%",
                    }}
                  >
                    <span className="group-hover/artist:inline block truncate">
                      {formatArtists(currentTrack.metadata?.artist)}
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* Rating next to track info - within the 20% */}
              <div className="hidden lg:flex items-center flex-shrink-0">
                <TrackRating
                  trackId={currentTrack.id}
                  mode="both"
                  size={12}
                  compact
                />
              </div>
            </div>
          </motion.button>
        </div>

        {/* Section 2: Left-Center (Empty - 1/5) - Reserved for future use */}
        <div className="w-1/5 flex items-center justify-center">
          {/* Empty - Reserved for future features */}
        </div>

        {/* Section 3: Center Playback Controls (1/5) */}
        <div className="w-1/5 flex items-center justify-center gap-2">
          {/* Repeat (Left of Previous) */}
          <div className="hidden md:flex items-center">
            <RepeatButton size={18} />
          </div>

          <motion.button
            onClick={previous}
            whileHover={{ scale: 1.1, color: "var(--color-text)" }}
            whileTap={{ scale: 0.9 }}
            className="text-text-muted transition-colors p-1.5"
            aria-label="Previous"
          >
            <IconPlayerSkipBack size={20} stroke={1.5} />
          </motion.button>

          <motion.button
            onClick={isPlaying ? pause : play}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg",
              "bg-accent hover:bg-accent-hover"
            )}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isPlaying ? "pause" : "play"}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.1 }}
              >
                {isPlaying ? (
                  <IconPlayerPause
                    size={20}
                    className="fill-current"
                    stroke={0}
                  />
                ) : (
                  <IconPlayerPlay
                    size={20}
                    className="fill-current"
                    stroke={0}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          <motion.button
            onClick={next}
            whileHover={{ scale: 1.1, color: "var(--color-text)" }}
            whileTap={{ scale: 0.9 }}
            className="text-text-muted transition-colors p-1.5"
            aria-label="Next"
          >
            <IconPlayerSkipForward size={20} stroke={1.5} />
          </motion.button>

          {/* Shuffle (Right of Next) */}
          <div className="hidden md:flex items-center">
            <ShuffleButton size={18} />
          </div>
        </div>

        {/* Section 4: Right-Center (Empty - 1/5) - Reserved for future use */}
        <div className="w-1/5 flex items-center justify-center">
          {/* Empty - Reserved for future features */}
        </div>

        {/* Section 5: Right Controls (1/5) */}
        <div className="w-1/5 flex items-center justify-end gap-3 px-2">
          {/* Time Display */}
          <div className="text-xs text-text-muted tabular-nums hidden md:flex items-center font-mono h-10">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Volume Control (Enhanced) */}
          <div className="hidden lg:flex items-center">
            <EnhancedVolumeControl />
          </div>

          {/* Visualization Toggle */}
          <motion.button
            onClick={toggleVisualization}
            whileHover={{
              scale: 1.1,
              color: isVisualizationEnabled
                ? "var(--color-accent-hover)"
                : "var(--color-text)",
            }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "transition-colors hidden sm:flex items-center justify-center p-1.5",
              isVisualizationEnabled ? "text-accent" : "text-text-muted"
            )}
            aria-label="Toggle visualization"
            title="Toggle Audio Visualization"
          >
            <IconActivityHeartbeat size={20} stroke={1.5} />
          </motion.button>

          {/* Queue Toggle */}
          <motion.button
            onClick={toggleQueue}
            whileHover={{ scale: 1.1, color: "var(--color-accent)" }}
            whileTap={{ scale: 0.9 }}
            className="text-text-muted transition-colors flex items-center justify-center p-1.5"
            aria-label="Toggle queue"
          >
            <IconPlaylist size={20} stroke={1.5} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
