/**
 * Expanded Player - Desktop Layout (Template)
 * Gallery-style grid layout with pure cover art
 * Following Template pattern from Atomic Design
 */

import { PlayerButton } from "../../atoms";
import { IconChevronDown, IconDots } from "@tabler/icons-react";
import { formatArtists } from "@sonantica/shared";
import {
  CoverArtSection,
  InfoSection,
  ArtistPhotoSection,
  WidgetsSection,
  TimelineSection,
  ControlsSection,
  NavigationFooter,
  ScientificModeSection,
} from "./sections";
import type { ExpandedPlayerProps } from "./types";

interface DesktopLayoutProps extends ExpandedPlayerProps {
  currentTrack: any;
  isPlaying: boolean;
  isShuffled: boolean;
  repeatMode: "off" | "all" | "one";
  currentTime: number;
  duration: number;
  recommendationsOpen: boolean;
  isQueueOpen: boolean;
  scientificMode?: boolean;
  onClose: () => void;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleRecommendations: () => void;
  onToggleLyrics: () => void;
  onToggleQueue: () => void;
  onToggleScientificMode?: () => void;
}

export function ExpandedPlayerDesktop({
  currentTrack,
  isPlaying,
  isShuffled,
  repeatMode,
  currentTime,
  duration,
  recommendationsOpen,
  isQueueOpen,
  actionButtons,
  onClose,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  onToggleRecommendations,
  onToggleLyrics,
  onToggleQueue,
  onToggleScientificMode,
  scientificMode,
}: DesktopLayoutProps) {
  return (
    <div className="hidden lg:grid lg:grid-cols-[1.618fr_1fr] lg:gap-12 xl:gap-20 h-full p-8 xl:p-12 2xl:p-16 max-w-screen-2xl mx-auto items-stretch overflow-hidden">
      {/* LEFT: Pure Cover Art OR Scientific Mode */}
      {scientificMode ? (
        <ScientificModeSection />
      ) : (
        <CoverArtSection
          coverArt={currentTrack.metadata?.coverArt}
          trackTitle={currentTrack.metadata?.title || "Unknown"}
          enableGestures={false}
        />
      )}

      {/* RIGHT: Content Column */}
      <div className="grid grid-rows-[auto_1fr] gap-8 min-h-0 overflow-hidden">
        {/* TOP RIGHT: Info Section (φ rectangle) */}
        <div className="flex flex-col gap-4 xl:gap-6 min-h-0">
          {/* Header */}
          <header className="flex justify-between items-center">
            <PlayerButton
              icon={IconChevronDown}
              onClick={onClose}
              size="lg"
              title="Minimize"
            />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-black opacity-60">
                Now Playing
              </span>
            </div>
            <PlayerButton
              icon={IconDots}
              onClick={() => {}}
              size="lg"
              title="More Options"
            />
          </header>

          {/* Track Info */}
          <InfoSection
            title={currentTrack.metadata?.title || "Unknown Title"}
            artist={formatArtists(currentTrack.metadata?.artist)}
            album={currentTrack.metadata?.album}
            trackId={currentTrack.id}
            actionButtons={actionButtons}
          />
        </div>

        {/* BOTTOM RIGHT: Controls & Widgets (1 rectangle) */}
        <div className="flex flex-col gap-4 xl:gap-6 justify-between">
          {/* Widgets Grid (Artist Photo + Widgets) */}
          <div className="grid grid-cols-2 gap-4 xl:gap-6">
            <ArtistPhotoSection />
            <WidgetsSection />
          </div>

          {/* Timeline */}
          <TimelineSection
            trackId={currentTrack.id}
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
          />

          {/* Playback Controls */}
          <ControlsSection
            isPlaying={isPlaying}
            isShuffled={isShuffled}
            repeatMode={repeatMode}
            onPlay={onPlay}
            onPause={onPause}
            onNext={onNext}
            onPrevious={onPrevious}
            onToggleShuffle={onToggleShuffle}
            onToggleRepeat={onToggleRepeat}
            size="desktop"
          />

          {/* Navigation Footer */}
          <NavigationFooter
            recommendationsOpen={recommendationsOpen}
            isQueueOpen={isQueueOpen}
            onToggleRecommendations={onToggleRecommendations}
            onToggleLyrics={onToggleLyrics}
            onToggleQueue={onToggleQueue}
            scientificMode={scientificMode}
            onToggleScientificMode={onToggleScientificMode}
          />
        </div>
      </div>
    </div>
  );
}
