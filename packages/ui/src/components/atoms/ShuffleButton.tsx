/**
 * Shuffle Button Component
 *
 * Toggle shuffle mode for queue playback.
 */

import { IconArrowsShuffle } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "../../utils";

interface ShuffleButtonProps {
  isShuffled: boolean;
  onClick: () => void;
  size?: number;
  className?: string;
}

export function ShuffleButton({
  isShuffled,
  onClick,
  size = 20,
  className,
}: ShuffleButtonProps) {
  // Store usage removed

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "transition-colors",
        isShuffled ? "text-accent" : "text-text-muted hover:text-text",
        className
      )}
      aria-label={isShuffled ? "Disable shuffle" : "Enable shuffle"}
      title={isShuffled ? "Shuffle: On" : "Shuffle: Off"}
    >
      <IconArrowsShuffle
        size={size}
        stroke={1.5}
        className={cn(
          "transition-all",
          isShuffled &&
            "drop-shadow-[0_0_8px_rgba(var(--color-accent-rgb),0.5)]"
        )}
      />
    </motion.button>
  );
}
