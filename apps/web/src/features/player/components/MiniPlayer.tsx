/**
 * Mini Player Component
 *
 * Sticky bottom player inspired by SoundCloud.
 * "Functional elegance" - minimal but complete controls.
 */

import { usePlayerStore } from "../../../shared/store/playerStore";
import { useUIStore } from "../../../shared/store/uiStore";
import { ShuffleButton } from "../../../shared/components/atoms";
import { EnhancedVolumeControl } from "../../../shared/components/molecules/EnhancedVolumeControl";
import { WaveformScrubber } from "../../../shared/components/molecules/WaveformScrubber";
import { BackgroundSpectrum } from "../../../shared/components/molecules/BackgroundSpectrum";
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

      {/* Player Controls */}
      <div className="flex items-center gap-4 px-4 py-3 relative z-10">
        {/* Track Info - Clickable to expand */}
        <motion.button
          onClick={togglePlayerExpanded}
          whileHover={{
            scale: 1.01,
            backgroundColor: "rgba(255,255,255,0.02)",
          }}
          whileTap={{ scale: 0.99 }}
          className="flex items-center gap-3 flex-1 min-w-0 p-1 rounded-md transition-colors text-left"
        >
          <motion.div
            layoutId="player-artwork"
            className="w-12 h-12 bg-surface rounded-md flex items-center justify-center text-text-muted border border-border overflow-hidden"
          >
            {currentTrack.metadata?.coverArt ? (
              <img
                src={currentTrack.metadata.coverArt}
                alt="Cover"
                className="w-full h-full object-cover"
                onError={() => {
                  console.error("❌ MiniPlayer: Failed to load cover art");
                  console.log(
                    "Cover art length:",
                    currentTrack.metadata?.coverArt?.length
                  );
                  console.log(
                    "Cover art starts with:",
                    currentTrack.metadata?.coverArt?.substring(0, 50)
                  );
                  console.log(
                    "Is valid data URL:",
                    currentTrack.metadata?.coverArt?.startsWith("data:")
                  );
                }}
                onLoad={() => {
                  console.log("✅ MiniPlayer: Cover art loaded successfully");
                }}
              />
            ) : (
              <IconMusic size={24} stroke={1.5} />
            )}
          </motion.div>
          <div className="min-w-0 flex-1">
            <motion.div
              layoutId="player-title"
              className="font-medium truncate text-sm"
            >
              {currentTrack.metadata?.title || "Unknown Title"}
            </motion.div>
            <motion.div
              layoutId="player-artist"
              className="text-xs text-text-muted truncate"
            >
              {formatArtists(currentTrack.metadata?.artist)}
            </motion.div>
          </div>
        </motion.button>

        {/* Center Controls */}
        <div className="flex items-center gap-4">
          <motion.button
            onClick={previous}
            whileHover={{ scale: 1.1, color: "var(--color-text)" }}
            whileTap={{ scale: 0.9 }}
            className="text-text-muted transition-colors"
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
            className="text-text-muted transition-colors"
            aria-label="Next"
          >
            <IconPlayerSkipForward size={20} stroke={1.5} />
          </motion.button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          {/* Time Display */}
          <div className="text-xs text-text-muted tabular-nums hidden md:block font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Volume Control (Enhanced) */}
          <div className="hidden lg:block">
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
              "transition-colors hidden sm:block",
              isVisualizationEnabled ? "text-accent" : "text-text-muted"
            )}
            aria-label="Toggle visualization"
            title="Toggle Audio Visualization"
          >
            <IconActivityHeartbeat size={20} stroke={1.5} />
          </motion.button>

          {/* Shuffle */}
          <div className="hidden md:block">
            <ShuffleButton size={18} />
          </div>

          {/* Queue Toggle */}
          <motion.button
            onClick={toggleQueue}
            whileHover={{ scale: 1.1, color: "var(--color-accent)" }}
            whileTap={{ scale: 0.9 }}
            className="text-text-muted transition-colors"
            aria-label="Toggle queue"
          >
            <IconPlaylist size={20} stroke={1.5} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
