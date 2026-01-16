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
import { cn, isDesktop } from "../../utils";

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
  const desktop = isDesktop();
  const [featuredIndex, setFeaturedIndex] = useState(defaultFeaturedIndex);
  const [showAll, setShowAll] = useState(desktop); // Default to true on desktop
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
    if (!enableSwipe || showAll || desktop) return;
    startX.current = e.touches[0].clientX;
    setIsDragging(true);

    // Long press to show all
    longPressTimer.current = setTimeout(() => {
      setShowAll(true);
    }, 600);
  };

  // Touch move handler
  const handleTouchMove = (e: TouchEvent) => {
    if (!enableSwipe || showAll || desktop || !isDragging) return;
    const currentX = e.touches[0].clientX;
    const offset = currentX - startX.current;
    setDragOffset(offset);
  };

  // Touch end handler
  const handleTouchEnd = () => {
    if (!enableSwipe || showAll || desktop) return;

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
    if (!enableSwipe || showAll || desktop) return;
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!enableSwipe || showAll || desktop || !isDragging) return;
    const offset = e.clientX - startX.current;
    setDragOffset(offset);
  };

  const handleMouseUp = () => {
    if (!enableSwipe || showAll || desktop || !isDragging) return;

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
    if (desktop) return;
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
    <div className={cn("flex items-center gap-1 relative min-w-0", className)}>
      <div
        className={cn(
          "flex items-center gap-3 transition-all duration-300",
          showAll || desktop
            ? "overflow-x-auto overflow-y-hidden scrollbar-none mask-linear-fade" // Added fade mask for scroll indication if needed
            : ""
          // Removed container styles (bg, border, rounded)
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
            enableSwipe && !showAll && !desktop && isDragging
              ? `translateX(${dragOffset}px)`
              : undefined,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {buttons.map((btn, idx) => {
          const isFeatured = idx === featuredIndex;
          const shouldShow = showAll || desktop || isFeatured;

          if (!shouldShow) return null;

          return (
            <div
              key={btn.id}
              className={cn(
                "transition-all duration-200 flex-shrink-0"
                // Removed scale-110 logic for simplicity and "clean" look
              )}
              style={{
                opacity: 1, // Always opaque
                transform: "none",
              }}
            >
              <ActionIconButton
                icon={btn.icon}
                onClick={() => {
                  btn.action();
                  // Close if action taken on mobile
                  if (showAll && !desktop) setShowAll(false);
                }}
                isActive={btn.isActive}
                size={size}
                title={btn.label}
                className={cn(
                  "hover:text-accent transition-colors",
                  btn.isActive ? "text-accent" : "text-text-muted",
                  // Reset backgrounds to look like download buttons (ghost)
                  "bg-transparent hover:bg-white/5 active:scale-95"
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Backdrop to close expanded view (Mobile only) */}
      {showAll && !desktop && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setShowAll(false)}
        />
      )}
    </div>
  );
}
