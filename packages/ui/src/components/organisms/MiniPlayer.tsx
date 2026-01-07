import React from "react";
import { usePlayerStore, useQueueStore } from "@sonantica/player-core";
import { useUIStore } from "../../stores/uiStore";
import { useAnalyzerStore, useWaveformStore } from "@sonantica/audio-analyzer";
import {
  ShuffleButton,
  RepeatButton,
  PlayButton,
  SkipButton,
  ActionIconButton,
  CoverArt,
} from "../atoms";
import {
  EnhancedVolumeControl,
  WaveformScrubber,
  BackgroundSpectrum,
  TrackRating,
} from "../molecules";
import { formatTime, PlaybackState, formatArtists } from "@sonantica/shared";
import { cn } from "../../utils";
import {
  IconActivityHeartbeat,
  IconMicrophone,
  IconAdjustmentsHorizontal,
  IconPlaylist,
  IconSparkles,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

interface MiniPlayerProps {
  /** Optional action buttons to render next to track info */
  actionButtons?: React.ReactNode;
}

export function MiniPlayer({ actionButtons }: MiniPlayerProps = {}) {
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
    volume,
    setVolume,
  } = usePlayerStore();

  const {
    togglePlayerExpanded,
    toggleQueue,
    toggleLyrics,
    toggleEQ,
    toggleRecommendations,
    isVisualizationEnabled,
    toggleVisualization,
  } = useUIStore();

  const { repeatMode, toggleRepeat, isShuffled, toggleShuffle } =
    useQueueStore();
  const [featuredButtonIndex, setFeaturedButtonIndex] = React.useState(3); // Default to Queue (index 3)
  const [showAllButtons, setShowAllButtons] = React.useState(false);

  const sidebarButtons = [
    {
      id: "visualizer",
      icon: IconActivityHeartbeat,
      label: "Visualizer",
      action: toggleVisualization,
      isActive: isVisualizationEnabled,
    },
    {
      id: "eq",
      icon: IconAdjustmentsHorizontal,
      label: "Equalizer",
      action: toggleEQ,
    },
    {
      id: "lyrics",
      icon: IconMicrophone,
      label: "Lyrics",
      action: toggleLyrics,
    },
    {
      id: "queue",
      icon: IconPlaylist,
      label: "Queue",
      action: toggleQueue,
    },
    {
      id: "discovery",
      icon: IconSparkles,
      label: "Discovery",
      action: toggleRecommendations,
    },
  ];

  const handleNextButton = () => {
    setFeaturedButtonIndex((prev) => (prev + 1) % sidebarButtons.length);
  };

  const handlePrevButton = () => {
    setFeaturedButtonIndex(
      (prev) => (prev - 1 + sidebarButtons.length) % sidebarButtons.length
    );
  };
  const getWaveform = useWaveformStore((state: any) => state.getWaveform);
  const spectrum = useAnalyzerStore((state: any) => state.spectrum);
  const bands = spectrum
    ? spectrum.bands.map((b: any) => b.amplitude)
    : undefined;

  if (!currentTrack) return null;

  const isPlaying = state === PlaybackState.PLAYING;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-black/95 backdrop-blur-xl border-t border-white/5"
    >
      {/* Progress Bar with Waveform */}
      <WaveformScrubber
        trackId={currentTrack.id}
        progress={progress}
        duration={duration}
        waveform={getWaveform(currentTrack.id) ?? undefined}
        onSeek={seek}
        className="absolute -top-1.5 left-0 right-0 z-10 h-1 hover:h-6 transition-all duration-300"
      />

      {/* Real-time Visualization Background */}
      <BackgroundSpectrum
        bands={bands ?? undefined}
        enabled={isVisualizationEnabled}
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        height={64}
      />

      {/* Player Controls */}
      <div className="flex items-center px-4 md:px-6 h-16 relative z-10">
        {/* Section 1: Track Info (Left) */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.x > 80) previous();
            else if (info.offset.x < -80) next();
          }}
          className="flex-1 min-w-0 flex items-center gap-3 relative cursor-grab active:cursor-grabbing"
        >
          <motion.div
            layoutId="player-artwork"
            onClick={togglePlayerExpanded}
            className="w-10 h-10 flex-shrink-0 cursor-pointer active:scale-95 transition-transform relative"
          >
            <CoverArt
              src={currentTrack.metadata?.coverArt}
              alt="Cover"
              className="w-full h-full"
              iconSize={20}
            />
          </motion.div>

          <div
            className="min-w-0 flex-1 cursor-pointer"
            onClick={togglePlayerExpanded}
          >
            <div className="font-medium text-sm leading-tight truncate text-text">
              {currentTrack.metadata?.title || "Unknown Title"}
            </div>
            <div className="text-[11px] text-text-muted leading-tight truncate mt-0.5">
              {formatArtists(currentTrack.metadata?.artist)}
            </div>
          </div>

          {/* Action Buttons (Download, etc.) */}
          {actionButtons && (
            <div className="hidden sm:flex items-center gap-1 ml-2">
              {actionButtons}
            </div>
          )}
        </motion.div>

        {/* Section 2: Playback Controls (Center) */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mx-4">
          <div className="flex">
            <RepeatButton mode={repeatMode} onClick={toggleRepeat} size="xs" />
          </div>

          <SkipButton direction="prev" onClick={previous} size="sm" />

          <PlayButton
            isPlaying={isPlaying}
            onClick={isPlaying ? pause : play}
            size="md"
            className="shadow-accent/20"
          />

          <SkipButton direction="next" onClick={next} size="sm" />

          <div className="flex">
            <ShuffleButton
              isShuffled={isShuffled}
              onClick={toggleShuffle}
              size="xs"
            />
          </div>
        </div>

        {/* Section 3: Right Controls */}
        <div className="flex-1 flex items-center justify-end gap-1 md:gap-2">
          <div className="text-[11px] text-text-muted tabular-nums hidden xl:block font-medium mr-4">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <div className="hidden md:flex">
            <EnhancedVolumeControl
              volume={volume}
              onVolumeChange={setVolume}
              size="sm"
            />
          </div>

          {/* Mobile Swipeable Button / Extended Menu */}
          <div className="flex items-center gap-1 md:gap-2 relative">
            <motion.div
              layout
              className={cn(
                "flex items-center gap-1 transition-all duration-300",
                showAllButtons
                  ? "bg-white/5 rounded-full p-1 border border-white/10 pr-2"
                  : ""
              )}
            >
              {sidebarButtons.map((btn, idx) => {
                const isFeatured = idx === featuredButtonIndex;
                const shouldShow = showAllButtons || isFeatured;

                if (!shouldShow) return null;

                return (
                  <motion.div
                    key={btn.id}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    {...(isFeatured && !showAllButtons
                      ? {
                          drag: "x",
                          dragConstraints: { left: 0, right: 0 },
                          onDragEnd: (_: any, info: any) => {
                            if (info.offset.x > 30) handlePrevButton();
                            else if (info.offset.x < -30) handleNextButton();
                          },
                        }
                      : {})}
                  >
                    <ActionIconButton
                      icon={btn.icon}
                      onClick={() => {
                        btn.action();
                        if (showAllButtons) setShowAllButtons(false);
                      }}
                      onContextMenu={(e: React.MouseEvent) => {
                        e.preventDefault();
                        setShowAllButtons(true);
                      }}
                      onPointerDown={() => {
                        const timer = setTimeout(
                          () => setShowAllButtons(true),
                          600
                        );
                        const clearTimer = () => {
                          clearTimeout(timer);
                          window.removeEventListener("pointerup", clearTimer);
                        };
                        window.addEventListener("pointerup", clearTimer);
                      }}
                      isActive={"isActive" in btn ? btn.isActive : false}
                      size="xs"
                      title={btn.label}
                      className={cn(
                        "transition-all",
                        isFeatured && !showAllButtons
                          ? "scale-110 bg-white/10"
                          : "opacity-60 hover:opacity-100"
                      )}
                    />
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Backdrop to close menu */}
            {showAllButtons && (
              <div
                className="fixed inset-0 z-[-1]"
                onClick={() => setShowAllButtons(false)}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
