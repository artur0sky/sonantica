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
    <div className="lg:hidden flex flex-col h-[100dvh] bg-black">
      {/* Mobile Sticky Header - Positioned where the app navbar used to be */}
      <header className="h-14 flex flex-none justify-between items-center px-4 border-b border-white/5 bg-black/40 backdrop-blur-xl z-20">
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
            <span className="text-xs text-text-muted mt-0.5 line-clamp-1 max-w-[200px] font-medium text-center">
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

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col px-4 pt-4 pb-0">
        {/* Fibonacci Vertical Layout: φ² (cover) : φ (info) : 1 (controls) */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Cover Art - Fibonacci's Largest Square (φ² ≈ 2.618) */}
          <div className="flex-[2.618] flex items-center justify-center min-h-0">
            <CoverArtSection
              coverArt={currentTrack.metadata?.coverArt}
              trackTitle={currentTrack.metadata?.title || "Unknown"}
              enableGestures
              onNext={onNext}
              onPrevious={onPrevious}
              onLongPress={onLongPressArt}
            />
          </div>

          {/* Track Info - Golden Rectangle (φ ≈ 1.618) */}
          <div className="flex-[1.618] flex flex-col gap-3 min-h-0">
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

            <div className="flex items-center justify-between w-full px-2">
              <div className="bg-white/5 p-2 rounded-2xl">
                <TrackRating
                  trackId={currentTrack.id}
                  mode="both"
                  size={20}
                  compact
                />
              </div>
              {actionButtons && (
                <div className="bg-white/5 p-2 rounded-2xl">
                  {actionButtons}
                </div>
              )}
            </div>
          </div>

          {/* Controls - Unit Rectangle (1) */}
          <div className="flex-1 flex flex-col gap-6 justify-end pb-2">
            {/* Timeline */}
            <div className="px-1">
              <TimelineSection
                trackId={currentTrack.id}
                currentTime={currentTime}
                duration={duration}
                onSeek={onSeek}
              />
            </div>

            {/* Playback Controls */}
            <div className="px-1">
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
      </div>
    </div>
  );
}
