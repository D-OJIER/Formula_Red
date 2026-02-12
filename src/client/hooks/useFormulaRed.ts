import { useCallback, useEffect, useState } from 'react';
import type {
  InitResponse,
  SubmitOfficialRunResponse,
  GetDailyRaceResponse,
  GetDailyLeaderboardResponse,
  GetSeasonLeaderboardResponse,
  GetPodiumResponse,
} from '../../shared/api';
import type {
  OfficialRaceResult,
  DailyRace,
  TrackConfig,
  CarConfig,
  PlayerResultView,
  PodiumResult,
} from '../../shared/types';

interface GameState {
  username: string | null;
  trackId: string;
  trackConfig: TrackConfig | null;
  race: DailyRace | null;
  dailyResults: OfficialRaceResult[];
  seasonStandings: any[];
  podium: PodiumResult;
  loading: boolean;
  hasSubmitted: boolean;
  playerResult: PlayerResultView | null;
}

export const useFormulaRed = () => {
  const [state, setState] = useState<GameState>({
    username: null,
    trackId: '',
    trackConfig: null,
    race: null,
    dailyResults: [],
    seasonStandings: [],
    podium: { p1: null, p2: null, p3: null },
    loading: true,
    hasSubmitted: false,
    playerResult: null,
  });

  const refreshData = useCallback(async () => {
    try {
      const trackId = new Date().toISOString().slice(0, 10).replace(/-/g, '');

      // Get race info
      const raceRes = await fetch(`/api/race/daily?trackId=${trackId}`);
      const raceData: GetDailyRaceResponse = await raceRes.json();

      // Get daily leaderboard
      const leaderboardRes = await fetch(`/api/leaderboard/daily?trackId=${trackId}`);
      const leaderboardData: GetDailyLeaderboardResponse = await leaderboardRes.json();

      // Get season leaderboard
      const seasonRes = await fetch('/api/leaderboard/season');
      const seasonData: GetSeasonLeaderboardResponse = await seasonRes.json();

      // Get podium
      const podiumRes = await fetch(`/api/race/podium?trackId=${trackId}`);
      const podiumData: GetPodiumResponse = await podiumRes.json();

      // Check if user has submitted
      const hasSubmitted = raceData.race?.results?.some(
        (r) => r.userId === state.username
      ) || false;

      setState((prev) => ({
        ...prev,
        trackId,
        race: raceData.race,
        trackConfig: raceData.race?.trackConfig || prev.trackConfig,
        dailyResults: leaderboardData.results || [],
        seasonStandings: seasonData.standings || [],
        podium: podiumData.podium || { p1: null, p2: null, p3: null },
        hasSubmitted,
        loading: false,
      }));
    } catch (err) {
      console.error('Failed to refresh data', err);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [state.username]);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/init');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: InitResponse = await res.json();
        if (data.type !== 'init') throw new Error('Unexpected response');
        
        setState((prev) => ({
          ...prev,
          username: data.username,
          trackId: data.trackId,
          trackConfig: data.trackConfig,
          loading: false,
        }));
        
        await refreshData();
      } catch (err) {
        console.error('Failed to init game', err);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };
    void init();
  }, []);

  const submitOfficialRun = useCallback(
    async (
      lapTime: number,
      checkpointTimes: number[],
      replayHash: string,
      config: CarConfig
    ) => {
      try {
        const res = await fetch('/api/submit-official-run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lapTime,
            checkpointTimes,
            replayHash,
            config,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: SubmitOfficialRunResponse = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Submission failed');
        }
        
        setState((prev) => ({
          ...prev,
          hasSubmitted: true,
          playerResult: data.result || null,
        }));
        
        await refreshData();
        return data.result;
      } catch (err) {
        throw err;
      }
    },
    [refreshData]
  );

  return {
    ...state,
    submitOfficialRun,
    refreshData,
  } as const;
};
