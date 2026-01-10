/**
 * useOptimizedInteraction Hook
 * 
 * Optimizes user interactions for high refresh rate displays
 * Ensures smooth 60fps, 90fps, 120fps, 144fps+ performance
 */

import { useCallback, useRef, useEffect } from 'react';
import { throttle, scheduleIdleTask, cancelIdleTask } from '../utils/performance';

interface UseOptimizedInteractionOptions {
  /**
   * Throttle delay in ms (default: 16ms for 60fps)
   */
  throttleMs?: number;
  
  /**
   * Whether to use requestIdleCallback for non-critical work
   */
  useIdleCallback?: boolean;
  
  /**
   * Whether to use requestAnimationFrame for visual updates
   */
  useAnimationFrame?: boolean;
}

/**
 * Hook to optimize click/tap interactions
 */
export function useOptimizedClick(
  callback: (event: React.MouseEvent | React.TouchEvent) => void,
  options: UseOptimizedInteractionOptions = {}
) {
  const {
    throttleMs = 16, // 60fps default
    useIdleCallback = false,
    useAnimationFrame = true,
  } = options;

  const callbackRef = useRef(callback);
  const idleTaskRef = useRef<number | null>(null);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleTaskRef.current !== null) {
        cancelIdleTask(idleTaskRef.current);
      }
    };
  }, []);

  const optimizedCallback = useCallback(
    throttle((event: React.MouseEvent | React.TouchEvent) => {
      if (useAnimationFrame) {
        requestAnimationFrame(() => {
          callbackRef.current(event);
        });
      } else if (useIdleCallback) {
        idleTaskRef.current = scheduleIdleTask(() => {
          callbackRef.current(event);
        });
      } else {
        callbackRef.current(event);
      }
    }, throttleMs),
    [throttleMs, useIdleCallback, useAnimationFrame]
  );

  return optimizedCallback;
}

/**
 * Hook to optimize hover interactions
 */
export function useOptimizedHover(
  onEnter?: () => void,
  onLeave?: () => void,
  throttleMs: number = 16
) {
  const enterRef = useRef(onEnter);
  const leaveRef = useRef(onLeave);

  useEffect(() => {
    enterRef.current = onEnter;
    leaveRef.current = onLeave;
  }, [onEnter, onLeave]);

  const handleMouseEnter = useCallback(
    throttle(() => {
      if (enterRef.current) {
        requestAnimationFrame(() => {
          enterRef.current?.();
        });
      }
    }, throttleMs),
    [throttleMs]
  );

  const handleMouseLeave = useCallback(
    throttle(() => {
      if (leaveRef.current) {
        requestAnimationFrame(() => {
          leaveRef.current?.();
        });
      }
    }, throttleMs),
    [throttleMs]
  );

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
}

/**
 * Hook to optimize scroll interactions
 */
export function useOptimizedScroll(
  callback: (scrollTop: number) => void,
  throttleMs: number = 16
) {
  const callbackRef = useRef(callback);
  const rafRef = useRef<number | null>(null);
  const tickingRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleScroll = useCallback(() => {
    if (!tickingRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        callbackRef.current(scrollTop);
        tickingRef.current = false;
      });
      tickingRef.current = true;
    }
  }, []);

  const throttledScroll = useCallback(
    throttle(handleScroll, throttleMs),
    [handleScroll, throttleMs]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return throttledScroll;
}

/**
 * Hook to detect if device supports high refresh rate
 */
export function useHighRefreshRate(): boolean {
  const [isHighRefreshRate, setIsHighRefreshRate] = React.useState(false);

  React.useEffect(() => {
    // Try to detect refresh rate
    let lastTime = performance.now();
    let frameCount = 0;
    let totalTime = 0;
    const samples = 60; // Sample 60 frames

    const measureFrameRate = () => {
      const currentTime = performance.now();
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      
      totalTime += delta;
      frameCount++;

      if (frameCount < samples) {
        requestAnimationFrame(measureFrameRate);
      } else {
        const avgFrameTime = totalTime / frameCount;
        const fps = 1000 / avgFrameTime;
        
        // Consider high refresh rate if > 70fps
        setIsHighRefreshRate(fps > 70);
      }
    };

    requestAnimationFrame(measureFrameRate);
  }, []);

  return isHighRefreshRate;
}

// Re-export React for the hook above
import * as React from 'react';
