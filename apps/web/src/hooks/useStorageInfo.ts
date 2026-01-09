import { useState, useEffect, useCallback } from 'react';
import { getStorageInfo, type StorageBreakdown } from '../services/StorageService';

/**
 * Hook to monitor offline storage usage
 */
export function useStorageInfo() {
  const [data, setData] = useState<StorageBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await getStorageInfo();
      setData(info);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get storage info'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    data,
    loading,
    error,
    refresh,
  };
}
