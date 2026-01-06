/**
 * Mini Player Component
 *
 * Sticky bottom player inspired by SoundCloud.
 * "Functional elegance" - minimal but complete controls.
 * Consistent with Sonántica's premium atomic system.
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
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <motion.div
            layoutId="player-artwork"
            onClick={togglePlayerExpanded}
            className="w-10 h-10 flex-shrink-0 bg-surface-elevated rounded-md flex items-center justify-center text-text-muted border border-white/5 overflow-hidden cursor-pointer active:scale-95 transition-transform"
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
        </div>

        {/* Section 2: Playback Controls (Center) */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mx-4">
          <div className="hidden lg:flex">
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

          <div className="hidden lg:flex">
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

          <ActionIconButton
            icon={IconActivityHeartbeat}
            onClick={toggleVisualization}
            isActive={isVisualizationEnabled}
            size="xs"
            title="Visualizer"
          />

          <ActionIconButton
            icon={IconAdjustmentsHorizontal}
            onClick={toggleEQ}
            size="xs"
            title="Equalizer"
          />

          <ActionIconButton
            icon={IconMicrophone}
            onClick={toggleLyrics}
            size="xs"
            title="Lyrics"
          />

          <ActionIconButton
            icon={IconPlaylist}
            onClick={toggleQueue}
            size="xs"
            title="Queue"
          />

          <ActionIconButton
            icon={IconSparkles}
            onClick={toggleRecommendations}
            size="xs"
            title="Discovery"
          />
        </div>
      </div>
    </motion.div>
  );
}
