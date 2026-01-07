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
import { useMediaQuery } from "../hooks/useMediaQuery";
import { cn } from "@sonantica/shared";
import { usePlaylistCRUD } from "../hooks/usePlaylistCRUD";
import { useDialog } from "../hooks/useDialog";
import { ConfirmDialog } from "@sonantica/ui";

export function SelectionActionBar() {
  const {
    isSelectionMode,
    selectedIds,
    itemType,
    exitSelectionMode,
    clearSelection,
  } = useSelectionStore();

  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const { deletePlaylist } = usePlaylistCRUD();
  const { dialogState, showConfirm, handleConfirm, handleCancel } = useDialog();

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

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      `Delete ${itemType}s`,
      `Are you sure you want to delete ${selectedCount} ${itemType}(s)? This action cannot be undone.`,
      "danger"
    );
    if (confirmed) {
      try {
        if (itemType === "playlist") {
          await Promise.all(selectedArray.map((id) => deletePlaylist(id)));
        } else {
          console.log(`Delete selected ${itemType}:`, selectedArray);
          // TODO: Implement delete for tracks/artists
        }
        exitSelectionMode();
      } catch (error) {
        console.error(`Failed to delete ${itemType}(s):`, error);
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={cn(
            "fixed z-50 transition-all duration-300",
            isMobile
              ? "bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] left-4 right-4"
              : "bottom-24 left-1/2 -translate-x-1/2"
          )}
        >
          <div
            className={cn(
              "bg-surface-elevated border border-border rounded-2xl shadow-2xl flex items-center backdrop-blur-xl transition-all duration-300 overflow-hidden",
              isMobile ? "flex-col p-3 gap-3" : "px-6 py-4 gap-4"
            )}
          >
            {/* Top Row: Count & Selection Mode Toggle (Mobile) / Count (Desktop) */}
            <div
              className={cn(
                "flex items-center justify-between w-full",
                !isMobile && "w-auto"
              )}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={exitSelectionMode}
                  className="p-2 hover:bg-surface rounded-lg transition-colors flex-shrink-0"
                  title="Cancel"
                >
                  <IconX size={isMobile ? 18 : 20} />
                </button>
                <div className="text-sm font-medium whitespace-nowrap">
                  {selectedCount} {itemType}
                  {selectedCount !== 1 ? "s" : ""} selected
                </div>
              </div>

              {isMobile && selectedCount > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-text-muted text-xs h-8"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Divider (Desktop Only) */}
            {!isMobile && <div className="w-px h-8 bg-border flex-shrink-0" />}

            {/* Divider (Mobile Only) */}
            {isMobile && <div className="w-full h-px bg-border" />}

            {/* Actions */}
            <div
              className={cn(
                "flex items-center gap-2",
                isMobile ? "w-full justify-around" : "justify-center"
              )}
            >
              {itemType === "track" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlayAll}
                    className={cn(
                      "gap-2",
                      isMobile && "flex-col h-auto py-1.5 px-3 min-w-[60px]"
                    )}
                    title="Play All"
                  >
                    <IconPlayerPlay size={isMobile ? 16 : 18} />
                    <span className={cn(isMobile && "text-[10px]")}>Play</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddToQueue}
                    className={cn(
                      "gap-2",
                      isMobile && "flex-col h-auto py-1.5 px-3 min-w-[60px]"
                    )}
                    title="Add to Queue"
                  >
                    <IconPlayerSkipForward size={isMobile ? 16 : 18} />
                    <span className={cn(isMobile && "text-[10px]")}>Queue</span>
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddToPlaylist}
                className={cn(
                  "gap-2",
                  isMobile && "flex-col h-auto py-1.5 px-3 min-w-[60px]"
                )}
                title="Add to Playlist"
              >
                <IconPlaylistAdd size={isMobile ? 16 : 18} />
                <span className={cn(isMobile && "text-[10px]")}>Playlist</span>
              </Button>

              {itemType === "playlist" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className={cn(
                    "gap-2 text-red-400 hover:text-red-300",
                    isMobile && "flex-col h-auto py-1.5 px-3 min-w-[60px]"
                  )}
                  title="Delete"
                >
                  <IconTrash size={isMobile ? 16 : 18} />
                  <span className={cn(isMobile && "text-[10px]")}>Delete</span>
                </Button>
              )}
            </div>

            {/* Clear Selection (Desktop Only) */}
            {!isMobile && selectedCount > 1 && (
              <>
                <div className="w-px h-8 bg-border flex-shrink-0" />
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

      {/* Confirm Dialog for deleting items */}
      <ConfirmDialog
        isOpen={dialogState.isOpen && dialogState.type === "confirm"}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant}
      />
    </>
  );
}
