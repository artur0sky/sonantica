/**
 * Shuffle Button Component
 *
 * Toggle shuffle mode for queue playback.
 * Atomic design: built on top of PlayerButton.
 */

import { IconArrowsShuffle } from "@tabler/icons-react";
import { PlayerButton } from "./PlayerButton";

interface ShuffleButtonProps {
  isShuffled: boolean;
  onClick: () => void;
  size?: number | "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function ShuffleButton({
  isShuffled,
  onClick,
  size = "sm",
  className,
}: ShuffleButtonProps) {
  return (
    <PlayerButton
      icon={IconArrowsShuffle}
      onClick={onClick}
      isActive={isShuffled}
      size={size}
      className={className}
      title={isShuffled ? "Disable shuffle" : "Enable shuffle"}
    />
  );
}
