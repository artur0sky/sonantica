/**
 * CoverArt Component
 *
 * Official atom for displaying album/track artwork across the application.
 * Enforces "no border-radius" and provides consistent fallback and loading states.
 */

import { memo } from "react";
import { LazyAlbumArt } from "./LazyAlbumArt";
import { cn } from "../../utils";

interface CoverArtProps {
  src?: string;
  alt?: string;
  className?: string;
  iconSize?: number;
  /** Whether to show a subtle shine effect */
  shine?: boolean;
  /** Whether to show a subtle shadow (for Expanded Player) */
  shadow?: boolean;
  /** Custom fallback icon */
  fallbackIcon?: React.ComponentType<{
    size?: number;
    className?: string;
    stroke?: number;
  }>;
  /** Whether this is a high-priority image (e.g. LCP) */
  priority?: boolean;
}

export const CoverArt = memo(function CoverArt({
  src,
  alt = "Cover Art",
  className,
  iconSize = 24,
  shine = false,
  shadow = false,
  fallbackIcon,
  priority = false, // Default false
}: CoverArtProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-elevated aspect-square select-none",
        // Enforce no border radius globally
        "rounded-none",
        shadow && "shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      <LazyAlbumArt
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        iconSize={iconSize}
        fallbackIcon={fallbackIcon}
        priority={priority}
      />

      {shine && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
      )}
    </div>
  );
});
