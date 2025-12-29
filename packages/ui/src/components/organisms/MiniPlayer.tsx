/**
 * Mini Player Component
 *
 * Sticky bottom player inspired by SoundCloud.
 * "Functional elegance" - minimal but complete controls.
 */

import { usePlayerStore, useQueueStore } from "@sonantica/player-core";
import { useUIStore } from "../../stores/uiStore";
import { useAnalyzerStore, useWaveformStore } from "@sonantica/audio-analyzer";
import {
  ShuffleButton,
  RepeatButton,
  PlayButton,
  SkipButton,
  ActionIconButton,
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
  IconMusic,
  IconActivityHeartbeat,
  IconMicrophone,
  IconAdjustmentsHorizontal,
  IconPlaylist,
  IconSparkles,
} from "@tabler/icons-react";
import { motion } from "framer-motion";

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
  const getWaveform = useWaveformStore((state) => state.getWaveform);
  const spectrum = useAnalyzerStore((state) => state.spectrum);
  const bands = spectrum ? spectrum.bands.map((b) => b.amplitude) : undefined;

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
      {/* Progress Bar with Waveform */}
      <WaveformScrubber
        trackId={currentTrack.id}
        progress={progress}
        duration={duration}
        waveform={getWaveform(currentTrack.id) ?? undefined}
        onSeek={seek}
        className="absolute -top-1 left-0 right-0 z-10"
      />

      {/* Real-time Visualization Background */}
      <BackgroundSpectrum
        bands={bands ?? undefined}
        enabled={isVisualizationEnabled}
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        height={64}
      />

      {/* Player Controls - Responsive Layout */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center px-2 sm:px-4 md:px-6 py-2 sm:py-2.5 relative z-10 gap-2 sm:gap-0">
        {/* Mobile Layout: Stacked */}
        <div className="flex sm:hidden items-center gap-2 w-full">
          {/* Track Info - Mobile */}
          <motion.button
            onClick={togglePlayerExpanded}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="flex items-center gap-2 min-w-0 flex-1 py-1 px-2 rounded-lg transition-colors text-left"
          >
            <motion.div
              layoutId="player-artwork"
              className="w-10 h-10 flex-shrink-0 bg-surface rounded-md flex items-center justify-center text-text-muted border border-border overflow-hidden"
            >
              {currentTrack.metadata?.coverArt ? (
                <img
                  src={currentTrack.metadata.coverArt}
                  alt="Cover"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  draggable="false"
                />
              ) : (
                <IconMusic size={20} stroke={1.5} />
              )}
            </motion.div>

            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="font-medium text-sm leading-tight truncate">
                {currentTrack.metadata?.title || "Unknown Title"}
              </div>
              <div className="text-xs text-text-muted leading-tight truncate">
                {formatArtists(currentTrack.metadata?.artist)}
              </div>
            </div>
          </motion.button>

          {/* Mobile Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <SkipButton direction="prev" onClick={previous} size={20} />

            <PlayButton
              isPlaying={isPlaying}
              onClick={isPlaying ? pause : play}
              size="sm"
              className="w-9 h-9"
            />

            <SkipButton direction="next" onClick={next} size={20} />

            <ActionIconButton
              icon={IconAdjustmentsHorizontal}
              onClick={toggleEQ}
              title="EQ"
              size={20}
            />
            <ActionIconButton
              icon={IconMicrophone}
              onClick={toggleLyrics}
              title="Lyrics"
              size={20}
            />
            <ActionIconButton
              icon={IconPlaylist}
              onClick={toggleQueue}
              title="Queue"
              size={20}
            />
            <ActionIconButton
              icon={IconSparkles}
              onClick={toggleRecommendations}
              title="Recommendations"
              size={20}
            />
          </div>
        </div>

        {/* Desktop/Tablet Layout: 5 Sections */}
        <div className="hidden sm:flex items-center w-full">
          {/* Section 1: Track Info (Left - Flexible) */}
          <div className="flex-1 min-w-0 basis-1/4">
            <motion.button
              onClick={togglePlayerExpanded}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
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
              className="flex items-center gap-2 min-w-0 py-1 px-2 rounded-lg transition-colors text-left w-full"
            >
              <motion.div
                layoutId="player-artwork"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 80) {
                    previous();
                  } else if (info.offset.x < -80) {
                    next();
                  }
                }}
                className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 bg-surface rounded-md flex items-center justify-center text-text-muted border border-border overflow-hidden cursor-grab active:cursor-grabbing"
              >
                {currentTrack.metadata?.coverArt ? (
                  <img
                    src={currentTrack.metadata.coverArt}
                    alt="Cover"
                    className="w-full h-full object-cover select-none pointer-events-none"
                    draggable="false"
                  />
                ) : (
                  <IconMusic size={24} stroke={1.5} />
                )}
              </motion.div>

              <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="relative overflow-hidden group/title">
                    <motion.div
                      layoutId="player-title"
                      className="font-medium text-sm leading-tight whitespace-nowrap"
                      style={{ display: "inline-block", minWidth: "100%" }}
                    >
                      <span className="block truncate">
                        {currentTrack.metadata?.title || "Unknown Title"}
                      </span>
                    </motion.div>
                  </div>

                  <div className="relative overflow-hidden group/artist mt-0.5">
                    <motion.div
                      layoutId="player-artist"
                      className="text-xs text-text-muted leading-tight whitespace-nowrap"
                      style={{ display: "inline-block", minWidth: "100%" }}
                    >
                      <span className="block truncate">
                        {formatArtists(currentTrack.metadata?.artist)}
                      </span>
                    </motion.div>
                  </div>
                </div>

                <div className="hidden xl:flex items-center flex-shrink-0">
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

          {/* Section 2: Center Playback Controls (Fixed Width) */}
          <div className="flex-none flex items-center justify-center gap-1 md:gap-2 mx-4">
            <div className="hidden lg:flex items-center">
              <RepeatButton
                size={18}
                mode={repeatMode}
                onClick={toggleRepeat}
              />
            </div>

            <SkipButton
              direction="prev"
              onClick={previous}
              size={20}
              className="p-1.5"
            />

            <PlayButton
              isPlaying={isPlaying}
              onClick={isPlaying ? pause : play}
              size="md"
              className="w-9 h-9 md:w-10 md:h-10"
            />

            <SkipButton
              direction="next"
              onClick={next}
              size={20}
              className="p-1.5"
            />

            <div className="hidden lg:flex items-center">
              <ShuffleButton
                size={18}
                isShuffled={isShuffled}
                onClick={toggleShuffle}
              />
            </div>
          </div>

          {/* Section 3: Right Controls (Right - Flexible) */}
          <div className="flex-1 min-w-0 basis-1/4 flex items-center justify-end gap-2 md:gap-3 px-2">
            <div className="text-xs text-text-muted tabular-nums hidden md:flex items-center font-sans h-10">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <div className="hidden lg:flex items-center">
              <EnhancedVolumeControl
                volume={volume}
                onVolumeChange={setVolume}
              />
            </div>

            <ActionIconButton
              icon={IconActivityHeartbeat}
              onClick={toggleVisualization}
              isActive={isVisualizationEnabled}
              title="Toggle Visualization"
              className="hidden md:flex p-1.5"
              size={20}
            />

            <ActionIconButton
              icon={IconAdjustmentsHorizontal}
              onClick={toggleEQ}
              title="Toggle EQ"
              className="hidden sm:flex p-1.5"
              size={20}
            />

            <ActionIconButton
              icon={IconMicrophone}
              onClick={toggleLyrics}
              title="Toggle Lyrics"
              className="hidden sm:flex p-1.5"
              size={20}
            />

            <ActionIconButton
              icon={IconPlaylist}
              onClick={toggleQueue}
              title="Toggle Queue"
              className="hidden sm:flex p-1.5"
              size={20}
            />

            <ActionIconButton
              icon={IconSparkles}
              onClick={toggleRecommendations}
              title="Toggle Recommendations"
              className="hidden sm:flex p-1.5"
              size={20}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
