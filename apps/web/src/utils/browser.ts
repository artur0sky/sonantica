/**
 * Browser Detection Utilities
 * 
 * Cross-browser compatibility helpers for Chrome, Firefox, and Safari
 */

/**
 * Browser detection (use sparingly, prefer feature detection)
 */
export const browser = {
  /**
   * Check if running in Safari
   */
  isSafari: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  },

  /**
   * Check if running in Firefox
   */
  isFirefox: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /firefox/i.test(navigator.userAgent);
  },

  /**
   * Check if running in Chrome
   */
  isChrome: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /chrome/i.test(navigator.userAgent) && !/edg/i.test(navigator.userAgent);
  },

  /**
   * Check if running in Edge (Chromium)
   */
  isEdge: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /edg/i.test(navigator.userAgent);
  },

  /**
   * Check if running on iOS
   */
  isIOS: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  },

  /**
   * Check if running on Android
   */
  isAndroid: (): boolean => {
    if (typeof window === 'undefined') return false;
    return /android/i.test(navigator.userAgent);
  },

  /**
   * Check if device supports touch
   */
  isTouchDevice: (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
};

/**
 * Feature detection (preferred over browser detection)
 */
export const features = {
  /**
   * Check if requestIdleCallback is supported
   */
  supportsIdleCallback: (): boolean => {
    return typeof window !== 'undefined' && 'requestIdleCallback' in window;
  },

  /**
   * Check if IntersectionObserver is supported
   */
  supportsIntersectionObserver: (): boolean => {
    return typeof window !== 'undefined' && 'IntersectionObserver' in window;
  },

  /**
   * Check if ResizeObserver is supported
   */
  supportsResizeObserver: (): boolean => {
    return typeof window !== 'undefined' && 'ResizeObserver' in window;
  },

  /**
   * Check if Web Animations API is supported
   */
  supportsWebAnimations: (): boolean => {
    return typeof window !== 'undefined' && 'animate' in document.createElement('div');
  },

  /**
   * Check if CSS containment is supported
   */
  supportsCSSContainment: (): boolean => {
    if (typeof window === 'undefined') return false;
    return CSS.supports('contain', 'layout style paint');
  },

  /**
   * Check if backdrop-filter is supported
   */
  supportsBackdropFilter: (): boolean => {
    if (typeof window === 'undefined') return false;
    return (
      CSS.supports('backdrop-filter', 'blur(10px)') ||
      CSS.supports('-webkit-backdrop-filter', 'blur(10px)')
    );
  },

  /**
   * Check if prefers-reduced-motion is active
   */
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  },

  /**
   * Check if prefers-color-scheme: dark is active
   */
  prefersDarkMode: (): boolean => {
    if (typeof window === 'undefined') return false;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return mediaQuery.matches;
  },
};

/**
 * Get browser-specific optimizations
 */
export function getBrowserOptimizations() {
  return {
    // Safari needs -webkit- prefixes for some properties
    transformPrefix: browser.isSafari() ? '-webkit-transform' : 'transform',
    
    // Safari iOS needs special handling for momentum scrolling
    needsMomentumScrolling: browser.isIOS(),
    
    // Firefox uses different scrollbar styling
    usesCustomScrollbar: browser.isFirefox(),
    
    // Safari doesn't support requestIdleCallback
    needsIdleCallbackFallback: browser.isSafari(),
    
    // Touch devices need different hover handling
    isTouchDevice: browser.isTouchDevice(),
  };
}

/**
 * Apply browser-specific CSS class to document
 * Useful for browser-specific CSS rules
 */
export function applyBrowserClass(): void {
  if (typeof document === 'undefined') return;

  const classes: string[] = [];

  if (browser.isSafari()) classes.push('browser-safari');
  if (browser.isFirefox()) classes.push('browser-firefox');
  if (browser.isChrome()) classes.push('browser-chrome');
  if (browser.isEdge()) classes.push('browser-edge');
  if (browser.isIOS()) classes.push('platform-ios');
  if (browser.isAndroid()) classes.push('platform-android');
  if (browser.isTouchDevice()) classes.push('touch-device');
  if (features.prefersReducedMotion()) classes.push('reduced-motion');

  document.documentElement.classList.add(...classes);
}

/**
 * Get optimal animation duration based on browser/device
 */
export function getOptimalAnimationDuration(baseMs: number = 150): number {
  // Reduce animation duration on low-end devices
  if (browser.isAndroid() && navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return Math.max(50, baseMs * 0.7);
  }

  // Respect reduced motion preference
  if (features.prefersReducedMotion()) {
    return 1; // Minimal duration
  }

  return baseMs;
}

/**
 * Check if browser supports high refresh rate
 */
export function supportsHighRefreshRate(): boolean {
  if (typeof window === 'undefined') return false;

  // Try to detect refresh rate
  if ('screen' in window && 'refreshRate' in (window.screen as any)) {
    const refreshRate = (window.screen as any).refreshRate || 60;
    return refreshRate > 60;
  }

  // Fallback: Assume modern devices might have high refresh rate
  return browser.isChrome() || browser.isEdge();
}

/**
 * Get CSS vendor prefix for current browser
 */
export function getVendorPrefix(): string {
  if (typeof window === 'undefined') return '';

  if (browser.isSafari() || browser.isIOS()) return '-webkit-';
  if (browser.isFirefox()) return '-moz-';
  if (browser.isEdge()) return '-ms-';
  
  return ''; // Chrome and modern browsers don't need prefixes for most properties
}

/**
 * Polyfill for requestIdleCallback (Safari)
 */
export function polyfillIdleCallback(): void {
  if (typeof window === 'undefined') return;
  
  if (!('requestIdleCallback' in window)) {
    (window as any).requestIdleCallback = function(callback: IdleRequestCallback) {
      const start = Date.now();
      return setTimeout(() => {
        callback({
          didTimeout: false,
          timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
        });
      }, 1) as unknown as number;
    };

    (window as any).cancelIdleCallback = function(id: number) {
      clearTimeout(id);
    };
  }
}

/**
 * Initialize browser compatibility features
 * Call this once on app startup
 */
export function initBrowserCompatibility(): void {
  applyBrowserClass();
  polyfillIdleCallback();

  // Log browser info in development
  if (import.meta.env.DEV) {
    console.log('🌐 Browser Detection:', {
      safari: browser.isSafari(),
      firefox: browser.isFirefox(),
      chrome: browser.isChrome(),
      edge: browser.isEdge(),
      iOS: browser.isIOS(),
      android: browser.isAndroid(),
      touch: browser.isTouchDevice(),
      highRefreshRate: supportsHighRefreshRate(),
    });

    console.log('✨ Feature Support:', {
      idleCallback: features.supportsIdleCallback(),
      intersectionObserver: features.supportsIntersectionObserver(),
      resizeObserver: features.supportsResizeObserver(),
      webAnimations: features.supportsWebAnimations(),
      cssContainment: features.supportsCSSContainment(),
      backdropFilter: features.supportsBackdropFilter(),
    });
  }
}
