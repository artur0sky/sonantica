/**
 * Queue History Component
 *
 * Displays saved queue snapshots (HISTORY_SNAPSHOT playlists)
 * Refactored to remove Framer Motion and use standard CSS animations.
 */

import { useState } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import { useQueueStore } from "@sonantica/player-core";
import { usePlaylistCRUD } from "../../hooks/usePlaylistCRUD";
import { playFromContext } from "../../utils/playContext";
import { trackToMediaSource } from "../../utils/streamingUrl";
import { useDialog } from "../../hooks/useDialog";
import { PromptDialog } from "@sonantica/ui";
import {
  IconPlayerPlay,
  IconPlaylistAdd,
  IconChevronDown,
  IconChevronUp,
  IconHistory,
  IconDotsVertical,
} from "@tabler/icons-react";
import { cn } from "@sonantica/shared";

export function QueueHistory() {
  const { playlists, tracks } = useLibraryStore();
  const { addToQueue } = useQueueStore();
  const { createPlaylist } = usePlaylistCRUD();
  const { dialogState, showPrompt, handleCancel, handleConfirm } = useDialog();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const queueHistory = playlists
    .filter((p) => p.type === "HISTORY_SNAPSHOT")
    .sort((a, b) => {
      const aDate = new Date(a.snapshotDate || a.createdAt).getTime();
      const bDate = new Date(b.snapshotDate || b.createdAt).getTime();
      return bDate - aDate;
    })
    .slice(0, 10);

  if (queueHistory.length === 0) return null;

  const displayedHistory = isExpanded ? queueHistory : queueHistory.slice(0, 3);

  const handlePlay = (playlist: any) => {
    if (!playlist.trackIds) return;
    const playlistTracks = playlist.trackIds
      .map((id: string) => tracks.find((t) => t.id === id))
      .filter((t: any) => !!t);

    if (playlistTracks.length === 0) return;

    const mediaSources = playlistTracks.map(trackToMediaSource);
    playFromContext(mediaSources, 0);
    setActiveMenu(null);
  };

  const handleAddToQueue = (playlist: any) => {
    if (!playlist.trackIds) return;
    const playlistTracks = playlist.trackIds
      .map((id: string) => tracks.find((t) => t.id === id))
      .filter((t: any) => !!t);

    if (playlistTracks.length === 0) return;

    addToQueue(playlistTracks.map(trackToMediaSource));
    setActiveMenu(null);
  };

  const handleConvertToPlaylist = async (playlist: any) => {
    const newName = await showPrompt(
      "Convert to Playlist",
      "Enter a name for this permanent playlist",
      playlist.name.replace("Queue ", ""),
      "Playlist name"
    );
    if (!newName) return;

    try {
      await createPlaylist(newName.trim(), "MANUAL", playlist.trackIds);
      setActiveMenu(null);
    } catch (error) {
      console.error("Failed to convert to playlist:", error);
    }
  };

  return (
    <div className="border-t border-border/20 pt-6 mt-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-[10px] text-text-muted/50 font-bold uppercase tracking-[0.25em] flex items-center gap-2">
          <IconHistory size={14} stroke={2.5} />
          Queue History
        </h3>
        {queueHistory.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 px-2 text-[10px] font-bold text-text-muted hover:text-accent uppercase tracking-widest transition-colors flex items-center gap-1"
          >
            {isExpanded ? "Show less" : "View all"}
            {isExpanded ? (
              <IconChevronUp size={14} stroke={2.5} />
            ) : (
              <IconChevronDown size={14} stroke={2.5} />
            )}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayedHistory.map((playlist, index) => (
          <div
            key={playlist.id}
            className="relative group bg-surface-elevated/30 hover:bg-surface-elevated border border-transparent hover:border-border/50 rounded-xl p-2.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePlay(playlist)}
                className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-accent/5 hover:bg-accent text-accent hover:text-white transition-all duration-300 shadow-sm"
                title="Play Playlist"
              >
                <IconPlayerPlay size={16} className="fill-current" />
              </button>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate text-text/90">
                  {playlist.snapshotDate
                    ? new Date(playlist.snapshotDate).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }
                      )
                    : "Queue Snapshot"}
                </div>
                <div className="text-[10px] text-text-muted font-medium opacity-60">
                  {playlist.trackCount || 0} tracks •{" "}
                  {playlist.type?.replace("_", " ")}
                </div>
              </div>

              <button
                onClick={() =>
                  setActiveMenu(activeMenu === playlist.id ? null : playlist.id)
                }
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface transition-all",
                  activeMenu === playlist.id && "bg-surface text-accent"
                )}
              >
                <IconDotsVertical size={16} stroke={2} />
              </button>
            </div>

            {/* Simple Menu Dropdown */}
            {activeMenu === playlist.id && (
              <div className="absolute right-0 top-full mt-2 bg-surface-elevated border border-border rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] z-50 min-w-[200px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => handleAddToQueue(playlist)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-surface transition-colors text-left"
                >
                  <IconPlaylistAdd size={18} stroke={2} />
                  Add to Queue
                </button>
                <button
                  onClick={() => handleConvertToPlaylist(playlist)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-surface transition-colors text-left border-t border-border/50"
                >
                  <IconPlaylistAdd size={18} stroke={2} />
                  Save as Playlist
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {queueHistory.length > 10 && isExpanded && (
        <p className="text-[10px] text-text-muted/40 text-center font-bold uppercase tracking-widest mt-6">
          Showing last 10 snapshots
        </p>
      )}

      <PromptDialog
        isOpen={dialogState.isOpen && dialogState.type === "prompt"}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        defaultValue={dialogState.defaultValue}
        placeholder={dialogState.placeholder}
      />
    </div>
  );
}
