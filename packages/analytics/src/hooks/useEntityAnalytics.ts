/**
 * Entity Analytics Hooks
 * 
 * Hooks for fetching artist and album analytics with multi-server aggregation.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  ArtistMetrics, 
  AlbumMetrics, 
  AnalyticsFilters,
  DashboardMetrics
} from '../types/metrics';
import { 
  aggregateArtistMetrics, 
  aggregateAlbumMetrics 
} from '../core/entityAggregation';
import { 
  aggregateOverview as aggOverview,
  aggregateTopTracks,
  aggregateHeatmap,
  aggregateTimeline,
  aggregateGenres,
  aggregatePlatformStats,
  aggregateStreak
} from '../core/aggregation';

// Re-export aggregation for convenience
export { 
  aggOverview as aggregateOverview,
  aggregateTopTracks,
  aggregateHeatmap,
  aggregateTimeline,
  aggregateGenres,
  aggregatePlatformStats,
  aggregateStreak,
  aggregateArtistMetrics,
  aggregateAlbumMetrics
};

interface ServerConfig {
  name: string;
  serverUrl: string;
}

export function useEntityAnalytics<T>(
  entityType: 'artist' | 'album' | 'dashboard',
  entityId: string | null,
  servers: ServerConfig[],
  filters: AnalyticsFilters = { period: 'week', limit: 20 }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (servers.length === 0) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.period) params.append('period', filters.period);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.artistName && entityType === 'album') params.append('artist', filters.artistName);

      const queryStr = params.toString();
      
      const endpoint = entityType === 'dashboard' 
        ? 'dashboard' 
        : entityType === 'artist' 
          ? `artists/${encodeURIComponent(entityId || '')}`
          : `albums/${encodeURIComponent(entityId || '')}`;

      const fetchResults = await Promise.allSettled(
        servers.map(async (server) => {
          const baseUrl = server.serverUrl.endsWith('/') ? server.serverUrl.slice(0, -1) : server.serverUrl;
          const response = await fetch(`${baseUrl}/api/v1/analytics/${endpoint}?${queryStr}`);
          if (!response.ok) throw new Error(`Server ${server.name} error: ${response.statusText}`);
          return response.json();
        })
      );

      const successfulData: any[] = [];
      fetchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulData.push(result.value);
        }
      });

      if (successfulData.length === 0) {
        throw new Error('All analytics server requests failed');
      }

      // Aggregation Logic
      let aggregated: any;
      if (entityType === 'artist') {
        aggregated = aggregateArtistMetrics(successfulData as ArtistMetrics[]);
      } else if (entityType === 'album') {
        aggregated = aggregateAlbumMetrics(successfulData as AlbumMetrics[]);
      } else {
        // Dashboard aggregation logic (reusing existing one)
        aggregated = {
          startDate: successfulData[0].startDate,
          endDate: successfulData[0].endDate,
          overview: aggOverview(successfulData.map(d => d.overview)),
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
      }

      setData(aggregated as T);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId, JSON.stringify(servers), JSON.stringify(filters)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
