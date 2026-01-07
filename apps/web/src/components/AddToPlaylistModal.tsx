/**
 * Add to Playlist Modal
 *
 * Allows selecting an existing playlist or creating a new one
 */

import { useState } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import { Button } from "@sonantica/ui";
import { IconPlus, IconPlaylist, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@sonantica/shared";

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle?: string;
  batchIds?: string[]; // For multi-select operations
}

export function AddToPlaylistModal({
  isOpen,
  onClose,
  trackId,
  trackTitle,
  batchIds,
}: AddToPlaylistModalProps) {
  const { playlists } = useLibraryStore();
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const trackIds = batchIds || [trackId]; // Use batch if available, otherwise single track

  // Filter out history snapshots (read-only)
  const editablePlaylists = playlists.filter(
    (p) => p.type !== "HISTORY_SNAPSHOT"
  );

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      console.log("Adding tracks to playlist:", { trackIds, playlistId });
      // TODO: await libraryAdapter.addTracksToPlaylist(playlistId, trackIds);
      onClose();
    } catch (error) {
      console.error("Failed to add to playlist:", error);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      console.log("Creating new playlist and adding tracks:", {
        name: newPlaylistName,
        trackIds,
      });
      // TODO: const playlist = await libraryAdapter.createPlaylist(newPlaylistName, 'MANUAL', trackIds);
      onClose();
    } catch (error) {
      console.error("Failed to create playlist:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface-elevated border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold">Add to Playlist</h2>
              {trackTitle && (
                <p className="text-sm text-text-muted truncate mt-1">
                  {trackTitle}
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <IconX size={20} />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Create New Playlist */}
            <div className="mb-4">
              {!isCreatingNew ? (
                <Button
                  variant="secondary"
                  onClick={() => setIsCreatingNew(true)}
                  className="w-full justify-start gap-2"
                >
                  <IconPlus size={18} />
                  Create New Playlist
                </Button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Playlist name"
                    className="w-full px-3 py-2 bg-surface-base border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent/50"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateAndAdd();
                      if (e.key === "Escape") setIsCreatingNew(false);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handleCreateAndAdd}
                      disabled={!newPlaylistName.trim()}
                      className="flex-1"
                    >
                      Create & Add
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setNewPlaylistName("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Existing Playlists */}
            {editablePlaylists.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs text-text-muted uppercase tracking-wider mb-2">
                  Your Playlists
                </h3>
                {editablePlaylists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-base transition-colors text-left",
                      "group"
                    )}
                  >
                    <IconPlaylist
                      size={20}
                      className="text-text-muted group-hover:text-accent transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate group-hover:text-accent transition-colors">
                        {playlist.name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {playlist.trackCount || 0} tracks
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {editablePlaylists.length === 0 && !isCreatingNew && (
              <p className="text-sm text-text-muted text-center py-8">
                No playlists yet. Create your first one!
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
