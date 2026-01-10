/**
 * Artist Image Atom
 *
 * Unified component for rendering artist images/avatars.
 * Enforces consistent styling (circular) and fallback behavior.
 * Wraps LazyAlbumArt internally for lazy loading support.
 */

import { memo } from "react";
import { IconMicrophone } from "@tabler/icons-react";
import { cn } from "../../utils";
import { LazyAlbumArt } from "./LazyAlbumArt";

interface ArtistImageProps {
  /** Artist image URL */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Additional CSS classes */
  className?: string;
  /** Size of the fallback icon */
  iconSize?: number;
  /** Whether to show a subtle shine effect */
  shine?: boolean;
  /** Whether this is a high-priority image (e.g. LCP) */
  priority?: boolean;
}

export const ArtistImage = memo(function ArtistImage({
  src,
  alt = "Artist",
  className,
  iconSize = 48,
  shine = false,
  priority = false, // Default false
}: ArtistImageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-elevated aspect-square select-none",
        // Enforce circular shape for artists
        "rounded-full",
        className
      )}
    >
      {src ? (
        <LazyAlbumArt
          src={src}
          alt={alt}
          className="w-full h-full"
          priority={priority}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <IconMicrophone
            size={iconSize}
            className="text-text-muted/30"
            stroke={1.5}
          />
        </div>
      )}

      {/* Optional shine effect */}
      {shine && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
      )}
    </div>
  );
});
