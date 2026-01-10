import {
  IconPlaylistAdd,
  IconPlayerSkipForward,
  IconInfoCircle,
  IconCloudDownload,
  IconCircleCheckFilled,
  IconExclamationCircle,
  IconWand,
} from "@tabler/icons-react";
import { formatArtists, PlaybackState } from "@sonantica/shared";
import { usePlayerStore, useQueueStore } from "@sonantica/player-core";
import { useLibraryStore } from "@sonantica/media-library";
import { useState } from "react";
import {
  ContextMenu,
  useContextMenu,
  CoverArt,
  TrackItem as TrackItemUI,
  type ContextMenuItem,
  cn,
} from "@sonantica/ui";
import { trackToMediaSource } from "../../../utils/streamingUrl";
import { useOfflineStore } from "@sonantica/offline-manager";
import { useSettingsStore } from "../../../stores/settingsStore";
import { OfflineStatus } from "@sonantica/shared";
import { useOfflineManager } from "../../../hooks/useOfflineManager";
import { AddToPlaylistModal } from "../../../components/AddToPlaylistModal";
import { useSelectionStore } from "../../../stores/selectionStore";
import { StemSeparationModal } from "../../ai/components/StemSeparationModal";
import { useAICapabilities } from "../../../hooks/useAICapabilities";

interface TrackItemProps {
  track: any;
  onClick: () => void;
  showRemoveButton?: boolean;
  onRemove?: () => void;
  compact?: boolean;
}

export function TrackItem({
  track,
  onClick,
  showRemoveButton: _showRemoveButton,
  onRemove: _onRemove,
  compact: _compact,
}: TrackItemProps) {
  const { currentTrack, state } = usePlayerStore();
  const { addToQueue, playNext } = useQueueStore();
  const { downloadTrack, removeTrack } = useOfflineManager();

  const isActive = currentTrack?.id === track.id;
  const isPlaying = isActive && state === PlaybackState.PLAYING;

  // Offline state
  const offlineItem = useOfflineStore((state: any) => state.items[track.id]);
  const { offlineMode } = useSettingsStore();

  const isOfflineAvailable = offlineItem?.status === OfflineStatus.COMPLETED;
  const isDownloading = offlineItem?.status === OfflineStatus.DOWNLOADING;
  const isQueued = offlineItem?.status === OfflineStatus.QUEUED;
  const isError = offlineItem?.status === OfflineStatus.ERROR;

  const shouldBeGrayedOut = offlineMode && !isOfflineAvailable;

  // Context menu state
  const contextMenu = useContextMenu();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showStemModal, setShowStemModal] = useState(false);

  // AI capabilities
  const { hasCapability } = useAICapabilities();

  // Selection state
  const { isSelectionMode, itemType, toggleSelection, isSelected } =
    useSelectionStore();
  const isInSelectionMode = isSelectionMode && itemType === "track";
  const selected = isInSelectionMode && isSelected(track.id);

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
      id: "add-to-playlist",
      label: "Add to Playlist",
      icon: <IconPlaylistAdd size={18} stroke={1.5} />,
      onClick: () => setShowPlaylistModal(true),
    },
    ...(hasCapability("stem-separation")
      ? [
          {
            id: "separate-stems",
            label: "Separate Stems (AI)",
            icon: <IconWand size={18} stroke={1.5} />,
            onClick: () => setShowStemModal(true),
          },
        ]
      : []),
    {
      id: "divider-1",
      label: "",
      divider: true,
      onClick: () => {},
    },
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
        console.log("Track info:", track);
      },
    },
  ];

  const statusIcons = (
    <>
      {isOfflineAvailable && (
        <IconCircleCheckFilled
          size={14}
          className="text-accent flex-shrink-0"
        />
      )}
      {isDownloading && (
        <div className="animate-spin">
          <IconCloudDownload size={14} className="text-accent flex-shrink-0" />
        </div>
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
    </>
  );

  return (
    <>
      <TrackItemUI
        title={track.title || track.filename}
        artist={formatArtists(track.artist)}
        album={track.album}
        duration={track.duration}
        image={
          <CoverArt
            src={
              track.coverArt ||
              track.metadata?.coverArt ||
              useLibraryStore.getState().tracks.find((t) => t.id === track.id)
                ?.coverArt
            }
            alt=""
            className="w-full h-full"
            iconSize={20}
          />
        }
        isActive={isActive}
        isPlaying={isPlaying}
        isSelectionMode={isInSelectionMode}
        isSelected={selected}
        statusIcons={statusIcons}
        onClick={() => {
          if (isInSelectionMode) {
            toggleSelection(track.id);
          } else {
            onClick();
          }
        }}
        onContextMenu={contextMenu.handleContextMenu}
        onMouseDown={contextMenu.handleLongPressStart}
        onMouseUp={contextMenu.handleLongPressEnd}
        onMouseLeave={contextMenu.handleLongPressEnd}
        onTouchStart={contextMenu.handleLongPressStart}
        onTouchEnd={contextMenu.handleLongPressEnd}
        className={cn(shouldBeGrayedOut && "opacity-40 grayscale-[0.5] filter")}
      />

      {/* Context Menu */}
      <ContextMenu
        items={menuItems}
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={contextMenu.close}
      />

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        trackId={track.id}
        trackTitle={track.title}
      />

      {/* Stem Separation Modal */}
      <StemSeparationModal
        isOpen={showStemModal}
        onClose={() => setShowStemModal(false)}
        trackId={track.id}
        trackTitle={track.title || track.filename}
      />
    </>
  );
}
