/**
 * useAnalytics Hook
 * 
 * Main React hook for tracking analytics events.
 * Provides a simple, declarative API for event tracking.
 */

import { useCallback, useEffect } from 'react';
import { useAnalyticsStore } from '../store/analyticsStore';
import type { EventType, EventData } from '../types';

/**
 * Main analytics hook
 */
export function useAnalytics() {
  const {
    sessionId,
    config,
    startSession,
    endSession,
    trackEvent,
    updateConfig,
    flush,
  } = useAnalyticsStore();
  
  // Auto-start session on mount if enabled
  useEffect(() => {
    if (config.enabled && !sessionId) {
      startSession();
    }
    
    // Cleanup on unmount
    return () => {
      if (sessionId) {
        endSession();
      }
    };
  }, [config.enabled]); // Only run when enabled state changes
  
  // Track event wrapper
  const track = useCallback(
    (eventType: EventType, data: EventData) => {
      if (!config.enabled) return;
      trackEvent(eventType, data);
    },
    [config.enabled, trackEvent]
  );
  
  // Convenience methods for common events
  const trackPageView = useCallback(
    (pageName: string, fromPage?: string) => {
      track('ui.view_change', {
        type: 'ui',
        action: 'view_change',
        toView: pageName,
        fromView: fromPage,
      });
    },
    [track]
  );
  
  const trackSearch = useCallback(
    (query: string, resultCount: number) => {
      track('search.query', {
        type: 'search',
        action: 'query',
        query,
        resultCount,
      });
    },
    [track]
  );
  
  return {
    // State
    sessionId,
    enabled: config.enabled,
    
    // Core methods
    track,
    flush,
    
    // Convenience methods
    trackPageView,
    trackSearch,
    
    // Configuration
    updateConfig,
    
    // Session control
    startSession,
    endSession,
  };
}
