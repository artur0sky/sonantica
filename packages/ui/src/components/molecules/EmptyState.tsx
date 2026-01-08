/**
 * EmptyState Component
 *
 * Generic empty state component for displaying when no data is available.
 * Follows Sonántica's minimalist design philosophy.
 * Optimized with CSS-only animations for better performance.
 */

import type { ReactNode } from "react";
import { cn } from "@sonantica/shared";

export interface EmptyStateProps {
  /** Icon to display (ReactNode for flexibility) */
  icon?: ReactNode;
  /** Main title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Action button or link */
  action?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Variant for different styles */
  variant?: "default" | "compact" | "minimal";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  const isCompact = variant === "compact";
  const isMinimal = variant === "minimal";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "animate-in fade-in slide-in-from-bottom-4 duration-300",
        "gpu-accelerated",
        !isMinimal &&
          "bg-surface/50 border border-border/50 rounded-2xl border-dashed",
        isCompact
          ? "py-12 px-4"
          : isMinimal
          ? "py-8 px-4"
          : "py-16 sm:py-24 px-4",
        className
      )}
    >
      {/* Icon Container */}
      {icon && (
        <div
          className={cn(
            "inline-flex items-center justify-center bg-surface-elevated rounded-full text-accent",
            "animate-in zoom-in duration-500 delay-150",
            isCompact
              ? "p-3 mb-3"
              : isMinimal
              ? "p-2 mb-2"
              : "p-4 sm:p-6 mb-4 sm:mb-6"
          )}
        >
          {icon}
        </div>
      )}

      {/* Title */}
      {title && (
        <h3
          className={cn(
            "font-semibold mb-2",
            isCompact
              ? "text-base"
              : isMinimal
              ? "text-sm"
              : "text-lg sm:text-xl"
          )}
        >
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <p
          className={cn(
            "text-text-muted max-w-md",
            isCompact
              ? "text-xs mb-4"
              : isMinimal
              ? "text-xs mb-3"
              : "text-sm sm:text-base mb-6 sm:mb-8"
          )}
        >
          {description}
        </p>
      )}

      {/* Action */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
