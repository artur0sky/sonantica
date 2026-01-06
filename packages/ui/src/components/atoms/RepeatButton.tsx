/**
 * Repeat Button Component
 *
 * Cycles through repeat modes: off → all → one
 * Atomic design: built on top of PlayerButton.
 */

import { IconRepeat, IconRepeatOnce } from "@tabler/icons-react";
import { PlayerButton } from "./PlayerButton";

export type RepeatMode = "off" | "all" | "one";

interface RepeatButtonProps {
  mode: RepeatMode;
  onClick: () => void;
  size?: number | "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function RepeatButton({
  mode,
  onClick,
  size = "sm",
  className,
}: RepeatButtonProps) {
  const Icon = mode === "one" ? IconRepeatOnce : IconRepeat;
  const isActive = mode !== "off";

  return (
    <PlayerButton
      icon={Icon}
      onClick={onClick}
      isActive={isActive}
      size={size}
      className={className}
      title={`Repeat: ${
        mode === "off" ? "Off" : mode === "all" ? "All" : "One"
      }`}
    />
  );
}
