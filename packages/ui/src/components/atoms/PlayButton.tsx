/**
 * Play Button Component
 *
 * Primary playback control.
 * Atomic design: aligned with PlayerButton logic.
 */

import { motion, AnimatePresence } from "framer-motion";
import { IconPlayerPlay, IconPlayerPause } from "@tabler/icons-react";
import { cn } from "../../utils";
import { buttonAnimations, transitions } from "../../utils/animations";

interface PlayButtonProps {
  isPlaying: boolean;
  onClick: () => void;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "accent" | "ghost";
}

export function PlayButton({
  isPlaying,
  onClick,
  size = "md",
  className,
  variant = "accent",
}: PlayButtonProps) {
  const sizeClasses = {
    sm: "w-9 h-9",
    md: "w-11 h-11",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 32,
    xl: 40,
  };

  const variantClasses = {
    accent: "bg-accent hover:bg-accent-hover text-white shadow-xl",
    ghost: "bg-transparent text-text hover:bg-white/5",
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ ...buttonAnimations.hover, scale: 1.05 }}
      whileTap={{ ...buttonAnimations.tap, scale: 0.95 }}
      className={cn(
        "rounded-full flex items-center justify-center transition-all duration-200",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      aria-label={isPlaying ? "Pause" : "Play"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isPlaying ? "pause" : "play"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={transitions.default}
        >
          {isPlaying ? (
            <IconPlayerPause
              size={iconSizes[size]}
              className="fill-current"
              stroke={0}
            />
          ) : (
            <IconPlayerPlay
              size={iconSizes[size]}
              className={cn("fill-current", variant === "accent" && "ml-1")}
              stroke={0}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
