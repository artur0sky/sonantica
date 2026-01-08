/**
 * Selection Action Bar
 *
 * Floating action bar for batch operations on selected items.
 * Atomized and migrated to CSS animations.
 */

import { useState } from "react";
import { useSelectionStore } from "../stores/selectionStore";
import {
  SelectionInfo,
  SelectionActionButton,
  ConfirmDialog,
} from "@sonantica/ui";
import {
  IconPlaylistAdd,
  IconPlayerPlay,
  IconPlayerSkipForward,
  IconTrash,
} from "@tabler/icons-react";
import { AddToPlaylistModal } from "./AddToPlaylistModal";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { cn } from "@sonantica/shared";
import { usePlaylistCRUD } from "../hooks/usePlaylistCRUD";
import { useDialog } from "../hooks/useDialog";

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
      <div
        className={cn(
          "fixed z-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-10",
          isMobile
            ? "bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] left-4 right-4"
            : "bottom-24 left-1/2 -translate-x-1/2"
        )}
      >
        <div
          className={cn(
            "bg-surface-elevated/90 border border-border rounded-2xl shadow-2xl flex items-center backdrop-blur-xl transition-all duration-300 overflow-hidden",
            isMobile ? "flex-col p-3 gap-3" : "px-6 py-4 gap-4"
          )}
        >
          {/* Top Row: Count & Actions Info */}
          <SelectionInfo
            count={selectedCount}
            itemType={itemType}
            isMobile={isMobile}
            onClose={exitSelectionMode}
            onClear={clearSelection}
            showClear={true}
          />

          {/* Divider */}
          <div
            className={cn(
              "bg-border flex-shrink-0",
              isMobile ? "w-full h-px" : "w-px h-8"
            )}
          />

          {/* Actions */}
          <div
            className={cn(
              "flex items-center gap-2",
              isMobile ? "w-full justify-around" : "justify-center"
            )}
          >
            {itemType === "track" && (
              <>
                <SelectionActionButton
                  icon={IconPlayerPlay}
                  label="Play"
                  isMobile={isMobile}
                  onClick={handlePlayAll}
                  title="Play All"
                />
                <SelectionActionButton
                  icon={IconPlayerSkipForward}
                  label="Queue"
                  isMobile={isMobile}
                  onClick={handleAddToQueue}
                  title="Add to Queue"
                />
              </>
            )}

            <SelectionActionButton
              icon={IconPlaylistAdd}
              label="Playlist"
              isMobile={isMobile}
              onClick={handleAddToPlaylist}
              title="Add to Playlist"
            />

            {itemType === "playlist" && (
              <SelectionActionButton
                icon={IconTrash}
                label="Delete"
                isMobile={isMobile}
                onClick={handleDelete}
                className="text-red-400 hover:text-red-300"
                title="Delete"
              />
            )}
          </div>

          {/* Clear Selection (Desktop Only) */}
          {!isMobile && selectedCount > 1 && (
            <>
              <div className="w-px h-8 bg-border flex-shrink-0" />
              <button
                onClick={clearSelection}
                className="text-text-muted text-sm px-2 hover:text-text transition-colors"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        trackId={selectedArray[0]}
        trackTitle={`${selectedCount} ${itemType}${
          selectedCount !== 1 ? "s" : ""
        }`}
        batchIds={selectedArray}
      />

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
