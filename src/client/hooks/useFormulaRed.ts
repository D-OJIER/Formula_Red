import { useCallback, useEffect, useState } from 'react';
import type {
  InitResponse,
  SubmitPracticeResponse,
  SubmitRaceResponse,
  GetRaceDayResponse,
  GetPracticeLeaderboardResponse,
  GetRaceLeaderboardResponse,
  GetSeasonStandingsResponse,
  GetCurrentSessionResponse,
  GetPodiumResponse,
} from '../../shared/api';
import type {
  PracticeSession,
  RaceResult,
  RaceDay,
  SeasonStanding,
  SessionType,
  PodiumResult,
  DriverSubmission,
} from '../../shared/types';

interface GameState {
  username: string | null;
  currentSession: SessionType;
  date: string;
  raceDay: RaceDay | null;
  practiceSessions: PracticeSession[];
  raceResults: RaceResult[];
  seasonStandings: SeasonStanding[];
  podium: PodiumResult;
  loading: boolean;
}

export const useFormulaRed = () => {
  const [state, setState] = useState<GameState>({
    username: null,
    currentSession: 'CLOSED',
    date: '',
    raceDay: null,
    practiceSessions: [],
    raceResults: [],
    seasonStandings: [],
    podium: { p1: null, p2: null, p3: null },
    loading: true,
  });

  const refreshData = useCallback(async () => {
    try {
      // Get current session
      const sessionRes = await fetch('/api/session');
      const sessionData: GetCurrentSessionResponse = await sessionRes.json();

      // Get race day
      const raceDayRes = await fetch(`/api/race/day?date=${sessionData.date}`);
      const raceDayData: GetRaceDayResponse = await raceDayRes.json();

      // Get practice leaderboard if in practice session
      let practiceSessions: PracticeSession[] = [];
      if (
        sessionData.session === 'P1' ||
        sessionData.session === 'P2' ||
        sessionData.session === 'P3' ||
        sessionData.session === 'P4'
      ) {
        const practiceRes = await fetch(
          `/api/practice/leaderboard?date=${sessionData.date}&sessionType=${sessionData.session}`
        );
        const practiceData: GetPracticeLeaderboardResponse =
          await practiceRes.json();
        practiceSessions = practiceData.sessions;
      }

      // Get race leaderboard
      const raceRes = await fetch(
        `/api/race/leaderboard?date=${sessionData.date}`
      );
      const raceData: GetRaceLeaderboardResponse = await raceRes.json();

      // Get season standings
      const seasonRes = await fetch('/api/season/standings');
      const seasonData: GetSeasonStandingsResponse = await seasonRes.json();

      // Get podium
      const podiumRes = await fetch(
        `/api/race/podium?date=${sessionData.date}`
      );
      const podiumData: GetPodiumResponse = await podiumRes.json();

      setState({
        username: state.username,
        currentSession: sessionData.session,
        date: sessionData.date,
        raceDay: raceDayData.raceDay,
        practiceSessions,
        raceResults: raceData.results,
        seasonStandings: seasonData.standings,
        podium: podiumData.podium,
        loading: false,
      });
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
          currentSession: data.currentSession,
          date: data.date,
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

  const submitPractice = useCallback(
    async (submission: {
      carSetup: DriverSubmission['carSetup'];
      strategy: DriverSubmission['strategy'];
    }) => {
      try {
        const res = await fetch('/api/practice/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: SubmitPracticeResponse = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Submission failed');
        }
        await refreshData();
        return data.lapTime || 0;
      } catch (err) {
        throw err;
      }
    },
    [refreshData]
  );

  const submitRace = useCallback(
    async (submission: {
      carSetup: DriverSubmission['carSetup'];
      strategy: DriverSubmission['strategy'];
    }) => {
      try {
        const res = await fetch('/api/race/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: SubmitRaceResponse = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Submission failed');
        }
        await refreshData();
        return data.lapTime || 0;
      } catch (err) {
        throw err;
      }
    },
    [refreshData]
  );

  return {
    ...state,
    submitPractice,
    submitRace,
    refreshData,
  } as const;
};
