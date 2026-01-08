/**
 * Add to Playlist Modal
 *
 * Allows selecting an existing playlist or creating a new one.
 * Refactored to use standard Modal component and CSS animations.
 */

import { useState } from "react";
import { useLibraryStore } from "@sonantica/media-library";
import { Button, Modal } from "@sonantica/ui";
import { IconPlus, IconPlaylist } from "@tabler/icons-react";
import { cn } from "@sonantica/shared";

import { usePlaylistCRUD } from "../hooks/usePlaylistCRUD";

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
  const { createPlaylist, addTracksToPlaylist } = usePlaylistCRUD();
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const trackIds = batchIds || [trackId];

  // Filter out history snapshots (read-only)
  const editablePlaylists = playlists.filter(
    (p) => p.type !== "HISTORY_SNAPSHOT"
  );

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      await addTracksToPlaylist(playlistId, trackIds);
      onClose();
    } catch (error) {
      console.error("Failed to add to playlist:", error);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      await createPlaylist(newPlaylistName, "MANUAL", trackIds);
      onClose();
    } catch (error) {
      console.error("Failed to create playlist:", error);
    }
  };

  const handleClose = () => {
    setIsCreatingNew(false);
    setNewPlaylistName("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add to Playlist"
      maxWidth="max-w-md"
    >
      <div className="flex flex-col max-h-[70vh]">
        {/* Track/Context Info */}
        {trackTitle && (
          <div className="px-4 py-2 bg-surface/30 border-b border-border">
            <p className="text-xs text-text-muted truncate">
              Adding: {trackTitle}
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {/* Create New Playlist Section */}
          <div className="mb-6">
            {!isCreatingNew ? (
              <Button
                variant="secondary"
                onClick={() => setIsCreatingNew(true)}
                className="w-full justify-start gap-3 py-6 rounded-xl border-dashed"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <IconPlus size={20} />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Create New Playlist</div>
                  <div className="text-xs text-text-muted">
                    Start a fresh collection
                  </div>
                </div>
              </Button>
            ) : (
              <div className="space-y-3 p-4 bg-surface rounded-xl border border-border animate-in fade-in zoom-in-95 duration-300">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist name..."
                  className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
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
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest px-1 mb-3">
                Select Playlist
              </h3>
              <div className="grid gap-2">
                {editablePlaylists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    className={cn(
                      "w-full flex items-center gap-4 p-3 rounded-xl hover:bg-surface-elevated transition-all border border-transparent hover:border-border",
                      "group"
                    )}
                  >
                    <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center text-text-muted group-hover:bg-accent/10 group-hover:text-accent transition-all">
                      <IconPlaylist size={24} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold truncate group-hover:text-accent transition-colors">
                        {playlist.name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {playlist.trackCount || 0} tracks
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {editablePlaylists.length === 0 && !isCreatingNew && (
            <div className="text-center py-12 px-4 bg-surface/20 rounded-2xl border border-dashed border-border">
              <IconPlaylist
                size={40}
                className="mx-auto text-text-muted/30 mb-3"
              />
              <p className="text-sm text-text-muted">
                No custom playlists yet.
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 text-accent"
                onClick={() => setIsCreatingNew(true)}
              >
                Create your first one
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
