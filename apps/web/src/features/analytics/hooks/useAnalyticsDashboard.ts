/**
 * useAnalyticsDashboard Hook
 * 
 * Fetches and manages aggregated analytics data for the dashboard.
 * Connects the UI components with the backend analytics service.
 */

import { useState, useEffect, useCallback } from 'react';
import type { DashboardMetrics, AnalyticsFilters } from '@sonantica/analytics';

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

      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.period) params.append('period', filters.period);
      if (filters.platform) params.append('platform', filters.platform);
      if (filters.limit) params.append('limit', filters.limit.toString());

      // Use the API URL from environment or proxy
      const apiBase = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiBase}/api/v1/analytics/dashboard?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const dashboardData: DashboardMetrics = await response.json();
      setData(dashboardData);
    } catch (err) {
      console.error('Error fetching analytics dashboard:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial fetch and fetch when filters change
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const updateFilters = (newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const refresh = () => {
    fetchDashboardData();
  };

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    refresh
  };
}
