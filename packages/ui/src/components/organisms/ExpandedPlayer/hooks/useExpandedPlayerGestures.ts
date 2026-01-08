/**
 * Expanded Player Gestures Hook
 * Encapsulates drag and long-press gesture logic using native pointer events
 * Following Single Responsibility Principle
 * No external animation library dependencies
 */

import { useState, useRef } from "react";
import type { DragDirection } from "../types";

interface UseExpandedPlayerGesturesProps {
  onNext: () => void;
  onPrevious: () => void;
  onLongPress?: () => void;
}

interface PointerPosition {
  x: number;
  y: number;
}

export function useExpandedPlayerGestures({
  onNext,
  onPrevious,
  onLongPress,
}: UseExpandedPlayerGesturesProps) {
  const [longPressActive, setLongPressActive] = useState(false);
  const [dragDirection, setDragDirection] = useState<DragDirection>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startPosRef = useRef<PointerPosition>({ x: 0, y: 0 });
  const currentOffsetRef = useRef<number>(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    startPosRef.current = { x: e.clientX, y: e.clientY };
    currentOffsetRef.current = 0;
    setIsDragging(false);
    
    // Start long-press timer
    pressTimerRef.current = setTimeout(() => {
      if (!isDragging) {
        setLongPressActive(true);
        onLongPress?.();
        // Visual feedback via vibration if available
        if (window.navigator?.vibrate) {
          window.navigator.vibrate(50);
        }
        setTimeout(() => setLongPressActive(false), 300);
      }
    }, 600);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startPosRef.current) return;

    const offsetX = e.clientX - startPosRef.current.x;
    const offsetY = e.clientY - startPosRef.current.y;
    
    // If moved more than 10px, consider it a drag
    if (Math.abs(offsetX) > 10 || Math.abs(offsetY) > 10) {
      setIsDragging(true);
      // Cancel long-press if dragging
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
    }

    currentOffsetRef.current = offsetX;

    // Update drag direction feedback
    const threshold = 30;
    if (Math.abs(offsetX) > threshold) {
      setDragDirection(offsetX > 0 ? "right" : "left");
    } else {
      setDragDirection(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // Clear long-press timer
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    // Handle drag end
    if (isDragging) {
      const threshold = 100;
      const offsetX = currentOffsetRef.current;

      if (offsetX > threshold) {
        onPrevious();
      } else if (offsetX < -threshold) {
        onNext();
      }
    }

    // Reset state
    setDragDirection(null);
    setIsDragging(false);
    currentOffsetRef.current = 0;
  };

  const handlePointerCancel = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    setDragDirection(null);
    setIsDragging(false);
    currentOffsetRef.current = 0;
  };

  return {
    longPressActive,
    dragDirection,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  };
}
