/**
 * Queue History Component
 *
 * Displays saved queue snapshots (HISTORY_SNAPSHOT playlists)
 * Allows playing, adding to queue, or converting to permanent playlist
 */

import { useState } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import { Button } from "@sonantica/ui";
import {
  IconPlayerPlay,
  IconPlaylistAdd,
  IconChevronDown,
  IconChevronUp,
  IconHistory,
  IconDotsVertical,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

export function QueueHistory() {
  const { playlists } = useLibraryStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Get only HISTORY_SNAPSHOT playlists, sorted by date (newest first)
  const queueHistory = playlists
    .filter((p) => p.type === "HISTORY_SNAPSHOT")
    .sort((a, b) => {
      const aDate = new Date(a.snapshotDate || a.createdAt).getTime();
      const bDate = new Date(b.snapshotDate || b.createdAt).getTime();
      return bDate - aDate;
    })
    .slice(0, 10); // Show last 10

  if (queueHistory.length === 0) return null;

  const displayedHistory = isExpanded ? queueHistory : queueHistory.slice(0, 3);

  const handlePlay = (playlist: any) => {
    console.log("Play queue history:", playlist.id);
    // TODO: Load tracks and play
    setActiveMenu(null);
  };

  const handleAddToQueue = (playlist: any) => {
    console.log("Add to current queue:", playlist.id);
    // TODO: Add tracks to queue
    setActiveMenu(null);
  };

  const handleConvertToPlaylist = (playlist: any) => {
    const newName = prompt(
      "Convert to permanent playlist. Enter name:",
      playlist.name.replace("Queue ", "")
    );
    if (!newName) return;

    console.log("Convert to playlist:", { id: playlist.id, newName });
    // TODO: Create new MANUAL playlist with same tracks
    setActiveMenu(null);
  };

  return (
    <div className="border-t border-border pt-4 mt-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-[10px] text-text-muted/70 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
          <IconHistory size={12} />
          Queue History
        </h3>
        {queueHistory.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 h-auto"
          >
            {isExpanded ? (
              <IconChevronUp size={16} stroke={1.5} />
            ) : (
              <IconChevronDown size={16} stroke={1.5} />
            )}
          </Button>
        )}
      </div>

      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {displayedHistory.map((playlist) => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              layout
              className="relative group bg-surface-elevated/50 hover:bg-surface-elevated rounded-lg p-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                {/* Play Button */}
                <button
                  onClick={() => handlePlay(playlist)}
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md bg-accent/10 hover:bg-accent/20 text-accent transition-colors"
                  title="Play"
                >
                  <IconPlayerPlay size={14} className="fill-current" />
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {playlist.snapshotDate
                      ? new Date(playlist.snapshotDate).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "Queue Snapshot"}
                  </div>
                  <div className="text-[10px] text-text-muted">
                    {playlist.trackCount || 0} tracks
                  </div>
                </div>

                {/* Menu Button */}
                <button
                  onClick={() =>
                    setActiveMenu(
                      activeMenu === playlist.id ? null : playlist.id
                    )
                  }
                  className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-text transition-colors"
                >
                  <IconDotsVertical size={14} />
                </button>
              </div>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {activeMenu === playlist.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-1 bg-surface-elevated border border-border rounded-lg shadow-xl z-50 min-w-[180px] overflow-hidden"
                  >
                    <button
                      onClick={() => handleAddToQueue(playlist)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface transition-colors text-left"
                    >
                      <IconPlaylistAdd size={16} />
                      Add to Queue
                    </button>
                    <button
                      onClick={() => handleConvertToPlaylist(playlist)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface transition-colors text-left border-t border-border"
                    >
                      <IconPlaylistAdd size={16} />
                      Save as Playlist
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {queueHistory.length > 10 && isExpanded && (
        <p className="text-[10px] text-text-muted text-center mt-2 px-1">
          Showing last 10 snapshots
        </p>
      )}
    </div>
  );
}
