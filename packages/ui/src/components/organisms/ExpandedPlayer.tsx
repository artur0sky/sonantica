/**
 * Expanded Player Component
 *
 * "Intentional minimalism" - focus on the listening experience.
 */

import { usePlayerStore, useQueueStore } from "@sonantica/player-core";
import { useUIStore } from "../../stores/uiStore";
import { useWaveformStore } from "@sonantica/audio-analyzer";
import { ShuffleButton, RepeatButton } from "../atoms";
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
  IconPlayerSkipBack,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerSkipForward,
  IconX,
  IconMusic,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

export function ExpandedPlayer() {
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

  const { setPlayerExpanded } = useUIStore();
  const { isShuffled, toggleShuffle, repeatMode, toggleRepeat } =
    useQueueStore();
  const getWaveform = useWaveformStore((state) => state.getWaveform);

  if (!currentTrack) {
    // Ideally user state should handle this check before rendering, but...
    setPlayerExpanded(false);
    return null;
  }

  const isPlaying = state === PlaybackState.PLAYING;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full flex flex-col items-center justify-center bg-gradient-to-b from-surface via-bg to-surface p-8 relative overflow-hidden"
    >
      {/* Background Ambience (Optional) */}
      <div className="absolute inset-0 bg-accent/5 pointer-events-none" />

      {/* Close Button */}
      <motion.button
        onClick={() => setPlayerExpanded(false)}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-elevated hover:bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text transition-colors z-10"
        aria-label="Close player"
      >
        <IconX size={20} stroke={1.5} />
      </motion.button>

      {/* Album Art / Visualization */}
      <motion.div
        layoutId="player-artwork"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          // Swipe to change tracks
          if (info.offset.x > 100) {
            previous();
          } else if (info.offset.x < -100) {
            next();
          }
        }}
        className="w-80 h-80 max-w-[80vw] max-h-[80vw] bg-surface-elevated rounded-2xl flex items-center justify-center text-text-muted mb-8 shadow-2xl border border-border overflow-hidden relative cursor-grab active:cursor-grabbing"
      >
        {currentTrack.metadata?.coverArt ? (
          <motion.img
            key={currentTrack.id}
            src={currentTrack.metadata.coverArt}
            alt="Cover"
            className="w-full h-full object-cover select-none pointer-events-none"
            draggable="false"
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            onError={(e) => {
              console.error("Failed to load cover art:", e);
            }}
            onLoad={() => {
              console.log("Cover art loaded successfully");
            }}
          />
        ) : (
          <IconMusic size={80} stroke={1} className="opacity-20" />
        )}
      </motion.div>

      {/* Track Info */}
      <div className="text-center mb-6 max-w-2xl px-4 z-10 w-full">
        <motion.h1
          layoutId="player-title"
          className="text-3xl md:text-4xl font-bold mb-3 text-balance tracking-tight"
        >
          {currentTrack.metadata?.title || "Unknown Title"}
        </motion.h1>
        <motion.p
          layoutId="player-artist"
          className="text-xl text-text-muted mb-2 font-medium"
        >
          {formatArtists(currentTrack.metadata?.artist)}
        </motion.p>

        <AnimatePresence>
          {currentTrack.metadata?.album && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg text-text-muted/60 mb-4"
            >
              {currentTrack.metadata.album}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Rating */}
        <div className="flex justify-center mt-4">
          <TrackRating trackId={currentTrack.id} mode="both" size={20} />
        </div>
      </div>

      {/* Timeline */}
      <div className="w-full max-w-2xl mb-8 z-10 px-4">
        <WaveformScrubber
          trackId={currentTrack.id}
          progress={(currentTime / (duration || 1)) * 100}
          duration={duration}
          waveform={getWaveform(currentTrack.id) || undefined}
          onSeek={(time) => seek(time)}
          className="mb-3 h-2 hover:h-16"
        />
        <div className="flex justify-between text-sm text-text-muted tabular-nums px-1 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-8 mb-8 z-10">
        {/* Shuffle */}
        <ShuffleButton
          size={28}
          isShuffled={isShuffled}
          onClick={toggleShuffle}
        />

        <motion.button
          onClick={previous}
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.9 }}
          className="text-text-muted hover:text-text transition-colors p-2"
        >
          <IconPlayerSkipBack size={32} stroke={1.5} />
        </motion.button>

        <motion.button
          onClick={isPlaying ? pause : play}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-20 h-20 rounded-full bg-accent hover:bg-accent-hover text-white flex items-center justify-center shadow-xl transition-colors"
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
                  size={36}
                  className="fill-current"
                  stroke={0}
                />
              ) : (
                <IconPlayerPlay
                  size={36}
                  className="fill-current pl-1"
                  stroke={0}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <motion.button
          onClick={next}
          whileHover={{ scale: 1.1, x: 2 }}
          whileTap={{ scale: 0.9 }}
          className="text-text-muted hover:text-text transition-colors p-2"
        >
          <IconPlayerSkipForward size={32} stroke={1.5} />
        </motion.button>

        {/* Repeat */}
        <RepeatButton size={28} mode={repeatMode} onClick={toggleRepeat} />
      </div>

      {/* Volume Control */}
      <div className="flex items-center justify-center gap-4 w-full max-w-md z-10 mb-8">
        <EnhancedVolumeControl
          className="flex-1"
          volume={volume}
          onVolumeChange={setVolume}
        />
      </div>

      {/* Philosophy Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-6 text-center z-10"
      >
        <p className="text-sm text-text-muted/40 italic font-serif">
          Listening is not passive.
        </p>
      </motion.div>
    </motion.div>
  );
}
