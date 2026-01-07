/**
 * Artist Card Component
 *
 * Grid item for artist view - matches AlbumCard appearance
 */

import { motion } from "framer-motion";
import { ArtistImage } from "@sonantica/ui";
import { useLibraryStore } from "@sonantica/media-library";
import { useMemo } from "react";
import { cn } from "@sonantica/shared";
import { IconCircleCheckFilled } from "@tabler/icons-react";

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

  // Calculate actual album count from library
  const actualAlbumCount = useMemo(
    () => albums.filter((a) => a.artist === artist.name).length,
    [albums, artist.name]
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => {
        if (isInSelectionMode && onSelectionToggle) {
          onSelectionToggle(artist.id);
        } else {
          onClick();
        }
      }}
      className={cn(
        "group cursor-pointer p-4 rounded-xl transition-colors",
        selected &&
          "bg-accent/10 ring-2 ring-accent ring-offset-2 ring-offset-bg"
      )}
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
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
          <div className="text-white text-sm font-medium">View Artist</div>
        </div>
      </div>

      {/* Info */}
      <div className="text-center">
        <h3 className="font-semibold text-base truncate mb-1 group-hover:text-accent transition-colors">
          {artist.name}
        </h3>
        <p className="text-sm text-text-muted truncate">
          {actualAlbumCount} albums
        </p>
      </div>
    </motion.div>
  );
}
