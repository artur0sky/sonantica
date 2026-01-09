/**
 * Performance Utilities
 * 
 * Optimizations for INP (Interaction to Next Paint) and high refresh rate displays.
 * Ensures smooth interactions at 60fps, 90fps, 120fps, and 144fps+
 */

/**
 * Debounce function - delays execution until after wait time has elapsed
 * Perfect for search inputs, resize events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per interval
 * Perfect for scroll events, mouse move, high-frequency interactions
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastResult: ReturnType<T>;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    
    return lastResult;
  };
}

/**
 * Request Idle Callback wrapper with fallback
 * Schedules non-critical work during browser idle time
 * 
 * Cross-browser support:
 * - Chrome/Edge: Native requestIdleCallback
 * - Firefox: Native requestIdleCallback (since v55)
 * - Safari: Fallback to setTimeout (no native support as of 2026)
 */
export function scheduleIdleTask(
  callback: () => void,
  options?: { timeout?: number }
): number {
  // Check for native support (Chrome, Firefox, Edge)
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  // Safari fallback: Use setTimeout with minimal delay
  // This ensures the callback runs but doesn't block the main thread
  return setTimeout(callback, 1) as unknown as number;
}

/**
 * Cancel idle callback with fallback
 */
export function cancelIdleTask(id: number): void {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Request Animation Frame wrapper for smooth animations
 * Ensures animations run at device's native refresh rate
 */
export function scheduleAnimationFrame(callback: () => void): number {
  return requestAnimationFrame(callback);
}

/**
 * Cancel animation frame
 */
export function cancelAnimationFrame(id: number): void {
  window.cancelAnimationFrame(id);
}

/**
 * Batch multiple state updates into a single render
 * Uses React 18+ automatic batching, but can be forced
 */
export function batchUpdates(callback: () => void): void {
  // React 18+ automatically batches, but we can use this for clarity
  callback();
}

/**
 * Measure interaction timing (for debugging)
 */
export function measureInteraction(name: string, callback: () => void): void {
  if (typeof performance === 'undefined') {
    callback();
    return;
  }
  
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `${name}-duration`;
  
  performance.mark(startMark);
  callback();
  performance.mark(endMark);
  
  try {
    performance.measure(measureName, startMark, endMark);
    const measure = performance.getEntriesByName(measureName)[0];
    
    // Log if interaction takes more than 200ms (INP threshold)
    if (measure.duration > 200) {
      console.warn(`⚠️ Slow interaction: ${name} took ${measure.duration.toFixed(2)}ms`);
    }
    
    // Clean up
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
  } catch (e) {
    // Ignore errors in performance measurement
  }
}

/**
 * Get device refresh rate (approximate)
 * Returns frame budget in ms (16.67ms for 60Hz, 8.33ms for 120Hz, etc.)
 */
export function getFrameBudget(): number {
  // Try to detect refresh rate
  let refreshRate = 60; // Default to 60Hz
  
  // Modern browsers may expose this
  if ('screen' in window && 'refreshRate' in (window.screen as any)) {
    refreshRate = (window.screen as any).refreshRate || 60;
  }
  
  // Return frame budget in milliseconds
  return 1000 / refreshRate;
}

/**
 * Check if we should use reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Optimized scroll handler with RAF
 */
export function createOptimizedScrollHandler(
  callback: (scrollTop: number) => void
): () => void {
  let ticking = false;
  let lastScrollTop = 0;
  
  const handleScroll = () => {
    lastScrollTop = window.scrollY || document.documentElement.scrollTop;
    
    if (!ticking) {
      requestAnimationFrame(() => {
        callback(lastScrollTop);
        ticking = false;
      });
      
      ticking = true;
    }
  };
  
  return handleScroll;
}

/**
 * Passive event listener helper
 * Improves scroll performance
 */
export function addPassiveEventListener(
  element: HTMLElement | Window,
  event: string,
  handler: EventListener
): void {
  element.addEventListener(event, handler, { passive: true });
}

/**
 * Check if device supports high refresh rate
 */
export function supportsHighRefreshRate(): boolean {
  const frameBudget = getFrameBudget();
  return frameBudget < 16; // Less than 60Hz
}
