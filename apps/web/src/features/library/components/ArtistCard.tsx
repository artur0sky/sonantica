/**
 * Artist Card Component
 *
 * Grid item for artist view - matches AlbumCard appearance
 * Optimized for INP with CSS-only animations
 */

import { ArtistImage } from "@sonantica/ui";
import { useLibraryStore } from "@sonantica/media-library";
import { useMemo } from "react";
import { cn } from "@sonantica/shared";
import { IconCircleCheckFilled } from "@tabler/icons-react";
import { useAnimationSettings } from "../../../hooks/useAnimationSettings";

interface ArtistCardProps {
  artist: any;
  onClick: () => void;
  selected?: boolean;
  isInSelectionMode?: boolean;
  onSelectionToggle?: (id: string) => void;
}

export function ArtistCard({
  artist,
  onClick,
  selected,
  isInSelectionMode,
  onSelectionToggle,
}: ArtistCardProps) {
  const albums = useLibraryStore((s) => s.albums);
  const { duration, hoverEnabled } = useAnimationSettings();

  // Calculate actual album count from library
  const actualAlbumCount = useMemo(
    () => albums.filter((a) => a.artist === artist.name).length,
    [albums, artist.name]
  );

  return (
    <div
      onClick={() => {
        if (isInSelectionMode && onSelectionToggle) {
          onSelectionToggle(artist.id);
        } else {
          onClick();
        }
      }}
      className={cn(
        "group cursor-pointer p-4 rounded-xl",
        "gpu-accelerated smooth-interaction",
        "transition-all",
        hoverEnabled &&
          "hover:bg-surface-elevated hover:-translate-y-2 hover:scale-[1.02]",
        "active:scale-[0.98]",
        selected &&
          "bg-accent/10 ring-2 ring-accent ring-offset-2 ring-offset-bg"
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transform: "translateZ(0)",
      }}
    >
      {/* Selection Checkbox Overlay */}
      {isInSelectionMode && (
        <div
          className={cn(
            "absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
            selected
              ? "bg-accent border-accent"
              : "bg-bg/80 backdrop-blur-sm border-white/30"
          )}
          style={{ transitionDuration: `${duration}ms` }}
        >
          {selected && (
            <IconCircleCheckFilled size={20} className="text-white" />
          )}
        </div>
      )}
      {/* Artist Image - Circular */}
      <div className="aspect-square mb-4 relative">
        <ArtistImage
          src={undefined} // Artists don't have images yet
          alt={artist.name}
          className="w-full h-full"
          iconSize={48}
        />

        {/* Hover Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black/40 rounded-full flex items-center justify-center",
            "transition-opacity",
            hoverEnabled ? "opacity-0 group-hover:opacity-100" : "opacity-0"
          )}
          style={{ transitionDuration: `${duration}ms` }}
        >
          <div className="text-white text-sm font-medium">View Artist</div>
        </div>
      </div>

      {/* Info */}
      <div className="text-center">
        <h3
          className={cn(
            "font-semibold text-base truncate mb-1 transition-colors",
            hoverEnabled && "group-hover:text-accent"
          )}
          style={{ transitionDuration: `${duration}ms` }}
        >
          {artist.name}
        </h3>
        <p className="text-sm text-text-muted truncate">
          {actualAlbumCount} albums
        </p>
      </div>
    </div>
  );
}
