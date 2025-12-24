/**
 * Repeat Button Component
 *
 * Cycles through repeat modes: off → all → one
 * Follows Sonántica's "User Autonomy" principle
 */

import { motion } from "framer-motion";
import { IconRepeat, IconRepeatOnce } from "@tabler/icons-react";
import { cn } from "../../utils";

export type RepeatMode = "off" | "all" | "one";

interface RepeatButtonProps {
  mode: RepeatMode;
  onClick: () => void;
  size?: number;
  className?: string;
}

export function RepeatButton({
  mode,
  onClick,
  size = 20,
  className,
}: RepeatButtonProps) {
  // const { repeatMode, toggleRepeat } = useQueueStore(); // Removed

  const getColor = () => {
    switch (mode) {
      case "one":
        return "text-accent";
      case "all":
        return "text-accent";
      default:
        return "text-text-muted";
    }
  };

  const getIcon = () => {
    return mode === "one" ? IconRepeatOnce : IconRepeat;
  };

  const Icon = getIcon();

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn("transition-colors", getColor(), className)}
      aria-label={`Repeat: ${mode}`}
      title={`Repeat: ${
        mode === "off" ? "Off" : mode === "all" ? "All" : "One"
      }`}
    >
      <Icon size={size} stroke={1.5} />
    </motion.button>
  );
}
