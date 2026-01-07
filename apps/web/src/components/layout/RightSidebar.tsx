/**
 * Right Sidebar - Queue
 *
 * Playback queue management.
 * Shows current track and upcoming tracks.
 */

import {
  IconTrash,
  IconGripVertical,
  IconPlayerPlay,
  IconChevronDown,
  IconChevronUp,
  IconCloudDownload,
  IconCircleCheckFilled,
  IconPlaylistAdd,
} from "@tabler/icons-react";
import {
  motion,
  AnimatePresence,
  Reorder,
  useDragControls,
} from "framer-motion";
import type { Variants } from "framer-motion";
import { useState, useEffect } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import {
  Button,
  Badge,
  SidebarContainer,
  useUIStore,
  CoverArt,
} from "@sonantica/ui";
import {
  formatArtists,
  formatTime,
  cn,
  OfflineStatus,
} from "@sonantica/shared";
import { useQueueLogic } from "../../hooks/useQueueLogic";
import { useOfflineStore } from "@sonantica/offline-manager";
import { useSettingsStore } from "../../stores/settingsStore";

const itemVariants: Variants = {
  hidden: { x: 20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    x: -20,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

interface RightSidebarProps {
  isCollapsed?: boolean;
}

export function RightSidebar({ isCollapsed }: RightSidebarProps) {
  const {
    currentTrack,
    toggleQueue,
    fullQueue,
    currentIndex,
    upcomingQueue,
    libraryTracks,
    displayedCount,
    observerTarget,
    visibleQueue,
    handleReorder,
    getExtension,
    getBadgeClass,
    clearQueue,
    handlePlay,
    handleRemove,
  } = useQueueLogic();

  // Queue expansion state
  const isQueueExpanded = useUIStore((s) => s.isQueueExpanded);
  const toggleQueueExpanded = useUIStore((s) => s.toggleQueueExpanded);

  // Show only next track when not expanded
  const displayQueue = isQueueExpanded
    ? visibleQueue
    : visibleQueue.slice(0, 1);

  // Save queue as playlist
  const handleSaveAsPlaylist = async () => {
    // TODO: Open modal to name the playlist
    const playlistName = prompt(
      "Enter playlist name:",
      `Queue ${new Date().toLocaleString()}`
    );
    if (!playlistName) return;

    try {
      const trackIds = fullQueue.map((t) => t.id);
      // This will be implemented when we integrate with the library adapter
      console.log("Saving queue as playlist:", playlistName, trackIds);
      // await libraryAdapter.createPlaylist(playlistName, 'MANUAL', trackIds);
    } catch (error) {
      console.error("Failed to save playlist:", error);
    }
  };

  return (
    <SidebarContainer
      title="Queue"
      isCollapsed={isCollapsed}
      onClose={toggleQueue}
      headerActions={
        !isCollapsed &&
        upcomingQueue.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveAsPlaylist}
              className="p-2"
              title="Save as Playlist"
            >
              <IconPlaylistAdd size={18} stroke={1.5} />
              <span className="ml-1">Save</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearQueue}
              className="p-2"
              title="Clear Queue"
            >
              <IconTrash size={18} stroke={1.5} />
              <span className="ml-1">Clear</span>
            </Button>
          </div>
        )
      }
    >
      <div className="flex flex-col h-full">
        {!isCollapsed && fullQueue.length > 0 && (
          <div className="px-1 mb-4">
            <span className="text-[10px] text-text-muted font-sans uppercase tracking-wider">
              {currentIndex + 1} / {fullQueue.length} tracks
            </span>
          </div>
        )}

        {/* Now Playing */}
        <AnimatePresence mode="wait">
          {currentTrack && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mb-6"
            >
              {!isCollapsed && (
                <h3 className="text-[10px] text-accent/70 font-bold mb-3 uppercase tracking-[0.2em]">
                  Now Playing
                </h3>
              )}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={cn(
                  "transition-all",
                  !isCollapsed
                    ? "bg-surface-elevated p-4 rounded-xl"
                    : "p-0 bg-transparent"
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-3",
                    isCollapsed && "justify-center"
                  )}
                >
                  {/* Album Art */}
                  <CoverArt
                    src={
                      currentTrack.metadata?.coverArt ||
                      libraryTracks.find((t) => t.id === currentTrack.id)
                        ?.coverArt
                    }
                    alt="Cover"
                    className={cn(isCollapsed ? "w-12 h-12" : "w-12 h-12")}
                    iconSize={isCollapsed ? 20 : 20}
                  />

                  {!isCollapsed && (
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate text-sm">
                        {currentTrack.metadata?.title || "Unknown Title"}
                      </div>
                      <div className="text-xs text-text-muted truncate">
                        {formatArtists(currentTrack.metadata?.artist)}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Queue List */}
        <div className="relative flex-1 overflow-hidden flex flex-col">
          {!isCollapsed && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] text-text-muted/70 font-bold uppercase tracking-[0.2em]">
                Next Up
              </h3>
              {upcomingQueue.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleQueueExpanded}
                  className="p-1 h-auto"
                  title={isQueueExpanded ? "Show less" : "Show all"}
                >
                  {isQueueExpanded ? (
                    <IconChevronUp size={16} stroke={1.5} />
                  ) : (
                    <IconChevronDown size={16} stroke={1.5} />
                  )}
                </Button>
              )}
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {upcomingQueue.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <p className="text-text-muted text-sm px-4">
                  The air is silent. Add some tracks.
                </p>
              </motion.div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <Reorder.Group
                  axis="y"
                  values={displayQueue}
                  onReorder={handleReorder}
                  className="space-y-1.5"
                >
                  {displayQueue.map((track: any, index: number) => (
                    <QueueItem
                      key={track.id}
                      track={track}
                      index={index}
                      isCollapsed={isCollapsed}
                      onPlay={() => handlePlay(track, index)}
                      onRemove={() => handleRemove(index)}
                      getExtension={getExtension}
                      getBadgeClass={getBadgeClass}
                    />
                  ))}
                  {/* Sentinel for infinite scroll - only show when expanded */}
                  {isQueueExpanded && displayedCount < upcomingQueue.length && (
                    <div ref={observerTarget} className="py-2 h-4" />
                  )}
                </Reorder.Group>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SidebarContainer>
  );
}

interface QueueItemProps {
  track: any;
  index: number;
  onPlay: () => void;
  onRemove: () => void;
  getExtension: (url: string) => string;
  getBadgeClass: (ext: string) => string;
  isCollapsed?: boolean;
}

function QueueItem({
  track,
  onPlay,
  onRemove,
  getExtension,
  getBadgeClass,
  isCollapsed,
}: QueueItemProps) {
  const dragControls = useDragControls();
  const ext = getExtension(track.url || "");
  const [isHovered, setIsHovered] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [dragProgress, setDragProgress] = useState(0); // 0 to 1

  // Offline state
  const offlineItem = useOfflineStore((state: any) => state.items[track.id]);
  const { offlineMode, hideUnavailableOffline } = useSettingsStore();

  const isOfflineAvailable = offlineItem?.status === OfflineStatus.COMPLETED;
  const isDownloading = offlineItem?.status === OfflineStatus.DOWNLOADING;
  const shouldBeGrayedOut = offlineMode && !isOfflineAvailable;

  // Normalize metadata access
  const title = track.metadata?.title || track.title || "Unknown Title";
  const artist = track.metadata?.artist || track.artist || "Unknown Artist";
  const duration = track.metadata?.duration || track.duration || 0;
  const bitrate = track.metadata?.bitrate || track.bitrate;

  // Hide if offline mode and hideUnavailableOffline is true
  if (offlineMode && hideUnavailableOffline && !isOfflineAvailable) {
    return null;
  }

  // Lazy hydration on appearance
  useEffect(() => {
    if (!track.metadata?.coverArt && !track.coverArt) {
      // Small timeout to avoid hammering the decoder if scrolling fast
      const timer = setTimeout(() => {
        // Auto-hydration removed
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [track.id, track.coverArt, track.metadata?.coverArt]);

  return (
    <Reorder.Item
      value={track}
      dragListener={false}
      dragControls={dragControls}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onDrag={(_, info) => {
        // Track X offset to detect swipe-to-delete
        // Right sidebar is on the right, dragging LEFT (negative X) means dragging OUTSIDE
        const threshold = -80;
        const progress = Math.min(Math.max(info.offset.x / threshold, 0), 1);
        setDragProgress(progress);
        setIsRemoving(info.offset.x < threshold);
      }}
      onDragEnd={(_, info) => {
        if (info.offset.x < -80) {
          onRemove();
        }
        setDragProgress(0);
        setIsRemoving(false);
      }}
      whileDrag={{
        scale: isRemoving ? 0.95 : 1.02,
        backgroundColor: isRemoving
          ? "rgba(239, 68, 68, 0.2)"
          : "rgba(255, 255, 255, 0.08)",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        zIndex: 50,
      }}
      transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
      className={cn(
        "group relative flex items-center transition-all select-none",
        isCollapsed
          ? "justify-center p-0 mb-1"
          : "p-2 rounded-xl hover:bg-white/5 gap-2",
        shouldBeGrayedOut && "opacity-40 grayscale-[0.5]"
      )}
    >
      {/* Drag Handle - Larger touch target */}
      {!isCollapsed && (
        <div
          onPointerDown={(e) => dragControls.start(e)}
          onTouchStart={(e) => {
            // Explicitly start dragging on touch devices
            dragControls.start(e as any);
          }}
          className="w-8 h-12 -ml-2 flex items-center justify-center text-text-muted/20 group-hover:text-text-muted/60 cursor-grab active:cursor-grabbing transition-colors touch-none"
        >
          <IconGripVertical size={18} stroke={1.5} />
        </div>
      )}

      {/* Removal Visual Cue (Trash Icon Overlay) */}
      <AnimatePresence>
        {dragProgress > 0.2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: dragProgress, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn(
              "absolute inset-y-0 right-0 w-20 flex items-center justify-center rounded-r-xl transition-colors",
              isRemoving
                ? "bg-red-500/40 text-white"
                : "bg-red-500/10 text-red-500"
            )}
          >
            <motion.div
              animate={{
                scale: isRemoving ? 1.2 : 1,
                rotate: isRemoving ? [0, -10, 10, 0] : 0,
              }}
              transition={{ repeat: isRemoving ? Infinity : 0, duration: 0.3 }}
            >
              <IconTrash size={20} stroke={2} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "flex-shrink-0 overflow-hidden transition-all relative cursor-pointer group/cover",
          isCollapsed ? "w-14 h-14" : "w-10 h-10"
        )}
        onClick={onPlay}
        onPointerDown={(e) => {
          if (isCollapsed) dragControls.start(e);
        }}
        onTouchStart={(e) => {
          if (isCollapsed) dragControls.start(e as any);
        }}
      >
        <CoverArt
          src={
            track.metadata?.coverArt ||
            track.coverArt ||
            useLibraryStore
              .getState()
              .tracks.find((t: any) => t.id === track.id)?.coverArt
          }
          className="w-full h-full"
          iconSize={isCollapsed ? 24 : 16}
        />
        {/* Play Icon on Hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
          <IconPlayerPlay size={18} className="text-white fill-current" />
        </div>
      </div>

      {!isCollapsed && (
        <div className="min-w-0 flex-1 cursor-pointer" onClick={onPlay}>
          <div className="font-medium truncate text-sm group-hover:text-accent transition-colors">
            {title}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-text-muted truncate">
            {isOfflineAvailable && (
              <IconCircleCheckFilled
                size={12}
                className="text-accent flex-shrink-0"
              />
            )}
            {isDownloading && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                <IconCloudDownload
                  size={12}
                  className="text-accent flex-shrink-0"
                />
              </motion.div>
            )}
            <span className="truncate opacity-70">{formatArtists(artist)}</span>

            {/* Bitrate Badge (Compact) */}
            <motion.span
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="hidden lg:group-hover:inline-flex items-center gap-1 text-[9px] text-accent font-sans bg-accent/10 px-1 py-0.5 rounded shadow-sm border border-accent/20"
            >
              {bitrate || "1411"}k
            </motion.span>
          </div>
        </div>
      )}

      {!isCollapsed && (
        <div className="flex flex-col items-end gap-1 min-w-fit pr-1">
          <span className="text-[10px] text-text-muted tabular-nums font-sans opacity-50 group-hover:opacity-100">
            {formatTime(duration)}
          </span>
          <Badge
            variant="custom"
            className={cn(
              "text-[8px] px-1 py-0 transition-opacity",
              getBadgeClass(ext),
              ext !== "FLAC" && ext !== "WAV"
                ? "opacity-0 group-hover:opacity-100"
                : "opacity-100"
            )}
          >
            {ext}
          </Badge>
        </div>
      )}

      {/* Collapsed Tooltip */}
      {isCollapsed && isHovered && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute right-full mr-4 bg-surface-elevated border border-white/10 p-2.5 rounded-lg shadow-2xl z-[100] min-w-[150px] pointer-events-none"
        >
          <div className="font-semibold text-xs truncate max-w-[140px]">
            {title}
          </div>
          <div className="text-[10px] text-text-muted truncate mb-1">
            {formatArtists(artist)}
          </div>
          <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5">
            <span className="text-[9px] font-sans text-accent">{ext}</span>
            <span className="text-[9px] font-sans opacity-60">
              {formatTime(duration)}
            </span>
          </div>
        </motion.div>
      )}
    </Reorder.Item>
  );
}
