/**
 * useAnalytics Hook
 * 
 * Main React hook for tracking analytics events.
 * Provides a simple, declarative API for event tracking.
 */

import { useCallback, useEffect } from 'react';
import { useAnalyticsStore } from '../store/analyticsStore';
import type { EventType, EventData, AnalyticsConfig } from '../types';

/**
 * Main analytics hook
 */
export function useAnalytics(initialConfig?: Partial<AnalyticsConfig>) {
  const sessionId = useAnalyticsStore(s => s.sessionId);
  const config = useAnalyticsStore(s => s.config);
  const startSession = useAnalyticsStore(s => s.startSession);
  const endSession = useAnalyticsStore(s => s.endSession);
  const trackEvent = useAnalyticsStore(s => s.trackEvent);
  const updateConfig = useAnalyticsStore(s => s.updateConfig);
  const flushStore = useAnalyticsStore(s => s.flush);
  
  // Apply initial config if provided
  useEffect(() => {
    if (initialConfig) {
      updateConfig(initialConfig);
    }
  }, []); // Only on mount

  // Auto-start session on mount if enabled
  useEffect(() => {
    if (config.enabled && !sessionId) {
      startSession();
    }
  }, [config.enabled, sessionId, startSession]);
  
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

  const trackDSPChange = useCallback(
    (action: string, data: any) => {
      track('dsp.eq_preset_changed', {
        type: 'dsp',
        action: action as any,
        ...data
      });
    },
    [track]
  );

  const trackLibraryAction = useCallback(
    (action: string, data: any) => {
      track('library.track_added', {
        type: 'library',
        action: action as any,
        ...data
      });
    },
    [track]
  );

  const flush = useCallback(() => flushStore(), [flushStore]);
  
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
    trackDSPChange,
    trackLibraryAction,
    
    // Configuration
    updateConfig,
    
    // Session control
    startSession,
    endSession,
  };
}
