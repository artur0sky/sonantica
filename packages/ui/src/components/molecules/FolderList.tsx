/**
 * FolderList - Display and manage configured music folders
 *
 * "User autonomy" - Clear visibility and control over library sources.
 */

import React, { useState } from "react";
import type { MusicFolder } from "@sonantica/shared";
import { cn } from "../../utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { gpuAnimations } from "@sonantica/shared";
import { ContextMenu, useContextMenu } from "../ContextMenu";
import type { ContextMenuItem } from "../ContextMenu";
import {
  IconRefresh,
  IconEdit,
  IconTrash,
  IconCheck,
  IconPlayerPlay,
  IconPlayerPause,
  IconFolderOpen,
  IconFolder,
} from "@tabler/icons-react";

export interface FolderListProps {
  folders: MusicFolder[];
  onToggle?: (folderId: string, enabled: boolean) => void;
  onRemove?: (folderId: string) => void;
  onEdit?: (folderId: string) => void;
  onScan?: (folderId: string) => void;
  onScanSelected?: (folderIds: string[]) => void;
  onToggleRecursive?: (folderId: string, recursive: boolean) => void;
  scanning?: boolean;
  scanningFolderId?: string | null;
  className?: string;
}

/**
 * FolderList component - Displays configured music folders
 */
export function FolderList({
  folders,
  onToggle,
  onRemove,
  onEdit,
  onScan,
  onScanSelected,
  onToggleRecursive,
  scanning = false,
  scanningFolderId = null,
  className,
}: FolderListProps) {
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(
    new Set()
  );
  const [selectionMode, setSelectionMode] = useState(false);

  if (folders.length === 0) {
    return null; // EmptyState will be handled by parent
  }

  const handleToggleSelection = (folderId: string) => {
    setSelectedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedFolders(new Set(folders.map((f) => f.id)));
  };

  const handleDeselectAll = () => {
    setSelectedFolders(new Set());
  };

  const handleExitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedFolders(new Set());
  };

  const handleScanSelected = () => {
    if (onScanSelected && selectedFolders.size > 0) {
      onScanSelected(Array.from(selectedFolders));
      handleExitSelectionMode();
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Selection Mode Header */}
      {selectionMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center justify-between p-3 bg-accent/10 border border-accent/30 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-text">
              {selectedFolders.size} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-xs text-accent hover:underline"
            >
              Select all
            </button>
            <button
              onClick={handleDeselectAll}
              className="text-xs text-accent hover:underline"
            >
              Deselect all
            </button>
          </div>
          <div className="flex items-center gap-2">
            {selectedFolders.size > 0 && onScanSelected && (
              <button
                onClick={handleScanSelected}
                disabled={scanning}
                className="px-3 py-1.5 text-sm bg-accent text-white rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                Scan selected
              </button>
            )}
            <button
              onClick={handleExitSelectionMode}
              className="px-3 py-1.5 text-sm bg-surface-elevated text-text rounded-md hover:bg-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="popLayout">
        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            onToggle={onToggle}
            onRemove={onRemove}
            onEdit={onEdit}
            onScan={onScan}
            onToggleRecursive={onToggleRecursive}
            selectionMode={selectionMode}
            isSelected={selectedFolders.has(folder.id)}
            onToggleSelection={handleToggleSelection}
            onEnterSelectionMode={() => setSelectionMode(true)}
            scanning={scanning}
            isScanning={scanningFolderId === folder.id}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface FolderItemProps {
  folder: MusicFolder;
  onToggle?: (folderId: string, enabled: boolean) => void;
  onRemove?: (folderId: string) => void;
  onEdit?: (folderId: string) => void;
  onScan?: (folderId: string) => void;
  onToggleRecursive?: (folderId: string, recursive: boolean) => void;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (folderId: string) => void;
  onEnterSelectionMode: () => void;
  scanning: boolean;
  isScanning: boolean;
}

function FolderItem({
  folder,
  onToggle,
  onRemove,
  onEdit,
  onScan,
  onToggleRecursive,
  selectionMode,
  isSelected,
  onToggleSelection,
  onEnterSelectionMode,
  scanning,
  isScanning,
}: FolderItemProps) {
  const displayName =
    folder.name || folder.path.split(/[\\/]/).pop() || folder.path;

  const contextMenu = useContextMenu();

  // Context menu items
  const menuItems: ContextMenuItem[] = [
    ...(onScan && folder.enabled
      ? [
          {
            id: "scan",
            label: "Scan",
            icon: <IconRefresh size={18} stroke={1.5} />,
            onClick: () => onScan(folder.id),
          },
        ]
      : []),
    {
      id: "select",
      label: "Select",
      icon: <IconCheck size={18} stroke={1.5} />,
      onClick: () => {
        onEnterSelectionMode();
        onToggleSelection(folder.id);
      },
    },
    {
      id: "divider-1",
      label: "",
      divider: true,
      onClick: () => {},
    },
    {
      id: "toggle",
      label: folder.enabled ? "Disable" : "Enable",
      icon: folder.enabled ? (
        <IconPlayerPause size={18} stroke={1.5} />
      ) : (
        <IconPlayerPlay size={18} stroke={1.5} />
      ),
      onClick: () => onToggle?.(folder.id, !folder.enabled),
    },
    ...(onToggleRecursive
      ? [
          {
            id: "toggle-recursive",
            label: folder.recursive
              ? "Disable recursive scan"
              : "Enable recursive scan",
            icon: folder.recursive ? (
              <IconFolder size={18} stroke={1.5} />
            ) : (
              <IconFolderOpen size={18} stroke={1.5} />
            ),
            onClick: () => onToggleRecursive(folder.id, !folder.recursive),
          },
        ]
      : []),
    ...(onEdit
      ? [
          {
            id: "edit",
            label: "Edit",
            icon: <IconEdit size={18} stroke={1.5} />,
            onClick: () => onEdit(folder.id),
          },
        ]
      : []),
    ...(onRemove && !folder.isSystem
      ? [
          {
            id: "divider-2",
            label: "",
            divider: true,
            onClick: () => {},
          },
          {
            id: "remove",
            label: "Remove",
            icon: <IconTrash size={18} stroke={1.5} />,
            onClick: () => onRemove(folder.id),
            variant: "danger" as const,
          },
        ]
      : []),
  ];

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelection(folder.id);
    }
  };

  return (
    <>
      <motion.div
        {...gpuAnimations.fadeInUp}
        exit={{ opacity: 0, scale: 0.95 }}
        layout
        onClick={handleClick}
        onContextMenu={contextMenu.handleContextMenu}
        onTouchStart={contextMenu.handleLongPressStart}
        onTouchEnd={contextMenu.handleLongPressEnd}
        onMouseDown={contextMenu.handleLongPressStart}
        onMouseUp={contextMenu.handleLongPressEnd}
        onMouseLeave={contextMenu.handleLongPressEnd}
        className={cn(
          "flex items-start gap-4 p-4 rounded-lg border border-border bg-surface transition-all cursor-pointer",
          "hover:border-border-hover hover:bg-surface-elevated",
          !folder.enabled && "opacity-60",
          selectionMode && "select-none",
          isSelected && "border-accent bg-accent/10",
          isScanning && "border-accent bg-accent/5"
        )}
      >
        {/* Selection Checkbox (visible in selection mode) */}
        {selectionMode && (
          <label className="flex items-center cursor-pointer mt-0.5">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(folder.id)}
              className="sr-only peer"
            />
            <div
              className={cn(
                "w-5 h-5 rounded border-2 border-border bg-bg transition-all",
                "peer-checked:bg-accent peer-checked:border-accent",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg",
                "relative flex items-center justify-center"
              )}
            >
              {isSelected && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M10 3L4.5 8.5L2 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </label>
        )}

        {/* Toggle checkbox (visible when NOT in selection mode) */}
        {!selectionMode && (
          <label
            className="flex items-center cursor-pointer mt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={folder.enabled}
              onChange={(e) => onToggle?.(folder.id, e.target.checked)}
              className="sr-only peer"
            />
            <div
              className={cn(
                "w-5 h-5 rounded border-2 border-border bg-bg transition-all",
                "peer-checked:bg-accent peer-checked:border-accent",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg",
                "relative flex items-center justify-center"
              )}
            >
              {folder.enabled && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="text-white"
                >
                  <path
                    d="M10 3L4.5 8.5L2 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </label>
        )}

        {/* Folder info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base font-medium text-text truncate">
              {displayName}
            </h3>
            {folder.isSystem && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-accent/10 text-accent rounded border border-accent/20">
                System
              </span>
            )}
            {folder.recursive && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-surface-elevated text-text-muted rounded">
                Recursive
              </span>
            )}
            {isScanning && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-accent/10 text-accent rounded border border-accent/20 animate-pulse">
                <IconRefresh size={12} className="mr-1 animate-spin" />
                Scanning...
              </span>
            )}
          </div>

          <p className="text-sm text-text-muted font-mono truncate mb-2">
            {folder.path}
          </p>

          {/* Stats */}
          <div className="flex gap-4 text-xs text-text-muted/70 flex-wrap">
            {folder.trackCount !== undefined && (
              <span>
                {folder.trackCount}{" "}
                {folder.trackCount === 1 ? "track" : "tracks"}
              </span>
            )}
            {folder.lastScanned && (
              <span>
                Last scanned:{" "}
                {new Date(folder.lastScanned).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Context Menu */}
      <ContextMenu
        items={menuItems}
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={contextMenu.close}
      />
    </>
  );
}
