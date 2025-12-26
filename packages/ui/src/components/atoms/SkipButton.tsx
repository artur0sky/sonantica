import { motion } from "framer-motion";
import { IconPlayerSkipBack, IconPlayerSkipForward } from "@tabler/icons-react";
import { cn } from "../../utils";
import { buttonAnimations } from "../../utils/animations";

interface SkipButtonProps {
  direction: "prev" | "next";
  onClick: () => void;
  size?: number;
  className?: string;
  disabled?: boolean;
}

export function SkipButton({
  direction,
  onClick,
  size = 24,
  className,
  disabled,
}: SkipButtonProps) {
  const Icon =
    direction === "prev" ? IconPlayerSkipBack : IconPlayerSkipForward;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={buttonAnimations.hover}
      whileTap={buttonAnimations.tap}
      className={cn(
        "text-text-muted transition-colors p-2 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      aria-label={direction === "prev" ? "Previous track" : "Next track"}
    >
      <Icon size={size} stroke={1.5} />
    </motion.button>
  );
}
