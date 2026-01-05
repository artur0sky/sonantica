/**
 * Expanded Player - Main Orchestrator (Organism)
 *
 * Coordinates mobile and desktop layouts
 * Applies Golden Ratio (φ ≈ 1.618) to desktop grid proportions
 * Following Clean Architecture and SOLID principles
 */

import { motion, AnimatePresence } from "framer-motion";
import { usePlayerStore, useQueueStore } from "@sonantica/player-core";
import { useUIStore } from "../../../stores/uiStore";
import { PlaybackState } from "@sonantica/shared";
import { ExpandedPlayerMobile } from "./ExpandedPlayerMobile";
import { ExpandedPlayerDesktop } from "./ExpandedPlayerDesktop";
import type { ExpandedPlayerProps } from "./types";

export function ExpandedPlayer({
  actionButtons,
  onLongPressArt,
}: ExpandedPlayerProps = {}) {
  // Player state
  const {
    currentTrack,
    state,
    currentTime,
    duration,
    play,
    pause,
    next,
    previous,
    seek,
  } = usePlayerStore();

  // UI state
  const {
    setPlayerExpanded,
    toggleLyrics,
    recommendationsOpen,
    toggleRecommendations,
    isQueueOpen,
    toggleQueue,
  } = useUIStore();

  // Queue state
  const { isShuffled, toggleShuffle, repeatMode, toggleRepeat } =
    useQueueStore();

  // Early return if no track
  if (!currentTrack) {
    setPlayerExpanded(false);
    return null;
  }

  const isPlaying = state === PlaybackState.PLAYING;
  const coverArt = currentTrack.metadata?.coverArt;

  // Shared props for both layouts (DRY principle)
  const sharedProps = {
    currentTrack,
    isPlaying,
    isShuffled,
    repeatMode,
    currentTime,
    duration,
    recommendationsOpen,
    isQueueOpen,
    actionButtons,
    onClose: () => setPlayerExpanded(false),
    onPlay: play,
    onPause: pause,
    onNext: next,
    onPrevious: previous,
    onSeek: seek,
    onToggleShuffle: toggleShuffle,
    onToggleRepeat: toggleRepeat,
    onToggleRecommendations: toggleRecommendations,
    onToggleLyrics: toggleLyrics,
    onToggleQueue: toggleQueue,
    onLongPressArt,
  };

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 200 }}
      className="fixed inset-0 h-[100dvh] z-[100] flex flex-col bg-black overflow-hidden overscroll-none"
    >
      {/* Premium Background Ambience - Blurred Cover Art */}
      <AnimatePresence>
        <motion.div
          key={currentTrack.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 pointer-events-none"
        >
          {coverArt ? (
            <div
              className="w-full h-full bg-cover bg-center blur-[120px] scale-150 transform-gpu"
              style={{ backgroundImage: `url(${coverArt})` }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent/20 to-black blur-[100px]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
        </motion.div>
      </AnimatePresence>

      {/* Main Content - Responsive Layouts */}
      <div className="relative z-10 h-full w-full">
        {/* Mobile Layout */}
        <ExpandedPlayerMobile {...sharedProps} />

        {/* Desktop Layout with Golden Ratio */}
        <ExpandedPlayerDesktop {...sharedProps} />
      </div>
    </motion.div>
  );
}
