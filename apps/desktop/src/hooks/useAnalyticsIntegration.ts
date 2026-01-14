/**
 * Analytics Integration Hook
 * 
 * Initializes and manages analytics for the Sonántica app.
 * Follows "Technical Transparency" philosophy.
 */

import { useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useAnalytics } from "@sonantica/analytics";
import { useAnalyticsStore } from "@sonantica/analytics";
import { getServerConfig } from "../services/LibraryService";
import { useSettingsStore } from "../stores/settingsStore";

/**
 * Hook to integrate analytics into the app
 * - Auto-starts session on mount
 * - Tracks page views
 * - Ends session on unmount
 * - Manages offline state for analytics
 */
export function useAnalyticsIntegration() {
  const { offlineMode } = useSettingsStore();

  const analyticsEndpoint = useMemo(() => {
    const server = getServerConfig();
    const baseUrl =
      server?.serverUrl ||
      import.meta.env.VITE_API_URL ||
      "http://localhost:8090";
    // Remove trailing slash if present then append analytics path
    const cleanUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanUrl}/api/v1/analytics`;
  }, []);

  const analytics = useAnalytics({
    enabled: true,
    apiEndpoint: analyticsEndpoint,
    debug: false, // Disabled to reduce noise
    collectPlaybackData: true,
    collectUIInteractions: true, // Enabled for page views
    collectSearchData: true, // Disabled to reduce events
    batchSize: 100, // Reduced network impact
    flushInterval: 300000, // 5 minutes
    maxBufferSize: 500,
  });

  // Sync analytics with offline mode
  const trackInOfflineMode = useAnalyticsStore((state) => state.config.trackInOfflineMode);
  
  useEffect(() => {
    if (offlineMode && !trackInOfflineMode) {
      analytics.pause();
    } else {
      analytics.resume();
    }
  }, [offlineMode, trackInOfflineMode, analytics]);

  // Track Page Views
  const [location] = useLocation();
  useEffect(() => {
    analytics.trackPageView(location);
  }, [location, analytics]);

  return analytics;
}
