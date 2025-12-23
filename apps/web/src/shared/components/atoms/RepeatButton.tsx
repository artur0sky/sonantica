/**
 * Repeat Button Component
 *
 * Cycles through repeat modes: off → all → one
 * Follows Sonántica's "User Autonomy" principle
 */

import { motion } from "framer-motion";
import { IconRepeat, IconRepeatOnce } from "@tabler/icons-react";
import { useQueueStore } from "../../store/queueStore";
import { cn } from "../../utils";

export type RepeatMode = "off" | "all" | "one";

interface RepeatButtonProps {
  size?: number;
  className?: string;
}

export function RepeatButton({ size = 20, className }: RepeatButtonProps) {
  const { repeatMode, toggleRepeat } = useQueueStore();

  const getColor = () => {
    switch (repeatMode) {
      case "one":
        return "text-accent";
      case "all":
        return "text-accent";
      default:
        return "text-text-muted";
    }
  };

  const getIcon = () => {
    return repeatMode === "one" ? IconRepeatOnce : IconRepeat;
  };

  const Icon = getIcon();

  return (
    <motion.button
      onClick={toggleRepeat}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn("transition-colors", getColor(), className)}
      aria-label={`Repeat: ${repeatMode}`}
      title={`Repeat: ${
        repeatMode === "off" ? "Off" : repeatMode === "all" ? "All" : "One"
      }`}
    >
      <Icon size={size} stroke={1.5} />
    </motion.button>
  );
}
