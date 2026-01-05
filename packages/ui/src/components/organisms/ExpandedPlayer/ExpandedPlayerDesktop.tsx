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
}: DesktopLayoutProps) {
  return (
    <div className="hidden lg:grid lg:grid-cols-[1fr_1.618fr] lg:gap-8 xl:gap-12 h-full p-8 xl:p-12 max-w-screen-2xl mx-auto">
      {/* LEFT: Pure Cover Art - Gallery Style (Golden Ratio: 1) */}
      <CoverArtSection
        coverArt={currentTrack.metadata?.coverArt}
        trackTitle={currentTrack.metadata?.title || "Unknown"}
        enableGestures={false}
      />

      {/* RIGHT: Info Grid (Golden Ratio: φ ≈ 1.618) */}
      <div className="grid grid-rows-[auto_1fr_auto] gap-6 xl:gap-8 min-h-0">
        {/* Top: Header */}
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

        {/* Middle: 2-Column Grid (Info:Widgets using Golden Ratio φ) */}
        <div className="grid grid-cols-[1.618fr_1fr] gap-6 xl:gap-8 min-h-0">
          {/* INFO Section */}
          <InfoSection
            title={currentTrack.metadata?.title || "Unknown Title"}
            artist={formatArtists(currentTrack.metadata?.artist)}
            album={currentTrack.metadata?.album}
            trackId={currentTrack.id}
            actionButtons={actionButtons}
          />

          {/* RIGHT Column: Artist Photo + Widgets */}
          <div className="grid grid-rows-[1fr_1fr] gap-6 xl:gap-8">
            <ArtistPhotoSection />
            <WidgetsSection />
          </div>
        </div>

        {/* Bottom: Controls */}
        <div className="flex flex-col gap-6">
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
          />
        </div>
      </div>
    </div>
  );
}
