import { motion } from "framer-motion";
import { IconPlayerSkipBack, IconPlayerSkipForward } from "@tabler/icons-react";
import { cn } from "../../utils";

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
      whileHover={{ scale: 1.1, color: "var(--color-text)" }}
      whileTap={{ scale: 0.9 }}
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
