/**
 * Expanded Player Gestures Hook
 * Encapsulates drag and long-press gesture logic
 * Following Single Responsibility Principle
 */

import { useState, useRef } from "react";
import { PanInfo } from "framer-motion";
import type { DragDirection } from "../types";

interface UseExpandedPlayerGesturesProps {
  onNext: () => void;
  onPrevious: () => void;
  onLongPress?: () => void;
}

export function useExpandedPlayerGestures({
  onNext,
  onPrevious,
  onLongPress,
}: UseExpandedPlayerGesturesProps) {
  const [longPressActive, setLongPressActive] = useState(false);
  const [dragDirection, setDragDirection] = useState<DragDirection>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    pressTimerRef.current = setTimeout(() => {
      setLongPressActive(true);
      onLongPress?.();
      // Visual feedback via vibration if available
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(50);
      }
      setTimeout(() => setLongPressActive(false), 300);
    }, 600);
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  };

  const handlePointerCancel = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  };

  const handleDragStart = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  };

  const handleDrag = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 30;
    if (Math.abs(info.offset.x) > threshold) {
      setDragDirection(info.offset.x > 0 ? "right" : "left");
    } else {
      setDragDirection(null);
    }
  };

  const handleDragEnd = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 100;

    if (info.offset.x > threshold) {
      onPrevious();
    } else if (info.offset.x < -threshold) {
      onNext();
    }

    setDragDirection(null);
  };

  return {
    longPressActive,
    dragDirection,
    handlePointerDown,
    handlePointerUp,
    handlePointerCancel,
    handleDragStart,
    handleDrag,
    handleDragEnd,
  };
}
