/**
 * useAnalyticsDashboard Hook
 * 
 * Fetches and manages aggregated analytics data for the dashboard.
 * Connects the UI components with the backend analytics service.
 * 
 * Support for multi-server aggregation included.
 */

import { useState, useEffect, useCallback } from 'react';
import type { DashboardMetrics, AnalyticsFilters } from '@sonantica/analytics';
import { 
  aggregateOverview, 
  aggregateTopTracks, 
  aggregateHeatmap, 
  aggregateTimeline, 
  aggregateGenres, 
  aggregatePlatformStats, 
  aggregateStreak 
} from '@sonantica/analytics';
import { getServersConfig } from '../../../services/LibraryService';

export function useAnalyticsDashboard(initialFilters?: AnalyticsFilters) {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>(initialFilters || {
    period: 'week',
    limit: 20
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const config = getServersConfig();
      if (config.servers.length === 0) {
        setData(null);
        return;
      }

      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.period) params.append('period', filters.period);
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const queryStr = params.toString();
      
      // Fetch from all servers concurrently (Aggregation Strategy)
      const fetchResults = await Promise.allSettled(
        config.servers.map(async (server) => {
          const baseUrl = server.serverUrl.endsWith('/') ? server.serverUrl.slice(0, -1) : server.serverUrl;
          const response = await fetch(`${baseUrl}/api/v1/analytics/dashboard?${queryStr}`);
          if (!response.ok) throw new Error(`Server ${server.name} error: ${response.statusText}`);
          return response.json() as Promise<DashboardMetrics>;
        })
      );

      const successfulData: DashboardMetrics[] = [];
      fetchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulData.push(result.value);
        } else {
          console.error(`Failed to fetch from server ${config.servers[index].name}:`, result.reason);
        }
      });

      if (successfulData.length === 0) {
        throw new Error('All analytics server requests failed');
      }

      // Aggregate Data from all sources
      const aggregated: DashboardMetrics = {
        startDate: successfulData[0].startDate,
        endDate: successfulData[0].endDate,
        overview: aggregateOverview(successfulData.map(d => d.overview)),
        topTracks: aggregateTopTracks(successfulData.flatMap(d => d.topTracks || [])),
        listeningHeatmap: aggregateHeatmap(successfulData.flatMap(d => d.listeningHeatmap || [])),
        playbackTimeline: aggregateTimeline(successfulData.flatMap(d => d.playbackTimeline || [])),
        genreDistribution: aggregateGenres(successfulData.flatMap(d => d.genreDistribution || [])),
        platformStats: aggregatePlatformStats(successfulData.flatMap(d => d.platformStats || [])),
        recentSessions: successfulData.flatMap(d => d.recentSessions || []).sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        ).slice(0, 10),
        listeningStreak: aggregateStreak(successfulData.map(d => d.listeningStreak))
      };

      setData(aggregated);
    } catch (err) {
      console.error('Error fetching aggregated analytics dashboard:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const updateFilters = (newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const refresh = () => {
    fetchDashboardData();
  };

  return { data, loading, error, filters, updateFilters, refresh };
}
