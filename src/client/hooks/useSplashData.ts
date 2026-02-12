import { useEffect, useState } from 'react';
import type {
  GetDailyLeaderboardResponse,
  GetSeasonLeaderboardResponse,
  GetPodiumResponse,
} from '../../shared/api';
import type { OfficialRaceResult, SeasonStanding, PodiumResult } from '../../shared/types';

export const useSplashData = () => {
  const [dailyResults, setDailyResults] = useState<OfficialRaceResult[]>([]);
  const [seasonStandings, setSeasonStandings] = useState<SeasonStanding[]>([]);
  const [podium, setPodium] = useState<PodiumResult>({ p1: null, p2: null, p3: null });
  const [loading, setLoading] = useState(true);

  const refreshLeaderboards = async () => {
    try {
      const trackId = new Date().toISOString().slice(0, 10).replace(/-/g, '');

      // Fetch all leaderboard data in parallel
      const [dailyRes, seasonRes, podiumRes] = await Promise.all([
        fetch(`/api/leaderboard/daily?trackId=${trackId}`),
        fetch('/api/leaderboard/season'),
        fetch(`/api/race/podium?trackId=${trackId}`),
      ]);

      if (dailyRes.ok) {
        const dailyData: GetDailyLeaderboardResponse = await dailyRes.json();
        setDailyResults(dailyData.results || []);
      }

      if (seasonRes.ok) {
        const seasonData: GetSeasonLeaderboardResponse = await seasonRes.json();
        setSeasonStandings(seasonData.standings || []);
      }

      if (podiumRes.ok) {
        const podiumData: GetPodiumResponse = await podiumRes.json();
        setPodium(podiumData.podium || { p1: null, p2: null, p3: null });
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to load leaderboards:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLeaderboards();
    // Refresh every 30 seconds to keep leaderboard updated
    const interval = setInterval(refreshLeaderboards, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    dailyResults,
    seasonStandings,
    podium,
    loading,
    refreshLeaderboards,
  };
};
