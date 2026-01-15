import React from "react";
import {
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconPlaylistAdd,
} from "@tabler/icons-react";
import {
  Button,
  SidebarContainer,
  SidebarSection,
  useUIStore,
} from "@sonantica/ui";
import { useQueueLogic } from "../../hooks/useQueueLogic";
import { usePlaylistCRUD } from "../../hooks/usePlaylistCRUD";
import { QueueHistory } from "./QueueHistory";
import { useDialog } from "../../hooks/useDialog";
import { PromptDialog } from "@sonantica/ui";
import { TrackItem } from "../../features/library/components/TrackItem";
import { QueueTrackItem } from "../queue/QueueTrackItem";

interface RightSidebarProps {
  isCollapsed?: boolean;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isCollapsed = false,
}) => {
  const {
    currentTrack,
    toggleQueue,
    fullQueue,
    currentIndex,
    upcomingQueue,
    visibleQueue,
    clearQueue,
    handlePlay,
    handleRemove,
    handleReorderByIndex,
  } = useQueueLogic();

  // Queue expansion state
  const isQueueExpanded = useUIStore((s) => s.isQueueExpanded);
  const toggleQueueExpanded = useUIStore((s) => s.toggleQueueExpanded);
  const { createPlaylist } = usePlaylistCRUD();
  const { dialogState, showPrompt, handleConfirm, handleCancel } = useDialog();

  // Show only next track when not expanded
  const displayQueue = isQueueExpanded
    ? visibleQueue
    : visibleQueue.slice(0, 1);

  // Save queue as playlist
  const handleSaveAsPlaylist = async () => {
    const playlistName = await showPrompt(
      "Save Queue as Playlist",
      "Enter a name for this playlist",
      `Queue ${new Date().toLocaleDateString()}`,
      "Queue Playlist"
    );
    if (!playlistName) return;

    try {
      const trackIds = fullQueue.map((t) => t.id);
      await createPlaylist(playlistName, "MANUAL", trackIds);
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
        {currentTrack && (
          <SidebarSection
            title={!isCollapsed ? "Now Playing" : ""}
            className="mb-6"
          >
            <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
              {/* Distinctive background indicator - no border radius */}
              <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />

              <TrackItem
                track={currentTrack}
                onClick={() => {}}
                compact={isCollapsed}
              />
            </div>
          </SidebarSection>
        )}

        {/* Queue List */}
        <div className="relative flex-1 overflow-hidden flex flex-col">
          <SidebarSection
            title="Next Up"
            headerActions={
              !isCollapsed &&
              upcomingQueue.length > 1 && (
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
              )
            }
          >
            {upcomingQueue.length === 0 ? (
              <div className="text-center py-12 animate-in fade-in duration-300">
                <p className="text-text-muted text-sm px-4">
                  The air is silent. Add some tracks.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-1">
                {displayQueue.map((track: any, index: number) => (
                  <div
                    key={track.queueId || track.id}
                    className="animate-in fade-in slide-in-from-right-2 duration-200"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <QueueTrackItem
                      track={track}
                      index={index}
                      onPlay={() => handlePlay(track)}
                      onRemove={() => handleRemove(track.id)}
                      onReorder={handleReorderByIndex}
                      compact={isCollapsed}
                    />
                  </div>
                ))}
              </div>
            )}
          </SidebarSection>

          {/* Queue History */}
          {!isCollapsed && <QueueHistory />}
        </div>
      </div>

      {/* Prompt Dialog for saving queue as playlist */}
      <PromptDialog
        isOpen={dialogState.isOpen && dialogState.type === "prompt"}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        defaultValue={dialogState.defaultValue}
        placeholder={dialogState.placeholder}
      />
    </SidebarContainer>
  );
};
