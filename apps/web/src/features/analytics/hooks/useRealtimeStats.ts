import { useState, useEffect, useCallback } from 'react';
import { getServersConfig } from '../../../services/LibraryService';

export interface RealtimeData {
  timeline: {
    timestamp: number;
    plays: number;
    events: number;
  }[];
  trending: {
    trackId: string;
    score: number;
    title?: string;
    artist?: string;
  }[];
  active: number;
}

import { useSettingsStore } from '../../../stores/settingsStore';

export function useRealtimeStats() {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRealtime = useCallback(async () => {
    try {
      const config = getServersConfig();
      if (config.servers.length === 0) return;

      // Aggregating from multiple servers if needed, but usually one
      const server = config.servers[0];
      const baseUrl = server.serverUrl.endsWith('/') ? server.serverUrl.slice(0, -1) : server.serverUrl;

      const response = await fetch(`${baseUrl}/api/v1/analytics/realtime`);
      if (!response.ok) throw new Error(`Real-time failed: ${response.statusText}`);

      const newData = await response.json() as RealtimeData;

      // Sort timeline by timestamp ascending for the chart
      newData.timeline.sort((a, b) => a.timestamp - b.timestamp);

      setData(newData);
      setLoading(false);
    } catch (err) {
      console.error('Real-time stats fetch error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
    }
  }, []);

  const refreshRate = useSettingsStore(s => s.analyticsDashboardRefreshRate || 10000);

  useEffect(() => {
    fetchRealtime();

    const interval = setInterval(fetchRealtime, refreshRate);
    return () => clearInterval(interval);
  }, [fetchRealtime, refreshRate]);

  return { data, loading, error, refresh: fetchRealtime };
}
