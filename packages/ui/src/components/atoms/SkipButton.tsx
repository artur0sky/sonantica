/**
 * Skip Button Component
 *
 * Skip to next or previous track.
 * Atomic design: built on top of PlayerButton.
 */

import { IconPlayerSkipBack, IconPlayerSkipForward } from "@tabler/icons-react";
import { PlayerButton } from "./PlayerButton";

interface SkipButtonProps {
  direction: "prev" | "next";
  onClick: () => void;
  size?: number | "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  disabled?: boolean;
}

export function SkipButton({
  direction,
  onClick,
  size = "md",
  className,
  disabled = false,
}: SkipButtonProps) {
  const Icon =
    direction === "prev" ? IconPlayerSkipBack : IconPlayerSkipForward;

  return (
    <PlayerButton
      icon={Icon}
      onClick={onClick}
      size={size}
      className={className}
      disabled={disabled}
      title={direction === "prev" ? "Previous" : "Next"}
    />
  );
}
