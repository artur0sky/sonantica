/**
 * Expanded Player - Mobile Layout (Template)
 * Traditional vertical layout with gesture interactions
 * Following Template pattern from Atomic Design
 */

import { motion } from "framer-motion";
import { PlayerButton } from "../../atoms";
import { TrackRating } from "../../molecules";
import { IconChevronDown, IconDots } from "@tabler/icons-react";
import { formatArtists } from "@sonantica/shared";
import {
  CoverArtSection,
  TimelineSection,
  ControlsSection,
  NavigationFooter,
} from "./sections";
import type { ExpandedPlayerProps } from "./types";

interface MobileLayoutProps extends ExpandedPlayerProps {
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

export function ExpandedPlayerMobile({
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
  onLongPressArt,
}: MobileLayoutProps) {
  return (
    <div className="lg:hidden flex flex-col h-full items-center px-4 py-8">
      {/* Mobile Header */}
      <header className="w-full flex justify-between items-center mb-4">
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

      {/* Cover Art with Gestures */}
      <CoverArtSection
        coverArt={currentTrack.metadata?.coverArt}
        trackTitle={currentTrack.metadata?.title || "Unknown"}
        enableGestures
        onNext={onNext}
        onPrevious={onPrevious}
        onLongPress={onLongPressArt}
      />

      {/* Controls */}
      <div className="w-full flex flex-col gap-4 pb-4">
        {/* Track Info */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex-1 min-w-0 text-center w-full">
            <motion.h1
              layoutId="player-title-mobile"
              className="text-2xl font-black tracking-tight line-clamp-2"
            >
              {currentTrack.metadata?.title || "Unknown Title"}
            </motion.h1>
            <motion.p
              layoutId="player-artist-mobile"
              className="text-lg text-text-muted font-bold mt-1"
            >
              {formatArtists(currentTrack.metadata?.artist)}
            </motion.p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 bg-white/5 p-2 rounded-2xl w-full">
            <TrackRating
              trackId={currentTrack.id}
              mode="both"
              size={22}
              compact
            />
            {actionButtons && (
              <>
                <div className="w-px h-4 bg-white/10 mx-1" />
                {actionButtons}
              </>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="px-2">
          <TimelineSection
            trackId={currentTrack.id}
            currentTime={currentTime}
            duration={duration}
            onSeek={onSeek}
          />
        </div>

        {/* Playback Controls */}
        <div className="px-2 mt-2">
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
            size="mobile"
          />
        </div>

        {/* Navigation Footer */}
        <div className="mt-4">
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
