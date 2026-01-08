/**
 * MiniPlayer Component
 *
 * Compact player bar with playback controls and track information.
 * Refactored to use atomic components and CSS animations (no Framer Motion).
 *
 * "Sound deserves respect" - Sonántica's minimalist player interface.
 */

import { usePlayerStore, useQueueStore } from "@sonantica/player-core";
import { useUIStore } from "../../stores/uiStore";
import { useAnalyzerStore, useWaveformStore } from "@sonantica/audio-analyzer";
import {
  EnhancedVolumeControl,
  WaveformScrubber,
  BackgroundSpectrum,
  TrackInfo,
  PlaybackControls,
  SidebarButtonCarousel,
} from "../molecules";
import { formatTime, PlaybackState } from "@sonantica/shared";
import {
  IconActivityHeartbeat,
  IconMicrophone,
  IconAdjustmentsHorizontal,
  IconPlaylist,
  IconSparkles,
} from "@tabler/icons-react";

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

  // Sidebar buttons configuration
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

  // Audio visualization data
  const getWaveform = useWaveformStore((state: any) => state.getWaveform);
  const spectrum = useAnalyzerStore((state: any) => state.spectrum);
  const bands = spectrum
    ? spectrum.bands.map((b: any) => b.amplitude)
    : undefined;

  if (!currentTrack) return null;

  const isPlaying = state === PlaybackState.PLAYING;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-black/95 backdrop-blur-xl border-t border-white/5 animate-in slide-in-from-bottom-4 duration-300">
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
          <TrackInfo
            coverArt={currentTrack.metadata?.coverArt}
            title={currentTrack.metadata?.title || "Unknown Title"}
            artist={currentTrack.metadata?.artist || "Unknown Artist"}
            onClick={togglePlayerExpanded}
            enableSwipeGesture
            onSwipeLeft={next}
            onSwipeRight={previous}
            coverSize="md"
          />

          {/* Action Buttons (Download, etc.) */}
          {actionButtons && (
            <div className="hidden sm:flex items-center gap-1 ml-2">
              {actionButtons}
            </div>
          )}
        </div>

        {/* Section 2: Playback Controls (Center) */}
        <PlaybackControls
          isPlaying={isPlaying}
          repeatMode={repeatMode}
          isShuffled={isShuffled}
          onPlay={play}
          onPause={pause}
          onNext={next}
          onPrevious={previous}
          onToggleRepeat={toggleRepeat}
          onToggleShuffle={toggleShuffle}
          size="sm"
          className="mx-4"
        />

        {/* Section 3: Right Controls */}
        <div className="flex-1 flex items-center justify-end gap-1 md:gap-2">
          {/* Time Display */}
          <div className="text-[11px] text-text-muted tabular-nums hidden xl:block font-medium mr-4">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          {/* Volume Control */}
          <div className="hidden md:flex">
            <EnhancedVolumeControl
              volume={volume}
              onVolumeChange={setVolume}
              size="sm"
            />
          </div>

          {/* Sidebar Button Carousel */}
          <SidebarButtonCarousel
            buttons={sidebarButtons}
            enableSwipe
            defaultFeaturedIndex={3} // Queue button
            size="xs"
          />
        </div>
      </div>
    </div>
  );
}
