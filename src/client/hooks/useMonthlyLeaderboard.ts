import { useState, useEffect } from 'react';
import type { MonthlyStanding } from '../../shared/types';
import type { GetMonthlyLeaderboardResponse } from '../../shared/api';

export const useMonthlyLeaderboard = (monthKey?: string) => {
  const [standings, setStandings] = useState<MonthlyStanding[]>([]);
  const [currentMonthKey, setCurrentMonthKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonthlyLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const queryParam = monthKey ? `?monthKey=${monthKey}` : '';
        const response = await fetch(`/api/leaderboard/monthly${queryParam}`);
        if (!response.ok) {
          throw new Error('Failed to fetch monthly leaderboard');
        }
        const data: GetMonthlyLeaderboardResponse = await response.json();
        setStandings(data.standings);
        setCurrentMonthKey(data.monthKey);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStandings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyLeaderboard();
  }, [monthKey]);

  return { standings, currentMonthKey, loading, error };
};
