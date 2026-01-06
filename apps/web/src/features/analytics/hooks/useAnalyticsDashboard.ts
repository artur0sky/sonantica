/**
 * useAnalyticsDashboard Hook
 * 
 * Fetches and manages aggregated analytics data for the dashboard.
 * Connects the UI components with the backend analytics service.
 * 
 * Support for multi-server aggregation included.
 */

import { useState, useEffect, useCallback } from 'react';
import type { DashboardMetrics, AnalyticsFilters, OverviewStats, TopTrack, HeatmapData, TimelineData, PlatformStats, GenreStats, StreakData } from '@sonantica/analytics';
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

// Logic for multi-source data aggregation

function aggregateOverview(stats: OverviewStats[]): OverviewStats {
  const result: OverviewStats = {
    totalPlays: 0,
    totalPlayTime: 0,
    averageSessionDuration: 0,
    completionRate: 0,
    uniqueTracks: 0,
    uniqueAlbums: 0,
    uniqueArtists: 0,
    totalSessions: 0,
    averageTracksPerSession: 0,
    skipRate: 0,
    playsChange: 0,
    playTimeChange: 0,
    sessionsChange: 0
  };

  let totalSessionTime = 0;
  let totalTracksPlayed = 0;

  stats.forEach(s => {
    result.totalPlays += (s.totalPlays || 0);
    result.totalPlayTime += (s.totalPlayTime || 0);
    result.totalSessions += (s.totalSessions || 0);
    result.uniqueTracks += (s.uniqueTracks || 0);
    result.uniqueAlbums += (s.uniqueAlbums || 0);
    result.uniqueArtists += (s.uniqueArtists || 0);
    
    totalSessionTime += ((s.averageSessionDuration || 0) * (s.totalSessions || 0));
    totalTracksPlayed += ((s.averageTracksPerSession || 0) * (s.totalSessions || 0));
    
    result.completionRate += (s.completionRate || 0);
    result.skipRate += (s.skipRate || 0);
  });

  const validStats = stats.filter(Boolean);

  if (result.totalSessions > 0) {
    result.averageSessionDuration = Math.round(totalSessionTime / result.totalSessions);
    result.averageTracksPerSession = Number((totalTracksPlayed / result.totalSessions).toFixed(2));
  }

  if (validStats.length > 0) {
    result.completionRate = (result.completionRate || 0) / validStats.length;
    result.skipRate = (result.skipRate || 0) / validStats.length;
    result.playsChange = validStats.reduce((acc, s) => acc + (s.playsChange || 0), 0) / validStats.length;
    result.playTimeChange = validStats.reduce((acc, s) => acc + (s.playTimeChange || 0), 0) / validStats.length;
    result.sessionsChange = validStats.reduce((acc, s) => acc + (s.sessionsChange || 0), 0) / validStats.length;
  }

  return result;
}

function aggregateTopTracks(tracks: TopTrack[]): TopTrack[] {
  const map = new Map<string, TopTrack>();
  
  tracks.forEach(t => {
    const key = `${t.trackTitle.toLowerCase()}||${t.artistName.toLowerCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.playCount += (t.playCount || 0);
      existing.playTime += (t.playTime || 0);
      existing.completionRate = (existing.completionRate + (t.completionRate || 0)) / 2;
    } else {
      map.set(key, { ...t });
    }
  });

  return Array.from(map.values())
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 10)
    .map((t, idx) => ({ ...t, rank: idx + 1 }));
}

function aggregateHeatmap(data: HeatmapData[]): HeatmapData[] {
  const map = new Map<string, HeatmapData>();
  
  data.forEach(d => {
    if (!d) return;
    const key = `${d.date}||${d.hour || 'none'}`;
    const existing = map.get(key);
    if (existing) {
      existing.value += (d.value || 0);
    } else {
      map.set(key, { ...d });
    }
  });

  return Array.from(map.values());
}

function aggregateTimeline(data: TimelineData[]): TimelineData[] {
  const map = new Map<string, TimelineData>();
  
  data.forEach(d => {
    if (!d) return;
    const key = d.date;
    const existing = map.get(key);
    if (existing) {
      existing.playCount += (d.playCount || 0);
      existing.playTime += (d.playTime || 0);
      existing.uniqueTracks += (d.uniqueTracks || 0);
      existing.uniqueArtists += (d.uniqueArtists || 0);
    } else {
      map.set(key, { ...d });
    }
  });

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function aggregatePlatformStats(stats: PlatformStats[]): PlatformStats[] {
  const map = new Map<string, PlatformStats>();
  let totalSessions = 0;

  stats.forEach(s => {
    if (!s) return;
    const key = s.platform;
    const existing = map.get(key);
    if (existing) {
      existing.sessionCount += (s.sessionCount || 0);
      existing.playCount += (s.playCount || 0);
      existing.playTime += (s.playTime || 0);
    } else {
      map.set(key, { ...s });
    }
    totalSessions += (s.sessionCount || 0);
  });

  return Array.from(map.values()).map(s => ({
    ...s,
    percentage: totalSessions > 0 ? (s.sessionCount / totalSessions) * 100 : 0
  }));
}

function aggregateGenres(stats: GenreStats[]): GenreStats[] {
  const map = new Map<string, GenreStats>();
  let totalPlays = 0;

  stats.forEach(s => {
    if (!s) return;
    const key = s.genre;
    const existing = map.get(key);
    if (existing) {
      existing.playCount += (s.playCount || 0);
      existing.playTime += (s.playTime || 0);
    } else {
      map.set(key, { ...s });
    }
    totalPlays += (s.playCount || 0);
  });

  return Array.from(map.values()).map(s => ({
    ...s,
    percentage: totalPlays > 0 ? (s.playCount / totalPlays) * 100 : 0
  })).sort((a, b) => b.playCount - a.playCount);
}

function aggregateStreak(streaks: StreakData[]): StreakData {
  if (streaks.length === 0) return { currentStreak: 0, longestStreak: 0, totalDaysActive: 0, totalWeeksActive: 0, streakStartDate: "" };
  
  const validStreaks = streaks.filter(Boolean);
  if (validStreaks.length === 0) return { currentStreak: 0, longestStreak: 0, totalDaysActive: 0, totalWeeksActive: 0, streakStartDate: "" };

  return {
    currentStreak: Math.max(...validStreaks.map(s => s.currentStreak || 0)),
    longestStreak: Math.max(...validStreaks.map(s => s.longestStreak || 0)),
    totalDaysActive: Math.max(...validStreaks.map(s => s.totalDaysActive || 0)),
    totalWeeksActive: Math.max(...validStreaks.map(s => s.totalWeeksActive || 0)),
    streakStartDate: validStreaks[0].streakStartDate || ""
  };
}
