'use client';

import { useEffect, useState } from 'react';
import { api, type StatsData } from '@/lib/api';

interface UseDashboardDataResult {
  stats: StatsData | null;
  loading: boolean;
  error: string;
  hasData: boolean;
}

export function useDashboardData(userId: number): UseDashboardDataResult {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.stats.getStats(userId);
        setStats(data);
      } catch (err) {
        setError('Fehler beim Laden der Statistiken');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  const hasData = stats !== null && Object.keys(stats).length > 0;

  return { stats, loading, error, hasData };
}
