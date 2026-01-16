/**
 * TrackInfo Component
 *
 * Displays track information with cover art, title, and artist.
 * Supports optional swipe gestures for track navigation.
 *
 * Part of Sonántica's player UI - respects minimalist design philosophy.
 */

import { useState, useRef, type TouchEvent, type MouseEvent } from "react";
import { CoverArt } from "../atoms";
import { formatArtists } from "@sonantica/shared";
import { cn } from "../../utils";

export interface TrackInfoProps {
  /** Cover art URL */
  coverArt?: string;
  /** Track title */
  title: string;
  /** Artist name(s) */
  artist: string | string[];
  /** Click handler */
  onClick?: (e: React.MouseEvent) => void;
  /** Long click handler (e.g. for stop) */
  onLongClick?: () => void;
  /** Enable swipe gestures for track navigation */
  enableSwipeGesture?: boolean;
  /** Swipe left handler (next track) */
  onSwipeLeft?: () => void;
  /** Swipe right handler (previous track) */
  onSwipeRight?: () => void;
  /** Cover art size */
  coverSize?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Show drag indicator */
  showDragIndicator?: boolean;
}

export function TrackInfo({
  coverArt,
  title,
  artist,
  onClick,
  onLongClick,
  enableSwipeGesture = false,
  onSwipeLeft,
  onSwipeRight,
  coverSize = "md",
  className,
  showDragIndicator = false,
}: TrackInfoProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActive = useRef(false);

  const coverSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  // Touch handlers for swipe gesture
  const handleTouchStart = (e: TouchEvent) => {
    if (enableSwipeGesture) {
      startX.current = e.touches[0].clientX;
      setIsDragging(true);
    }

    // Long press logic
    isLongPressActive.current = false;
    longPressTimer.current = setTimeout(() => {
      if (onLongClick && !isDragging) {
        isLongPressActive.current = true;
        onLongClick();
      }
    }, 600);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!enableSwipeGesture || !isDragging) return;
    currentX.current = e.touches[0].clientX;
    const offset = currentX.current - startX.current;
    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!enableSwipeGesture || !isDragging) return;

    const threshold = 80;
    if (dragOffset > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (dragOffset < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }

    setDragOffset(0);
    setIsDragging(false);
  };

  // Mouse handlers for desktop swipe
  const handleMouseDown = (e: MouseEvent) => {
    if (enableSwipeGesture) {
      startX.current = e.clientX;
      setIsDragging(true);
    }

    // Long press logic
    isLongPressActive.current = false;
    longPressTimer.current = setTimeout(() => {
      if (onLongClick && !isDragging) {
        isLongPressActive.current = true;
        onLongClick();
      }
    }, 600);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!enableSwipeGesture || !isDragging) return;
    currentX.current = e.clientX;
    const offset = currentX.current - startX.current;
    setDragOffset(offset);
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!enableSwipeGesture || !isDragging) return;

    const threshold = 80;
    if (dragOffset > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (dragOffset < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }

    setDragOffset(0);
    setIsDragging(false);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 min-w-0 relative",
        enableSwipeGesture && "cursor-grab active:cursor-grabbing",
        className
      )}
      style={{
        transform: enableSwipeGesture
          ? `translateX(${dragOffset}px)`
          : undefined,
        transition: isDragging ? "none" : "transform 0.2s ease-out",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Cover Art */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (!isLongPressActive.current && onClick) onClick(e);
        }}
        className={cn(
          coverSizes[coverSize],
          "flex-shrink-0 cursor-pointer active:scale-95 transition-transform relative"
        )}
      >
        <CoverArt
          src={coverArt}
          alt="Cover"
          className="w-full h-full"
          iconSize={iconSizes[coverSize]}
        />

        {/* Drag indicator */}
        {showDragIndicator && enableSwipeGesture && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-[var(--color-text)]/30" />
            <div className="w-1 h-1 rounded-full bg-[var(--color-text)]/30" />
            <div className="w-1 h-1 rounded-full bg-[var(--color-text)]/30" />
          </div>
        )}
      </div>

      {/* Track Info */}
      <div
        className="min-w-0 flex-1 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (!isLongPressActive.current && onClick) onClick(e);
        }}
      >
        <div className="font-medium text-sm leading-tight truncate text-text">
          {title || "Unknown Title"}
        </div>
        <div className="text-[11px] text-text-muted leading-tight truncate mt-0.5">
          {formatArtists(artist)}
        </div>
      </div>
    </div>
  );
}
