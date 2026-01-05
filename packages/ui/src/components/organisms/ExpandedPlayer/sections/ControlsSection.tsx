/**
 * Controls Section (Molecule)
 * Playback controls cluster
 * Reusable across mobile and desktop layouts
 */

import {
  PlayButton,
  SkipButton,
  ShuffleButton,
  RepeatButton,
} from "../../../atoms";
import type { ControlsSectionProps } from "../types";

interface ControlsSectionInternalProps extends ControlsSectionProps {
  /** Size variant for different layouts */
  size?: "mobile" | "desktop";
}

export function ControlsSection({
  isPlaying,
  isShuffled,
  repeatMode,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onToggleShuffle,
  onToggleRepeat,
  size = "mobile",
}: ControlsSectionInternalProps) {
  const playButtonSize =
    size === "desktop" ? "w-20 h-20 xl:w-24 xl:h-24" : "w-16 h-16";
  const gapSize = size === "desktop" ? "gap-8 xl:gap-10" : "gap-4";

  return (
    <div className="flex items-center justify-between">
      <RepeatButton mode={repeatMode} onClick={onToggleRepeat} size="md" />

      <div className={`flex items-center ${gapSize}`}>
        <SkipButton
          direction="prev"
          onClick={onPrevious}
          size="xl"
          className="hover:text-text"
        />
        <PlayButton
          isPlaying={isPlaying}
          onClick={isPlaying ? onPause : onPlay}
          size="xl"
          variant="accent"
          className={`shadow-2xl shadow-accent/40 ${playButtonSize}`}
        />
        <SkipButton
          direction="next"
          onClick={onNext}
          size="xl"
          className="hover:text-text"
        />
      </div>

      <ShuffleButton
        isShuffled={isShuffled}
        onClick={onToggleShuffle}
        size="md"
      />
    </div>
  );
}
