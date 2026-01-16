/**
 * PlaybackControls Component
 *
 * Unified playback control buttons (shuffle, prev, play/pause, next, repeat).
 * Reusable across MiniPlayer, ExpandedPlayer, and other player contexts.
 *
 * Follows Sonántica's minimalist design - "Sound deserves respect."
 */

import { useState, useRef } from "react";
import { RepeatMode } from "@sonantica/player-core";
import { ShuffleButton, RepeatButton, PlayButton, SkipButton } from "../atoms";
import { cn } from "../../utils";

export interface PlaybackControlsProps {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Whether playback is in a loading/buffering state */
  isLoading?: boolean;
  /** Current repeat mode */
  repeatMode: RepeatMode;
  /** Whether shuffle is enabled */
  isShuffled: boolean;
  /** Play handler */
  onPlay: () => void;
  /** Pause handler */
  onPause: () => void;
  /** Next track handler */
  onNext: () => void;
  /** Previous track handler */
  onPrevious: () => void;
  /** Toggle repeat mode handler */
  onToggleRepeat: () => void;
  /** Toggle shuffle handler */
  onToggleShuffle: () => void;
  /** Control size variant */
  size?: "sm" | "md" | "lg";
  /** Layout orientation */
  orientation?: "horizontal" | "vertical";
  /** Additional CSS classes */
  className?: string;
  /** Show shuffle/repeat buttons */
  showSecondaryControls?: boolean;
}

export function PlaybackControls({
  isPlaying,
  isLoading = false,
  repeatMode,
  isShuffled,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onToggleRepeat,
  onToggleShuffle,
  size = "md",
  orientation = "horizontal",
  className,
  showSecondaryControls = true,
}: PlaybackControlsProps) {
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce wrapper to prevent rapid clicks
  const withDebounce = (action: () => void) => {
    return () => {
      if (isActionInProgress || isLoading) return;

      setIsActionInProgress(true);
      action();

      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
      }

      actionTimeoutRef.current = setTimeout(() => {
        setIsActionInProgress(false);
      }, 300);
    };
  };
  // Button sizes based on variant
  const buttonSizes = {
    sm: { main: "md" as const, secondary: "sm" as const, side: "xs" as const },
    md: { main: "lg" as const, secondary: "md" as const, side: "sm" as const },
    lg: { main: "xl" as const, secondary: "lg" as const, side: "md" as const },
  };

  const sizes = buttonSizes[size];

  // Gap sizes
  const gaps = {
    sm: "gap-1",
    md: "gap-2 md:gap-4",
    lg: "gap-3 md:gap-6",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        orientation === "horizontal" ? gaps[size] : "flex-col gap-4",
        className
      )}
    >
      {/* Repeat Button */}
      {showSecondaryControls && (
        <div className="flex">
          <RepeatButton
            mode={repeatMode}
            onClick={onToggleRepeat}
            size={sizes.side}
          />
        </div>
      )}

      {/* Previous Button */}
      <SkipButton
        direction="prev"
        onClick={withDebounce(onPrevious)}
        size={sizes.secondary}
        disabled={isActionInProgress || isLoading}
      />

      {/* Play/Pause Button */}
      <PlayButton
        isPlaying={isPlaying}
        onClick={withDebounce(isPlaying ? onPause : onPlay)}
        size={sizes.main}
        className="shadow-accent/20"
        isLoading={isLoading}
        disabled={isActionInProgress}
      />

      {/* Next Button */}
      <SkipButton
        direction="next"
        onClick={withDebounce(onNext)}
        size={sizes.secondary}
        disabled={isActionInProgress || isLoading}
      />

      {/* Shuffle Button */}
      {showSecondaryControls && (
        <div className="flex">
          <ShuffleButton
            isShuffled={isShuffled}
            onClick={onToggleShuffle}
            size={sizes.side}
          />
        </div>
      )}
    </div>
  );
}
