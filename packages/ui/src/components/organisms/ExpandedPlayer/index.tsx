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
      className="fixed inset-0 lg:relative lg:inset-auto h-[100dvh] lg:h-full z-[100] lg:z-10 flex flex-col bg-[var(--dominant-color,black)] lg:bg-transparent overflow-hidden overscroll-none"
    >
      {/* Premium Background Ambience - Blurred Cover Art (Mobile Only) */}
      {/* Solid Background handled by MainLayout wrapper passing CSS variables */}
      <div />

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
