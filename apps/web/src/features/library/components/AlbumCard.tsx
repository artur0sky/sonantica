/**
 * Album Card Component
 *
 * Grid item for album view
 */

import {
  IconPlaylistAdd,
  IconPlayerSkipForward,
  IconArrowsShuffle,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import {
  ContextMenu,
  useContextMenu,
  CoverArt,
  type ContextMenuItem,
} from "@sonantica/ui";
import { useQueueStore } from "@sonantica/player-core";
import { gpuAnimations } from "@sonantica/shared";

interface AlbumCardProps {
  album: any;
  onClick: () => void;
}

export function AlbumCard({ album, onClick }: AlbumCardProps) {
  const { addToQueue, playNext } = useQueueStore();
  const contextMenu = useContextMenu();

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
      <motion.div
        layout
        {...gpuAnimations.scaleIn}
        whileHover={{ transform: "translateY(-8px) scale(1.02)" }}
        whileTap={{ transform: "scale(0.98)" }}
        onClick={onClick}
        onContextMenu={contextMenu.handleContextMenu}
        onTouchStart={contextMenu.handleLongPressStart}
        onTouchEnd={contextMenu.handleLongPressEnd}
        onMouseDown={contextMenu.handleLongPressStart}
        onMouseUp={contextMenu.handleLongPressEnd}
        onMouseLeave={contextMenu.handleLongPressEnd}
        className="group cursor-pointer p-4 hover:bg-surface-elevated transition-colors"
      >
        {/* Album Art - PERFORMANCE: Lazy loaded with LRU cache */}
        <div className="aspect-square mb-4 flex items-center justify-center relative overflow-hidden">
          <CoverArt
            src={album.coverArt}
            alt={album.name}
            className="w-full h-full"
            iconSize={64}
          />

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Info */}
        <div className="text-center group-hover:text-left transition-all">
          <h3 className="font-semibold text-lg truncate mb-1 group-hover:text-accent transition-colors">
            {album.title || album.name}
          </h3>
          <p className="text-sm text-text-muted truncate">{album.artist}</p>
          <p className="text-xs text-text-muted/60 mt-2 font-mono">
            {album.year || "Unknown Year"} • {album.trackCount || 0} tracks
          </p>
        </div>
      </motion.div>

      {/* Context Menu */}
      <ContextMenu
        items={menuItems}
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={contextMenu.close}
      />
    </>
  );
}
