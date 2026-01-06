/**
 * Analytics Integration Hook
 * 
 * Initializes and manages analytics for the Sonántica app.
 * Follows "Technical Transparency" philosophy.
 */

import { useEffect, useMemo } from 'react';
import { useAnalytics } from '@sonantica/analytics';
import { useLocation } from 'wouter';
import { getServerConfig } from '../services/LibraryService';

/**
 * Hook to integrate analytics into the app
 * - Auto-starts session on mount
 * - Tracks page views
 * - Ends session on unmount
 */
export function useAnalyticsIntegration() {
  const analyticsEndpoint = useMemo(() => {
    const server = getServerConfig();
    const baseUrl = server?.serverUrl || import.meta.env.VITE_API_URL || 'http://localhost:8090';
    // Remove trailing slash if present then append analytics path
    const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanUrl}/api/v1/analytics`;
  }, []);

  const analytics = useAnalytics({
    enabled: true,
    apiEndpoint: analyticsEndpoint,
    debug: import.meta.env.DEV,
    collectPlaybackData: true,
    collectUIInteractions: true,
    collectSearchData: true,
    batchSize: 100,
    flushInterval: 60000, // 60 seconds
    maxBufferSize: 500,
  });

  const [location] = useLocation();

  // Track page views
  useEffect(() => {
    const pageName = location === '/' ? 'tracks' : location.slice(1);
    analytics.trackPageView(pageName);
  }, [location, analytics]);

  return analytics;
}
