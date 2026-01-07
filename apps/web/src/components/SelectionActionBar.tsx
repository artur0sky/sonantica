/**
 * Selection Action Bar
 *
 * Floating action bar for batch operations on selected items
 */

import { useState } from "react";
import { useSelectionStore } from "../stores/selectionStore";
import { Button } from "@sonantica/ui";
import {
  IconX,
  IconPlaylistAdd,
  IconPlayerPlay,
  IconPlayerSkipForward,
  IconTrash,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { AddToPlaylistModal } from "./AddToPlaylistModal";

export function SelectionActionBar() {
  const {
    isSelectionMode,
    selectedIds,
    itemType,
    exitSelectionMode,
    clearSelection,
  } = useSelectionStore();

  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  if (!isSelectionMode || selectedIds.size === 0) return null;

  const selectedCount = selectedIds.size;
  const selectedArray = Array.from(selectedIds);

  const handleAddToPlaylist = () => {
    setShowPlaylistModal(true);
  };

  const handlePlayAll = () => {
    console.log("Play selected:", selectedArray);
    // TODO: Load and play selected items
    exitSelectionMode();
  };

  const handleAddToQueue = () => {
    console.log("Add to queue:", selectedArray);
    // TODO: Add selected items to queue
    exitSelectionMode();
  };

  const handleDelete = () => {
    if (confirm(`Delete ${selectedCount} ${itemType}(s)?`)) {
      console.log("Delete selected:", selectedArray);
      // TODO: Delete selected items
      exitSelectionMode();
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-surface-elevated border border-border rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 backdrop-blur-xl">
            {/* Selection Count */}
            <div className="flex items-center gap-3">
              <button
                onClick={exitSelectionMode}
                className="p-2 hover:bg-surface rounded-lg transition-colors"
                title="Cancel"
              >
                <IconX size={20} />
              </button>
              <div className="text-sm font-medium">
                {selectedCount} {itemType}
                {selectedCount !== 1 ? "s" : ""} selected
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-border" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              {itemType === "track" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlayAll}
                    className="gap-2"
                    title="Play All"
                  >
                    <IconPlayerPlay size={18} />
                    Play
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddToQueue}
                    className="gap-2"
                    title="Add to Queue"
                  >
                    <IconPlayerSkipForward size={18} />
                    Queue
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddToPlaylist}
                className="gap-2"
                title="Add to Playlist"
              >
                <IconPlaylistAdd size={18} />
                Playlist
              </Button>

              {itemType === "playlist" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="gap-2 text-red-400 hover:text-red-300"
                  title="Delete"
                >
                  <IconTrash size={18} />
                  Delete
                </Button>
              )}
            </div>

            {/* Clear Selection */}
            {selectedCount > 1 && (
              <>
                <div className="w-px h-8 bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-text-muted"
                >
                  Clear
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Add to Playlist Modal - handles batch */}
      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        trackId={selectedArray[0]} // First item for preview
        trackTitle={`${selectedCount} ${itemType}${
          selectedCount !== 1 ? "s" : ""
        }`}
        batchIds={selectedArray}
      />
    </>
  );
}
