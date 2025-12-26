/**
 * Track Item Component
 *
 * Individual track row in lists.
 */

import {
  IconPlayerPlay,
  IconPlayerPause,
  IconMusic,
  IconPlaylistAdd,
  IconPlayerSkipForward,
  IconInfoCircle,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "@sonantica/shared";
import { usePlayerStore, useQueueStore } from "@sonantica/player-core";
import { useLibraryStore } from "@sonantica/media-library";
import { PlaybackState, formatArtists, formatTime } from "@sonantica/shared";
import { useEffect } from "react";
import { ContextMenu, useContextMenu, type ContextMenuItem } from "@sonantica/ui";

interface TrackItemProps {
  track: any;
  onClick: () => void;
}

export function TrackItem({ track, onClick }: TrackItemProps) {
  const { currentTrack, state } = usePlayerStore();
  const { addToQueue, playNext } = useQueueStore();

  const isCurrentTrack = currentTrack?.id === track.id;
  const isPlaying = isCurrentTrack && state === PlaybackState.PLAYING;
  const hydrateTrack = useLibraryStore((s) => s.hydrateTrack);

  // Context menu state
  const contextMenu = useContextMenu();

  // Context menu items
  const menuItems: ContextMenuItem[] = [
    {
      id: 'play-next',
      label: 'Play Next',
      icon: <IconPlayerSkipForward size={18} stroke={1.5} />,
      onClick: () => playNext(track),
    },
    {
      id: 'add-to-queue',
      label: 'Add to Queue',
      icon: <IconPlaylistAdd size={18} stroke={1.5} />,
      onClick: () => addToQueue(track),
    },
    {
      id: 'divider-1',
      label: '',
      divider: true,
      onClick: () => {},
    },
    {
      id: 'info',
      label: 'Track Info',
      icon: <IconInfoCircle size={18} stroke={1.5} />,
      onClick: () => {
        // TODO: Open track info modal
        console.log('Track info:', track);
      },
    },
  ];

  // Lazy hydration on appearance
  useEffect(() => {
    if (!track.metadata?.coverArt) {
      const timer = setTimeout(() => {
        hydrateTrack(track.id);
      }, 1000); // 1s delay for list items to avoid overhead during scroll
      return () => clearTimeout(timer);
    }
  }, [track.id, track.metadata?.coverArt, hydrateTrack]);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          scale: 1.01,
          backgroundColor: "var(--color-surface-elevated)",
          transition: { duration: 0.1 },
        }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        onContextMenu={contextMenu.handleContextMenu}
        onTouchStart={contextMenu.handleLongPressStart}
        onTouchEnd={contextMenu.handleLongPressEnd}
        onMouseDown={contextMenu.handleLongPressStart}
        onMouseUp={contextMenu.handleLongPressEnd}
        onMouseLeave={contextMenu.handleLongPressEnd}
        className={cn(
          "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors group border border-transparent",
          isCurrentTrack
            ? "bg-surface-elevated border-accent/20"
            : "hover:bg-surface-elevated/50"
        )}
      >
      {/* Album Art / Icon */}
      <div className="w-12 h-12 flex-shrink-0 relative rounded-md overflow-hidden bg-surface-elevated border border-border">
        {/* Cover Art or Music Icon */}
        {(() => {
          const libraryTracks = useLibraryStore.getState().tracks;
          const coverArt =
            track.metadata?.coverArt ||
            libraryTracks.find((t) => t.id === track.id)?.metadata?.coverArt;

          return coverArt ? (
            <img
              src={coverArt}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <IconMusic
                size={20}
                className="text-text-muted/30"
                stroke={1.5}
              />
            </div>
          );
        })()}

        {/* Play/Pause Overlay (Hover) */}
        <div
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center",
            "transition-opacity duration-200",
            "opacity-0 group-hover:opacity-100"
          )}
        >
          {isPlaying ? (
            <IconPlayerPause
              size={24}
              className="text-white fill-current drop-shadow-lg"
            />
          ) : (
            <IconPlayerPlay
              size={24}
              className="text-white fill-current drop-shadow-lg"
            />
          )}
        </div>

        {/* Current Track Indicator */}
        {isCurrentTrack && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent" />
        )}
      </div>

      {/* Track Details */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "font-medium truncate transition-colors",
            isCurrentTrack ? "text-accent" : "text-text"
          )}
        >
          {track.metadata?.title || track.filename}
        </div>
        <div className="text-sm text-text-muted truncate flex items-center gap-2">
          <span>{formatArtists(track.metadata?.artist)}</span>
          {track.metadata?.album && (
            <>
              <span className="opacity-40">•</span>
              <span className="opacity-80">{track.metadata.album}</span>
            </>
          )}
        </div>
      </div>

      {/* Duration (if available) - Optional */}
      {track.metadata?.duration && (
        <div className="text-sm text-text-muted font-mono variant-numeric-tabular">
          {formatTime(track.metadata.duration)}
        </div>
      )}
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
