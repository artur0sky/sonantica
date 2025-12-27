/**
 * Context Menu Component
 * 
 * Reusable context menu for right-click and long-press interactions.
 * Follows Sonántica's philosophy: "User autonomy" - full control over actions.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { cn, gpuAnimations } from '@sonantica/shared';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  divider?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

export function ContextMenu({ items, isOpen, position, onClose }: ContextMenuProps) {
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

      setAdjustedPosition({ x, y });
    }
  }, [isOpen, position]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          {...gpuAnimations.modal}
          style={{
            position: 'fixed',
            left: adjustedPosition.x,
            top: adjustedPosition.y,
            zIndex: 9999,
          }}
          className="min-w-[200px] bg-surface-elevated border border-border rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
        >
          <div className="py-2">
            {items.map((item, index) => (
              <div key={item.id}>
                {item.divider && index > 0 && (
                  <div className="h-px bg-border my-1 mx-2" />
                )}
                <motion.button
                  whileHover={{ backgroundColor: 'var(--color-surface)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    item.onClick();
                    onClose();
                  }}
                  className={cn(
                    'w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors',
                    item.variant === 'danger'
                      ? 'text-red-400 hover:text-red-300'
                      : 'text-text hover:text-accent'
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
 * Hook to manage context menu state
 */
export function useContextMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  };

  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent) => {
    longPressTimerRef.current = setTimeout(() => {
      const touch = 'touches' in e ? e.touches[0] : e;
      setPosition({ x: touch.clientX, y: touch.clientY });
      setIsOpen(true);
    }, 500); // 500ms long press
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const close = () => setIsOpen(false);

  return {
    isOpen,
    position,
    handleContextMenu,
    handleLongPressStart,
    handleLongPressEnd,
    close,
  };
}
