/**
 * Player Button Atom
 *
 * Base atom for all playback control buttons.
 * Ensures strict consistency in size, style, colors, and animations.
 * Following Sonántica's "Functional Elegance" philosophy.
 */

import { motion } from "framer-motion";
import { cn } from "../../utils";
import { buttonAnimations, transitions } from "../../utils/animations";

export interface PlayerButtonProps {
  /** Icon component from @tabler/icons-react or similar */
  icon: React.ElementType;
  /** Click handler */
  onClick: (e: React.MouseEvent) => void;
  /** Whether the button is in an "active" or "on" state */
  isActive?: boolean;
  /** Custom active color class (e.g., text-accent) */
  activeColor?: string;
  /** Accessible title/tooltip */
  title?: string;
  /** Size preset or literal number (px) */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  /** Additional CSS classes */
  className?: string;
  /** Visual variant */
  variant?: "ghost" | "elevated" | "accent";
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Layout ID for Framer Motion transitions */
  layoutId?: string;
}

const sizeMap = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28,
  xl: 36,
};

export function PlayerButton({
  icon: Icon,
  onClick,
  isActive = false,
  activeColor = "text-accent",
  title,
  size = "md",
  className,
  variant = "ghost",
  disabled = false,
  layoutId,
}: PlayerButtonProps) {
  const iconSize = typeof size === "number" ? size : sizeMap[size];

  // Visual variants for the button container
  const variants = {
    ghost: "bg-transparent text-text-muted hover:text-text",
    elevated:
      "bg-surface-elevated hover:bg-surface border border-border text-text-muted hover:text-text",
    accent: "bg-accent hover:bg-accent-hover text-white shadow-lg",
  };

  return (
    <motion.button
      layoutId={layoutId}
      onClick={onClick}
      disabled={disabled}
      whileHover={
        !disabled
          ? {
              ...buttonAnimations.hover,
              scale: 1.1,
              transition: transitions.default,
            }
          : {}
      }
      whileTap={
        !disabled
          ? {
              ...buttonAnimations.tap,
              scale: 0.9,
              transition: transitions.default,
            }
          : {}
      }
      className={cn(
        "relative flex items-center justify-center rounded-full transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed group",
        variants[variant],
        isActive && !disabled ? activeColor : "",
        className
      )}
      title={title}
    >
      <Icon
        size={iconSize}
        stroke={1.5}
        className={cn(
          "transition-transform duration-200",
          isActive ? "scale-110" : "scale-100"
        )}
      />

      {/* Subtle indicator for active state (e.g. shuffle/repeat) */}
      {isActive && variant === "ghost" && (
        <motion.div
          layoutId={`${layoutId}-active-dot`}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        />
      )}
    </motion.button>
  );
}
