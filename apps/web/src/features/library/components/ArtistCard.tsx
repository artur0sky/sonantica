import { ArtistImage, MediaCard } from "@sonantica/ui";
import { useLibraryStore } from "@sonantica/media-library";
import { useMemo } from "react";

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
  selected = false,
  isInSelectionMode = false,
  onSelectionToggle,
}: ArtistCardProps) {
  const albums = useLibraryStore((s) => s.albums);

  // Calculate actual album count from library
  const actualAlbumCount = useMemo(
    () => albums.filter((a) => a.artist === artist.name).length,
    [albums, artist.name]
  );

  return (
    <MediaCard
      title={artist.name}
      subtitle={`${actualAlbumCount} album${actualAlbumCount !== 1 ? "s" : ""}`}
      image={
        <ArtistImage
          src={undefined} // Artists don't have images yet
          alt={artist.name}
          className="w-full h-full"
          iconSize={48}
        />
      }
      imageShape="circle"
      onClick={() => {
        if (isInSelectionMode && onSelectionToggle) {
          onSelectionToggle(artist.id);
        } else {
          onClick();
        }
      }}
      selected={selected}
      isSelectionMode={isInSelectionMode}
      hoverOverlay={
        <div className="text-white text-sm font-medium">View Artist</div>
      }
    />
  );
}
