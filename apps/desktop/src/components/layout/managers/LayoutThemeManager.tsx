/**
 * Layout Theme Manager
 *
 * Manages theme extraction from cover art and applies CSS variables.
 * Wraps children with theme context without animations.
 *
 * Extracted from MainLayout.tsx to follow Atomic Design principles.
 * This component is responsible for:
 * - Extracting dominant color from current track cover art
 * - Calculating contrast color for text
 * - Applying CSS custom properties to the layout
 */

import { useMemo, type ReactNode } from "react";
import { usePlayerStore } from "@sonantica/player-core";
import { useLibraryStore } from "@sonantica/media-library";
import { useDominantColor } from "../../../hooks/useDominantColor";
import { cn } from "@sonantica/shared";

interface LayoutThemeManagerProps {
  children: ReactNode;
  className?: string;
  totalRightOffset: number;
}

export function LayoutThemeManager({
  children,
  className,
  totalRightOffset,
}: LayoutThemeManagerProps) {
  const { currentTrack } = usePlayerStore();
  const { tracks } = useLibraryStore();

  // Get full track data
  const fullTrack = useMemo(
    () => tracks.find((t) => t.id === currentTrack?.id),
    [tracks, currentTrack]
  );

  // Extract dominant color from cover art
  const { color: dominantColor, contrastColor } = useDominantColor(
    fullTrack?.coverArt
  );

  // Calculate muted color variant
  const mutedColor =
    contrastColor === "#ffffff" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";

  return (
    <div
      className={cn(
        "h-[100dvh] transition-all duration-300 flex flex-col bg-bg text-text overflow-hidden relative pt-0",
        className
      )}
      style={
        {
          "--alphabet-right": `${totalRightOffset}px`,
          "--dominant-color": dominantColor,
          "--contrast-color": contrastColor,
          "--color-accent-foreground": dominantColor,
          "--muted-color": mutedColor,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

// Export theme values for use in child components
export function useLayoutTheme() {
  const { currentTrack } = usePlayerStore();
  const { tracks } = useLibraryStore();

  const fullTrack = useMemo(
    () => tracks.find((t) => t.id === currentTrack?.id),
    [tracks, currentTrack]
  );

  const { color: dominantColor, contrastColor } = useDominantColor(
    fullTrack?.coverArt
  );

  const mutedColor =
    contrastColor === "#ffffff" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";

  return {
    dominantColor,
    contrastColor,
    mutedColor,
    fullTrack,
  };
}
