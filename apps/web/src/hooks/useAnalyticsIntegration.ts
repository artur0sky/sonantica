/**
 * Analytics Integration Hook
 * 
 * Initializes and manages analytics for the Sonántica app.
 * Follows "Technical Transparency" philosophy.
 */

import { useMemo, useEffect } from "react";
import { useAnalytics } from "@sonantica/analytics";
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
    collectUIInteractions: false, // Disabled to reduce events
    collectSearchData: true, // Disabled to reduce events
    batchSize: 50, // Send in batches of 50
    flushInterval: 300000, // 5 minutes
    maxBufferSize: 500,
  });

  // Sync analytics with offline mode
  useEffect(() => {
    if (offlineMode) {
      analytics.pause();
    } else {
      analytics.resume();
    }
  }, [offlineMode, analytics]);

  return analytics;
}
