/**
 * FolderList - Display and manage configured music folders
 *
 * "User autonomy" - Clear visibility and control over library sources.
 */

import React from "react";
import type { MusicFolder } from "@sonantica/shared";
import { cn } from "../../utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { gpuAnimations } from "@sonantica/shared";

export interface FolderListProps {
  folders: MusicFolder[];
  onToggle?: (folderId: string, enabled: boolean) => void;
  onRemove?: (folderId: string) => void;
  onEdit?: (folderId: string) => void;
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
  className,
}: FolderListProps) {
  if (folders.length === 0) {
    return null; // EmptyState will be handled by parent
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <AnimatePresence mode="popLayout">
        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            onToggle={onToggle}
            onRemove={onRemove}
            onEdit={onEdit}
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
}

function FolderItem({ folder, onToggle, onRemove, onEdit }: FolderItemProps) {
  const displayName =
    folder.name || folder.path.split(/[\\/]/).pop() || folder.path;

  return (
    <motion.div
      {...gpuAnimations.fadeInUp}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg border border-border bg-surface transition-all",
        "hover:border-border-hover hover:bg-surface-elevated",
        !folder.enabled && "opacity-60"
      )}
    >
      {/* Toggle checkbox */}
      <label className="flex items-center cursor-pointer mt-0.5">
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

      {/* Folder info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-medium text-text truncate">
            {displayName}
          </h3>
          {folder.recursive && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-surface-elevated text-text-muted rounded">
              Recursive
            </span>
          )}
        </div>

        <p className="text-sm text-text-muted font-mono truncate mb-2">
          {folder.path}
        </p>

        {/* Stats */}
        <div className="flex gap-4 text-xs text-text-muted/70">
          {folder.trackCount !== undefined && (
            <span>
              {folder.trackCount} {folder.trackCount === 1 ? "track" : "tracks"}
            </span>
          )}
          {folder.lastScanned && (
            <span>
              Last scanned: {new Date(folder.lastScanned).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        {onEdit && (
          <button
            onClick={() => onEdit(folder.id)}
            className={cn(
              "p-2 rounded-md text-text-muted hover:text-text hover:bg-surface-elevated",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            )}
            title="Edit folder settings"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667 1 1-3.667 9-9Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {onRemove && (
          <button
            onClick={() => onRemove(folder.id)}
            className={cn(
              "p-2 rounded-md text-text-muted hover:text-error hover:bg-error/10",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
            )}
            title="Remove folder"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  );
}
