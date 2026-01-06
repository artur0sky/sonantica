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
  ArtistPhotoSection,
  WidgetsSection,
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
  onLongPressArt?: () => void;
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
    <div className="lg:hidden flex flex-col h-full bg-transparent overflow-hidden overscroll-none select-none pt-[max(env(safe-area-inset-top),2rem)] lg:pt-[env(safe-area-inset-top)]">
      {/* Mobile Sticky Header - Always on top */}
      <header className="h-14 flex flex-none justify-between items-center px-6 md:px-12 border-b border-white/5 bg-[var(--color-surface-elevated)] backdrop-blur-xl z-30">
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

      {/* Parallax/Scroll Container */}
      <div className="flex-1 overflow-y-auto scrollbar-none relative">
        {/* STICKY BACK: Cover Art Section */}
        <div className="sticky top-0 h-[46dvh] flex items-start justify-center p-6 z-0">
          <CoverArtSection
            coverArt={currentTrack.metadata?.coverArt}
            trackTitle={currentTrack.metadata?.title || "Unknown"}
            enableGestures
            onNext={onNext}
            onPrevious={onPrevious}
            onLongPress={onLongPressArt}
          />
        </div>

        {/* SCROLLING OVER: Content Area */}
        <div className="relative z-10 flex flex-col">
          {/* Main Info & Controls Overlay (Initially reveals the cover art, then overlays it) */}
          <div className="flex flex-col gap-8 px-6 md:px-16 lg:px-24 pb-12 bg-gradient-to-t from-black via-black/95 to-transparent pt-32 -mt-32">
            {/* Track Info */}
            <div className="flex flex-col gap-4">
              <div className="text-center w-full">
                <motion.h1
                  layoutId="player-title-mobile"
                  className="text-2xl md:text-4xl font-black tracking-tight line-clamp-2"
                >
                  {currentTrack.metadata?.title || "Unknown Title"}
                </motion.h1>
                <motion.p
                  layoutId="player-artist-mobile"
                  className="text-lg md:text-2xl text-text-muted font-bold mt-1"
                >
                  {formatArtists(currentTrack.metadata?.artist)}
                </motion.p>
              </div>

              <div className="flex items-center justify-between w-full px-4">
                <TrackRating
                  trackId={currentTrack.id}
                  mode="both"
                  size={22}
                  compact
                  className="p-1"
                />
                {actionButtons && (
                  <div className="flex items-center">{actionButtons}</div>
                )}
              </div>
            </div>

            {/* Controls Area */}
            <div className="flex flex-col gap-6">
              <div className="px-1">
                <TimelineSection
                  trackId={currentTrack.id}
                  currentTime={currentTime}
                  duration={duration}
                  onSeek={onSeek}
                />
              </div>

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

              <NavigationFooter
                recommendationsOpen={recommendationsOpen}
                isQueueOpen={isQueueOpen}
                onToggleRecommendations={onToggleRecommendations}
                onToggleLyrics={onToggleLyrics}
                onToggleQueue={onToggleQueue}
              />
            </div>
          </div>

          {/* WIDGETS Section (Scrolling Over) */}
          <div className="bg-black flex flex-col gap-12 px-6 md:px-16 lg:px-24 py-12 border-t border-white/5 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
            <ArtistPhotoSection />
            <WidgetsSection />

            {/* Extra spacer for scroll freedom */}
            <div className="h-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
