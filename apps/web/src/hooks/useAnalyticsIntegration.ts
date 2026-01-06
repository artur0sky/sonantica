/**
 * Analytics Integration Hook
 * 
 * Initializes and manages analytics for the Sonántica app.
 * Follows "Technical Transparency" philosophy.
 */

import { useEffect } from 'react';
import { useAnalytics } from '@sonantica/analytics';
import { useLocation } from 'wouter';

/**
 * Hook to integrate analytics into the app
 * - Auto-starts session on mount
 * - Tracks page views
 * - Ends session on unmount
 */
export function useAnalyticsIntegration() {
  const analytics = useAnalytics({
    enabled: true,
    apiEndpoint: import.meta.env.VITE_API_URL || 'http://localhost:8090/api/v1/analytics',
    debug: import.meta.env.DEV,
    collectPlaybackData: true,
    collectUIInteractions: true,
    collectSearchData: true,
    batchSize: 50,
    flushInterval: 30000, // 30 seconds
    maxBufferSize: 200,
  });

  const [location] = useLocation();

  // Track page views
  useEffect(() => {
    const pageName = location === '/' ? 'tracks' : location.slice(1);
    analytics.trackPageView(pageName);
  }, [location, analytics]);

  return analytics;
}
