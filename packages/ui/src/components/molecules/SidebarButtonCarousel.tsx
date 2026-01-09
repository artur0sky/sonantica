/**
 * SidebarButtonCarousel Component
 *
 * Swipeable carousel of sidebar action buttons with long-press to expand.
 * Implements native touch/mouse gestures without Framer Motion.
 *
 * "User autonomy" - provides quick access to all sidebar features.
 */

import {
  useState,
  useRef,
  useEffect,
  type ComponentType,
  type TouchEvent,
  type MouseEvent,
} from "react";
import { ActionIconButton } from "../atoms";
import { cn } from "../../utils";

export interface SidebarButton {
  /** Unique button identifier */
  id: string;
  /** Icon component */
  icon: ComponentType<{ size?: number; className?: string }>;
  /** Button label (for accessibility) */
  label: string;
  /** Click action */
  action: () => void;
  /** Whether button is in active state */
  isActive?: boolean;
}

export interface SidebarButtonCarouselProps {
  /** Array of sidebar buttons */
  buttons: SidebarButton[];
  /** Enable swipe gestures to navigate */
  enableSwipe?: boolean;
  /** Initial featured button index */
  defaultFeaturedIndex?: number;
  /** Button size */
  size?: "xs" | "sm" | "md";
  /** Additional CSS classes */
  className?: string;
}

export function SidebarButtonCarousel({
  buttons,
  enableSwipe = true,
  defaultFeaturedIndex = 0,
  size = "xs",
  className,
}: SidebarButtonCarouselProps) {
  const [featuredIndex, setFeaturedIndex] = useState(defaultFeaturedIndex);
  const [showAll, setShowAll] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startX = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  // Navigate to next button
  const handleNext = () => {
    setFeaturedIndex((prev) => (prev + 1) % buttons.length);
  };

  // Navigate to previous button
  const handlePrevious = () => {
    setFeaturedIndex((prev) => (prev - 1 + buttons.length) % buttons.length);
  };

  // Touch start handler
  const handleTouchStart = (e: TouchEvent) => {
    if (!enableSwipe || showAll) return;
    startX.current = e.touches[0].clientX;
    setIsDragging(true);

    // Long press to show all
    longPressTimer.current = setTimeout(() => {
      setShowAll(true);
    }, 600);
  };

  // Touch move handler
  const handleTouchMove = (e: TouchEvent) => {
    if (!enableSwipe || showAll || !isDragging) return;
    const currentX = e.touches[0].clientX;
    const offset = currentX - startX.current;
    setDragOffset(offset);
  };

  // Touch end handler
  const handleTouchEnd = () => {
    if (!enableSwipe || showAll) return;

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    if (!isDragging) return;

    const threshold = 30;
    if (dragOffset > threshold) {
      handlePrevious();
    } else if (dragOffset < -threshold) {
      handleNext();
    }

    setDragOffset(0);
    setIsDragging(false);
  };

  // Mouse handlers for desktop
  const handleMouseDown = (e: MouseEvent) => {
    if (!enableSwipe || showAll) return;
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!enableSwipe || showAll || !isDragging) return;
    const offset = e.clientX - startX.current;
    setDragOffset(offset);
  };

  const handleMouseUp = () => {
    if (!enableSwipe || showAll || !isDragging) return;

    const threshold = 30;
    if (dragOffset > threshold) {
      handlePrevious();
    } else if (dragOffset < -threshold) {
      handleNext();
    }

    setDragOffset(0);
    setIsDragging(false);
  };

  // Context menu to show all
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowAll(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <div className={cn("flex items-center gap-1 relative", className)}>
      <div
        className={cn(
          "flex items-center gap-1 transition-all duration-300",
          showAll && "bg-white/5 rounded-full p-1 border border-white/10 pr-2"
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        style={{
          transform:
            enableSwipe && !showAll && isDragging
              ? `translateX(${dragOffset}px)`
              : undefined,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }}
      >
        {buttons.map((btn, idx) => {
          const isFeatured = idx === featuredIndex;
          const shouldShow = showAll || isFeatured;

          if (!shouldShow) return null;

          return (
            <div
              key={btn.id}
              className={cn(
                "transition-all duration-200",
                isFeatured && !showAll && "scale-110"
              )}
              style={{
                opacity: shouldShow ? 1 : 0,
                transform: shouldShow ? "scale(1)" : "scale(0.8)",
              }}
            >
              <ActionIconButton
                icon={btn.icon}
                onClick={() => {
                  btn.action();
                  if (showAll) setShowAll(false);
                }}
                isActive={btn.isActive}
                size={size}
                title={btn.label}
                className={cn(
                  "transition-all",
                  isFeatured && !showAll
                    ? "bg-white/10"
                    : "opacity-60 hover:opacity-100"
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Backdrop to close expanded view */}
      {showAll && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setShowAll(false)}
        />
      )}
    </div>
  );
}
