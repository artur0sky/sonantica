/**
 * ScanButton Atom
 *
 * Reusable scan/analyze button for library operations.
 * Following Sonántica's minimalist design.
 */

import { motion } from "framer-motion";
import { IconRefresh, IconX } from "@tabler/icons-react";
import { cn } from "../../utils/cn";

interface ScanButtonProps {
  scanning?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  label?: string;
  scanningLabel?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ScanButton({
  scanning = false,
  variant = "secondary",
  size = "md",
  className,
  label = "Scan",
  scanningLabel = "Cancel",
  disabled,
  onClick,
}: ScanButtonProps) {
  const variantClasses = {
    primary: scanning
      ? "bg-error text-white hover:bg-error/90"
      : "bg-accent text-white hover:bg-accent-hover",
    secondary: scanning
      ? "bg-error/10 text-error hover:bg-error/20 border border-error/30"
      : "bg-surface-elevated hover:bg-accent hover:text-white border border-border",
    ghost: scanning
      ? "text-error hover:bg-error/10"
      : "hover:bg-surface-elevated",
  };

  const sizeClasses = {
    sm: "h-8 px-3 text-sm gap-1.5",
    md: "h-10 px-4 text-base gap-2",
    lg: "h-12 px-6 text-lg gap-2.5",
  };

  const iconSize = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled}
    >
      <motion.div
        animate={{ rotate: scanning ? 360 : 0 }}
        transition={{
          duration: scanning ? 1 : 0.3,
          repeat: scanning ? Infinity : 0,
          ease: "linear",
        }}
      >
        {scanning ? (
          <IconX size={iconSize[size]} stroke={2} />
        ) : (
          <IconRefresh size={iconSize[size]} stroke={1.5} />
        )}
      </motion.div>
      <span>{scanning ? scanningLabel : label}</span>
    </motion.button>
  );
}
