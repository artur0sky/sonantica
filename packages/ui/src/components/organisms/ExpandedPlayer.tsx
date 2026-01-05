/**
 * Expanded Player Component
 *
 * "Intentional minimalism" meets "Premium aesthetic".
 * Focus on the listening experience with Spotify-inspired layout
 * and Amoled black high-fidelity visuals.
 */

import { usePlayerStore, useQueueStore } from "@sonantica/player-core";
import { useUIStore } from "../../stores/uiStore";
import { useWaveformStore } from "@sonantica/audio-analyzer";
import {
  ShuffleButton,
  RepeatButton,
  PlayButton,
  SkipButton,
  ActionIconButton,
  PlayerButton,
} from "../atoms";
import {
  EnhancedVolumeControl,
  WaveformScrubber,
  TrackRating,
} from "../molecules";
import {
  cn,
  formatTime,
  PlaybackState,
  formatArtists,
} from "@sonantica/shared";
import {
  IconChevronDown,
  IconDots,
  IconMusic,
  IconPlaylist,
  IconSparkles,
  IconMicrophone,
  IconPlayerSkipBack,
  IconPlayerSkipForward,
} from "@tabler/icons-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Suspense, lazy, useMemo, useState, useRef } from "react";

interface ExpandedPlayerProps {
  /** Optional action buttons to render in the info area */
  actionButtons?: React.ReactNode;
  /** Callback for long press on cover art */
  onLongPressArt?: () => void;
}

export function ExpandedPlayer({
  actionButtons,
  onLongPressArt,
}: ExpandedPlayerProps = {}) {
  const {
    currentTrack,
    state,
    currentTime,
    duration,
    play,
    pause,
    next,
    previous,
    volume,
    setVolume,
    seek,
  } = usePlayerStore();

  const {
    setPlayerExpanded,
    toggleLyrics,
    recommendationsOpen,
    toggleRecommendations,
    isQueueOpen,
    toggleQueue,
  } = useUIStore();

  const { isShuffled, toggleShuffle, repeatMode, toggleRepeat } =
    useQueueStore();
  const getWaveform = useWaveformStore((state) => state.getWaveform);

  const [longPressActive, setLongPressActive] = useState(false);
  const [dragDirection, setDragDirection] = useState<"left" | "right" | null>(
    null
  );
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  if (!currentTrack) {
    setPlayerExpanded(false);
    return null;
  }

  const isPlaying = state === PlaybackState.PLAYING;
  const coverArt = currentTrack.metadata?.coverArt;

  const handlePointerDown = (e: React.PointerEvent) => {
    pressTimerRef.current = setTimeout(() => {
      setLongPressActive(true);
      onLongPressArt?.();
      // Visual feedback via vibration if available
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(50);
      }
      setTimeout(() => setLongPressActive(false), 300);
    }, 600);
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  };

  const handlePointerCancel = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  };

  const handleDragStart = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  };

  const handleDrag = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 30;
    if (Math.abs(info.offset.x) > threshold) {
      setDragDirection(info.offset.x > 0 ? "right" : "left");
    } else {
      setDragDirection(null);
    }
  };

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 100;

    if (info.offset.x > threshold) {
      // Swipe right -> Previous
      previous();
    } else if (info.offset.x < -threshold) {
      // Swipe left -> Next
      next();
    }

    setDragDirection(null);
  };

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 200 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden"
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

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col h-full items-center px-4 py-8 md:px-12 md:py-10 max-w-screen-xl mx-auto w-full">
        {/* Top Header */}
        <header className="w-full flex justify-between items-center mb-4 md:mb-12">
          <PlayerButton
            icon={IconChevronDown}
            onClick={() => setPlayerExpanded(false)}
            size="lg"
            title="Minimize"
          />
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-black opacity-60">
              Now Playing
            </span>
            {currentTrack.metadata?.album && (
              <span className="text-xs text-text-muted mt-1 line-clamp-1 max-w-[150px] sm:max-w-[300px] font-medium text-center">
                {currentTrack.metadata.album}
              </span>
            )}
          </div>
          <PlayerButton
            icon={IconDots}
            onClick={() => {}}
            size="lg"
            title="More Options"
          />
        </header>

        {/* Center Section: Cover Art with Drag */}
        <div className="flex-1 flex items-center justify-center w-full min-h-0 mb-8 md:mb-12 px-2 sm:px-0">
          <motion.div
            layoutId="player-artwork"
            className="relative group aspect-square w-full h-auto sm:h-full max-w-[95vw] max-h-[95vw] sm:max-h-[500px]"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            whileHover={{ scale: 1.01 }}
            animate={longPressActive ? { scale: 0.95 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onPointerLeave={handlePointerCancel}
            style={{ touchAction: "none" }}
          >
            {/* Glow Shadow */}
            <div className="absolute inset-0 bg-accent/20 blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-700 rounded-2xl" />

            <div className="relative w-full h-full bg-surface-elevated rounded-2xl border border-white/10 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
              {coverArt ? (
                <img
                  src={coverArt}
                  alt="Cover"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  draggable="false"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted/20">
                  <IconMusic size={120} stroke={1} />
                </div>
              )}

              {/* Drag Direction Feedback */}
              <AnimatePresence>
                {dragDirection && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    {dragDirection === "right" ? (
                      <div className="flex items-center gap-4">
                        <IconPlayerSkipBack
                          size={64}
                          className="text-white drop-shadow-lg"
                        />
                        <span className="text-white font-bold text-xl">
                          Previous
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <span className="text-white font-bold text-xl">
                          Next
                        </span>
                        <IconPlayerSkipForward
                          size={64}
                          className="text-white drop-shadow-lg"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Long Press Visual Feedback Overlay */}
            <AnimatePresence>
              {longPressActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 bg-accent/20 flex items-center justify-center rounded-2xl backdrop-blur-sm z-20 pointer-events-none"
                >
                  <IconPlaylist
                    size={64}
                    className="text-white drop-shadow-lg"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Info & Basic Controls */}
        <div className="w-full max-w-screen-md flex flex-col gap-4 sm:gap-8 pb-4">
          {/* Metadata & Secondary Actions - STACKED ON MOBILE */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <motion.h1
                layoutId="player-title"
                className="text-2xl sm:text-4xl font-black tracking-tight line-clamp-2 sm:line-clamp-1"
              >
                {currentTrack.metadata?.title || "Unknown Title"}
              </motion.h1>
              <motion.p
                layoutId="player-artist"
                className="text-lg sm:text-2xl text-text-muted font-bold mt-1 md:mt-2"
              >
                {formatArtists(currentTrack.metadata?.artist)}
              </motion.p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-white/5 sm:bg-transparent p-2 sm:p-0 rounded-2xl">
              <TrackRating
                trackId={currentTrack.id}
                mode="both"
                size={22}
                compact
              />
              <div className="w-px h-4 bg-white/10 hidden sm:block mx-1" />
              {actionButtons}
            </div>
          </div>

          {/* Timeline / Progress */}
          <div className="space-y-4 px-2 sm:px-0">
            <WaveformScrubber
              trackId={currentTrack.id}
              progress={(currentTime / (duration || 1)) * 100}
              duration={duration}
              waveform={getWaveform(currentTrack.id) || undefined}
              onSeek={seek}
              className="h-1.5 md:h-2 hover:h-12 transition-all duration-300 bg-white/5 rounded-full"
            />
            <div className="flex justify-between text-[10px] sm:text-xs text-text-muted tabular-nums font-bold opacity-60 px-0.5">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Playback Controls Cluster */}
          <div className="flex items-center justify-between px-2 sm:px-8 mt-2">
            <RepeatButton mode={repeatMode} onClick={toggleRepeat} size="md" />

            <div className="flex items-center gap-4 sm:gap-10">
              <SkipButton
                direction="prev"
                onClick={previous}
                size="xl"
                className="hover:text-text"
              />
              <PlayButton
                isPlaying={isPlaying}
                onClick={isPlaying ? pause : play}
                size="xl"
                variant="accent"
                className="shadow-2xl shadow-accent/40 w-16 h-16 sm:w-24 sm:h-24"
              />
              <SkipButton
                direction="next"
                onClick={next}
                size="xl"
                className="hover:text-text"
              />
            </div>

            <ShuffleButton
              isShuffled={isShuffled}
              onClick={toggleShuffle}
              size="md"
            />
          </div>

          {/* Footer Navigation: Discovery | Lyrics | Queue */}
          <footer className="flex items-center justify-between mt-4 md:mt-8">
            <ActionIconButton
              icon={IconSparkles}
              onClick={toggleRecommendations}
              isActive={recommendationsOpen}
              title="Discovery"
              size="md"
            />

            {/* Lyrics Button - Opens Sidebar */}
            <ActionIconButton
              icon={IconMicrophone}
              onClick={toggleLyrics}
              title="Lyrics"
              size="md"
            />

            <ActionIconButton
              icon={IconPlaylist}
              onClick={toggleQueue}
              isActive={isQueueOpen}
              title="Queue"
              size="md"
            />
          </footer>
        </div>
      </div>
    </motion.div>
  );
}
