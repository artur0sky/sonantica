import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { cn, gpuAnimations } from "@sonantica/shared";
import { useUIStore } from "../stores/uiStore";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  divider?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

export function ContextMenu({
  items,
  isOpen,
  position,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let { x, y } = position;

      // Adjust horizontal position
      if (x + rect.width > viewport.width) {
        x = viewport.width - rect.width - 10;
      }

      // Adjust vertical position
      if (y + rect.height > viewport.height) {
        y = viewport.height - rect.height - 10;
      }

      // Safety: don't go off left/top
      x = Math.max(10, x);
      y = Math.max(10, y);

      setAdjustedPosition({ x, y });
    }
  }, [isOpen, position]);

  // Close on click outside, scroll, or escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleScroll = (e: Event) => {
      // Don't close if scrolling inside the menu itself (unlikely but safe)
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      onClose();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Use capture for click outside to handle it before other logic
    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          {...gpuAnimations.modal}
          style={{
            position: "fixed",
            left: adjustedPosition.x,
            top: adjustedPosition.y,
            zIndex: 9999,
          }}
          className="min-w-[220px] bg-surface-elevated border border-border rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
        >
          <div className="py-2">
            {items.map((item, index) => (
              <div key={item.id}>
                {item.divider && index > 0 && (
                  <div className="h-px bg-border my-1 mx-2" />
                )}
                <motion.button
                  whileHover={
                    !item.disabled
                      ? { backgroundColor: "var(--color-surface)" }
                      : {}
                  }
                  whileTap={!item.disabled ? { scale: 0.98 } : {}}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.disabled) return;
                    item.onClick();
                    onClose();
                  }}
                  disabled={item.disabled}
                  className={cn(
                    "w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors",
                    item.disabled && "opacity-50 cursor-not-allowed",
                    !item.disabled &&
                      (item.variant === "danger"
                        ? "text-red-400 hover:text-red-300"
                        : "text-text hover:text-accent")
                  )}
                >
                  {item.icon && (
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      {item.icon}
                    </span>
                  )}
                  <span className="text-sm font-medium">{item.label}</span>
                </motion.button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to manage context menu state with global exclusivity
 */
export function useContextMenu(id?: string) {
  const menuId = useRef(id || Math.random().toString(36).substring(7)).current;
  const activeId = useUIStore((s) => s.activeContextMenuId);
  const setActiveId = useUIStore((s) => s.setActiveContextMenuId);

  const isOpen = activeId === menuId;
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setPosition({ x: e.clientX, y: e.clientY });
      setActiveId(menuId);
    },
    [menuId, setActiveId]
  );

  const handleLongPressStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const touch = "touches" in e ? e.touches[0] : (e as React.MouseEvent);
      startPosRef.current = { x: touch.clientX, y: touch.clientY };

      // Clear existing timer if any
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

      longPressTimerRef.current = setTimeout(() => {
        setPosition({ x: touch.clientX, y: touch.clientY });
        setActiveId(menuId);
      }, 500); // 500ms long press
    },
    [menuId, setActiveId]
  );

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Cancel long press if mouse/touch moves too much (e.g. during scroll)
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!longPressTimerRef.current) return;

      const touch = "touches" in e ? e.touches[0] : (e as MouseEvent);
      const deltaX = Math.abs(touch.clientX - startPosRef.current.x);
      const deltaY = Math.abs(touch.clientY - startPosRef.current.y);

      // If moved more than 10px, it's a drag/scroll, not a long press
      if (deltaX > 10 || deltaY > 10) {
        handleLongPressEnd();
      }
    };

    if (longPressTimerRef.current) {
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("touchmove", handleMove);
    }

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("touchmove", handleMove);
    };
  }, [handleLongPressEnd]);

  const close = useCallback(() => {
    if (activeId === menuId) {
      setActiveId(null);
    }
  }, [activeId, menuId, setActiveId]);

  return {
    isOpen,
    position,
    handleContextMenu,
    handleLongPressStart,
    handleLongPressEnd,
    close,
  };
}
