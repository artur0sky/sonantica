/**
 * Queue Track Item
 *
 * Wrapper around TrackItem that adds queue-specific functionality:
 * - Drag-and-drop reordering (native HTML5)
 * - Swipe-to-remove gesture
 * - Visual drag handle
 */

import { useState, useRef } from "react";
import { IconGripVertical, IconTrash } from "@tabler/icons-react";
import { cn } from "@sonantica/shared";
import { TrackItem } from "../../features/library/components/TrackItem";

interface QueueTrackItemProps {
  track: any;
  index: number;
  onPlay: () => void;
  onRemove: () => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  compact?: boolean;
}

export function QueueTrackItem({
  track,
  index,
  onPlay,
  onRemove,
  onReorder,
  compact,
}: QueueTrackItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isRemoving, setIsRemoving] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isDraggingHorizontal = useRef(false);

  // Touch/Mouse handlers for swipe-to-remove
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    startX.current = clientX;
    startY.current = clientY;
    currentX.current = clientX;
    isDraggingHorizontal.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - startX.current;
    const deltaY = clientY - startY.current;

    // Determine if horizontal drag
    if (!isDraggingHorizontal.current && Math.abs(deltaX) > 10) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        isDraggingHorizontal.current = true;
      }
    }

    if (isDraggingHorizontal.current && deltaX < 0) {
      e.preventDefault();
      currentX.current = clientX;
      const offset = Math.max(deltaX, -100);
      setDragOffset(offset);
      setIsRemoving(offset < -60);
    }
  };

  const handleTouchEnd = () => {
    if (isRemoving) {
      onRemove();
    }
    setDragOffset(0);
    setIsRemoving(false);
    isDraggingHorizontal.current = false;
  };

  // HTML5 Drag-and-Drop for reordering
  const handleDragStart = (e: React.DragEvent) => {
    if (!onReorder) return;
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!onReorder) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!onReorder) return;
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (fromIndex !== index) {
      onReorder(fromIndex, index);
    }
    setIsDragging(false);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={cn(
        "relative group transition-all duration-200",
        isDragging && "opacity-50",
        isRemoving && "bg-red-500/10"
      )}
      style={{
        transform: dragOffset !== 0 ? `translateX(${dragOffset}px)` : undefined,
      }}
      draggable={!compact && !!onReorder}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {/* Drag Handle (Desktop) */}
      {!compact && onReorder && (
        <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center text-text-muted/20 group-hover:text-text-muted/60 cursor-grab active:cursor-grabbing z-10">
          <IconGripVertical size={18} stroke={1.5} />
        </div>
      )}

      {/* Remove indicator (appears during swipe) */}
      {dragOffset < -20 && (
        <div
          className={cn(
            "absolute inset-y-0 right-0 w-20 flex items-center justify-center rounded-r-lg transition-colors",
            isRemoving
              ? "bg-red-500/40 text-white"
              : "bg-red-500/10 text-red-500"
          )}
        >
          <IconTrash size={20} stroke={2} />
        </div>
      )}

      {/* Track Item with padding for drag handle */}
      <div className={cn(!compact && onReorder && "pl-6")}>
        <TrackItem track={track} onClick={onPlay} compact={compact} />
      </div>
    </div>
  );
}
