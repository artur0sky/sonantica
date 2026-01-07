/**
 * Track Item Component
 *
 * Individual track row in lists.
 */

import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlaylistAdd,
  IconPlayerSkipForward,
  IconInfoCircle,
  IconCloudDownload,
  IconCircleCheckFilled,
  IconExclamationCircle,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { cn } from "@sonantica/shared";
import { usePlayerStore, useQueueStore } from "@sonantica/player-core";
import { useLibraryStore } from "@sonantica/media-library";
import { PlaybackState, formatArtists, formatTime } from "@sonantica/shared";
import { useEffect } from "react";
import {
  ContextMenu,
  useContextMenu,
  CoverArt,
  type ContextMenuItem,
} from "@sonantica/ui";
import { trackToMediaSource } from "../../../utils/streamingUrl";
import { useOfflineStore } from "@sonantica/offline-manager";
import { useSettingsStore } from "../../../stores/settingsStore";
import { OfflineStatus } from "@sonantica/shared";
import { useOfflineManager } from "../../../hooks/useOfflineManager";

interface TrackItemProps {
  track: any;
  onClick: () => void;
}

export function TrackItem({ track, onClick }: TrackItemProps) {
  const { currentTrack, state } = usePlayerStore();
  const { addToQueue, playNext } = useQueueStore();
  const { downloadTrack, removeTrack } = useOfflineManager();

  const iscurrentTrack = currentTrack?.id === track.id;
  const isPlaying = iscurrentTrack && state === PlaybackState.PLAYING;

  // Offline state
  const offlineItem = useOfflineStore((state: any) => state.items[track.id]);
  const { offlineMode, hideUnavailableOffline } = useSettingsStore();

  const isOfflineAvailable = offlineItem?.status === OfflineStatus.COMPLETED;
  const isDownloading = offlineItem?.status === OfflineStatus.DOWNLOADING;
  const isQueued = offlineItem?.status === OfflineStatus.QUEUED;
  const isError = offlineItem?.status === OfflineStatus.ERROR;

  const shouldBeGrayedOut = offlineMode && !isOfflineAvailable;

  // Context menu state
  const contextMenu = useContextMenu();

  // If we should hide unavailable offline and it's not available, return null
  if (offlineMode && hideUnavailableOffline && !isOfflineAvailable) {
    return null;
  }

  // Context menu items
  const menuItems: ContextMenuItem[] = [
    {
      id: "play-next",
      label: "Play Next",
      icon: <IconPlayerSkipForward size={18} stroke={1.5} />,
      onClick: () => playNext(trackToMediaSource(track)),
    },
    {
      id: "add-to-queue",
      label: "Add to Queue",
      icon: <IconPlaylistAdd size={18} stroke={1.5} />,
      onClick: () => addToQueue(trackToMediaSource(track)),
    },
    {
      id: "divider-1",
      label: "",
      divider: true,
      onClick: () => {},
    },
    // Download/Remove offline option
    !isOfflineAvailable
      ? {
          id: "download-offline",
          label: isDownloading
            ? "Downloading..."
            : isQueued
            ? "Queued"
            : "Download for Offline",
          icon: <IconCloudDownload size={18} stroke={1.5} />,
          onClick: () => downloadTrack(track),
          disabled: isDownloading || isQueued,
        }
      : {
          id: "remove-offline",
          label: "Remove from Offline",
          icon: <IconCircleCheckFilled size={18} stroke={1.5} />,
          onClick: () => removeTrack(track.id),
        },
    {
      id: "divider-2",
      label: "",
      divider: true,
      onClick: () => {},
    },
    {
      id: "info",
      label: "Track Info",
      icon: <IconInfoCircle size={18} stroke={1.5} />,
      onClick: () => {
        // TODO: Open track info modal
        console.log("Track info:", track);
      },
    },
  ];

  // Lazy hydration on appearance
  useEffect(() => {
    if (!track.coverArt) {
      const timer = setTimeout(() => {
        // Auto-hydration removed
      }, 1000); // 1s delay for list items to avoid overhead during scroll
      return () => clearTimeout(timer);
    }
  }, [track.id, track.coverArt]);

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
          "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all group",
          iscurrentTrack
            ? "bg-surface-elevated"
            : "hover:bg-surface-elevated/50",
          shouldBeGrayedOut && "opacity-40 grayscale-[0.5] filter"
        )}
      >
        {/* Album Art / Icon */}
        <div className="w-12 h-12 flex-shrink-0 relative overflow-hidden bg-surface-elevated">
          {/* PERFORMANCE: Lazy-loaded album art with LRU cache + manual hydration */}
          {(() => {
            const libraryTracks = useLibraryStore.getState().tracks;
            const coverArt =
              track.coverArt ||
              track.metadata?.coverArt ||
              libraryTracks.find((t) => t.id === track.id)?.coverArt;

            return (
              <CoverArt
                src={coverArt}
                alt="Album Art"
                className="w-full h-full"
                iconSize={20}
              />
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
          {iscurrentTrack && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent" />
          )}
        </div>

        {/* Track Details */}
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "font-medium truncate transition-colors",
              iscurrentTrack ? "text-accent" : "text-text"
            )}
          >
            {track.title || track.filename}
          </div>
          <div className="text-sm text-text-muted truncate flex items-center gap-2">
            {isOfflineAvailable && (
              <IconCircleCheckFilled
                size={14}
                className="text-accent flex-shrink-0"
              />
            )}
            {isDownloading && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                <IconCloudDownload
                  size={14}
                  className="text-accent flex-shrink-0"
                />
              </motion.div>
            )}
            {isQueued && (
              <IconCloudDownload
                size={14}
                className="text-text-muted flex-shrink-0 animate-pulse"
              />
            )}
            {isError && (
              <IconExclamationCircle
                size={14}
                className="text-red-500 flex-shrink-0"
              />
            )}
            <span>{formatArtists(track.artist)}</span>
            {track.album && (
              <>
                <span className="opacity-40">•</span>
                <span className="opacity-80">{track.album}</span>
              </>
            )}
          </div>
        </div>

        {/* Duration (if available) - Optional */}
        {track.duration && (
          <div className="text-sm text-text-muted font-mono variant-numeric-tabular">
            {formatTime(track.duration)}
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
