import {
  IconPlaylistAdd,
  IconPlayerSkipForward,
  IconArrowsShuffle,
} from "@tabler/icons-react";
import {
  ContextMenu,
  useContextMenu,
  CoverArt,
  MediaCard,
  type ContextMenuItem,
} from "@sonantica/ui";
import { useQueueStore } from "@sonantica/player-core";
import { useLibraryStore } from "@sonantica/media-library";
import { useMemo } from "react";
import { useSelectionStore } from "../../../stores/selectionStore";

interface AlbumCardProps {
  album: any;
  onClick: () => void;
}

export function AlbumCard({ album, onClick }: AlbumCardProps) {
  const { addToQueue, playNext } = useQueueStore();
  const contextMenu = useContextMenu();
  const tracks = useLibraryStore((s) => s.tracks);

  // Selection state
  const { isSelectionMode, itemType, toggleSelection, isSelected } =
    useSelectionStore();
  const isInSelectionMode = isSelectionMode && itemType === "album";
  const selected = isInSelectionMode && isSelected(album.id);

  // Calculate actual track count from library
  const actualTrackCount = useMemo(
    () =>
      tracks.filter((t) => t.album === album.title && t.artist === album.artist)
        .length,
    [tracks, album.title, album.artist]
  );

  // Context menu items
  const menuItems: ContextMenuItem[] = [
    {
      id: "play-next",
      label: "Play Album Next",
      icon: <IconPlayerSkipForward size={18} stroke={1.5} />,
      onClick: () => {
        if (album.tracks && album.tracks.length > 0) {
          playNext(album.tracks);
        }
      },
    },
    {
      id: "add-to-queue",
      label: "Add Album to Queue",
      icon: <IconPlaylistAdd size={18} stroke={1.5} />,
      onClick: () => {
        if (album.tracks && album.tracks.length > 0) {
          addToQueue(album.tracks);
        }
      },
    },
    {
      id: "shuffle",
      label: "Shuffle Album",
      icon: <IconArrowsShuffle size={18} stroke={1.5} />,
      onClick: () => {
        // TODO: Implement shuffle album
        console.log("Shuffle album:", album);
      },
    },
  ];

  return (
    <>
      <MediaCard
        title={album.title || album.name}
        subtitle={
          <div className="flex flex-col gap-0.5 mt-1">
            <span className="truncate opacity-90">{album.artist}</span>
            <span className="text-xs opacity-60 font-mono">
              {album.year || "Unknown Year"} • {actualTrackCount} tracks
            </span>
          </div>
        }
        image={
          <CoverArt
            src={album.coverArt}
            alt={album.name}
            className="w-full h-full"
            iconSize={64}
          />
        }
        onClick={() => {
          if (isInSelectionMode) {
            toggleSelection(album.id);
          } else {
            onClick();
          }
        }}
        selected={selected}
        isSelectionMode={isInSelectionMode}
        onContextMenu={contextMenu.handleContextMenu}
        onMouseDown={contextMenu.handleLongPressStart}
        onMouseUp={contextMenu.handleLongPressEnd}
        onMouseLeave={contextMenu.handleLongPressEnd}
        onTouchStart={contextMenu.handleLongPressStart}
        onTouchEnd={contextMenu.handleLongPressEnd}
      />

      <ContextMenu
        items={menuItems}
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={contextMenu.close}
      />
    </>
  );
}
