import { motion, AnimatePresence } from "framer-motion";
import { IconPlayerPlay, IconPlayerPause } from "@tabler/icons-react";
import { cn } from "../../utils";
import { buttonAnimations } from "../../utils/animations";

interface PlayButtonProps {
  isPlaying: boolean;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PlayButton({
  isPlaying,
  onClick,
  size = "md",
  className,
}: PlayButtonProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 28,
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={buttonAnimations.hover}
      whileTap={buttonAnimations.tap}
      className={cn(
        "rounded-full flex items-center justify-center text-white shadow-lg bg-accent hover:bg-accent-hover transition-colors",
        sizeClasses[size],
        className
      )}
      aria-label={isPlaying ? "Pause" : "Play"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isPlaying ? "pause" : "play"}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.15 }}
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
              className="fill-current ml-0.5" // visual balancing
              stroke={0}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
