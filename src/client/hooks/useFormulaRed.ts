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
      if (!sessionRes.ok) throw new Error('Failed to get session');
      const sessionData: GetCurrentSessionResponse = await sessionRes.json();

      // Get race day
      const raceDayRes = await fetch(`/api/race/day?date=${sessionData.date}`);
      if (!raceDayRes.ok) throw new Error('Failed to get race day');
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
        if (practiceRes.ok) {
          const practiceData: GetPracticeLeaderboardResponse =
            await practiceRes.json();
          practiceSessions = practiceData.sessions || [];
        }
      }

      // Get race leaderboard
      const raceRes = await fetch(
        `/api/race/leaderboard?date=${sessionData.date}`
      );
      let raceResults: RaceResult[] = [];
      if (raceRes.ok) {
        const raceData: GetRaceLeaderboardResponse = await raceRes.json();
        raceResults = raceData.results || [];
      }

      // Get season standings
      const seasonRes = await fetch('/api/season/standings');
      let seasonStandings: SeasonStanding[] = [];
      if (seasonRes.ok) {
        const seasonData: GetSeasonStandingsResponse = await seasonRes.json();
        seasonStandings = seasonData.standings || [];
      }

      // Get podium
      const podiumRes = await fetch(
        `/api/race/podium?date=${sessionData.date}`
      );
      let podium: PodiumResult = { p1: null, p2: null, p3: null };
      if (podiumRes.ok) {
        const podiumData: GetPodiumResponse = await podiumRes.json();
        podium = podiumData.podium || { p1: null, p2: null, p3: null };
      }

      setState((prev) => ({
        ...prev,
        currentSession: sessionData.session,
        date: sessionData.date,
        raceDay: raceDayData.raceDay,
        practiceSessions,
        raceResults,
        seasonStandings,
        podium,
        loading: false,
      }));
    } catch (err) {
      console.error('Failed to refresh data', err);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/init');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: InitResponse = await res.json();
        if (data.type !== 'init') throw new Error('Unexpected response');
        
        // Load all data in parallel
        const [raceDayRes, practiceRes, raceRes, seasonRes, podiumRes] = await Promise.all([
          fetch(`/api/race/day?date=${data.date}`),
          data.currentSession === 'P1' || data.currentSession === 'P2' || data.currentSession === 'P3' || data.currentSession === 'P4'
            ? fetch(`/api/practice/leaderboard?date=${data.date}&sessionType=${data.currentSession}`)
            : Promise.resolve(null),
          fetch(`/api/race/leaderboard?date=${data.date}`),
          fetch('/api/season/standings'),
          fetch(`/api/race/podium?date=${data.date}`),
        ]);

        const raceDayData: GetRaceDayResponse = raceDayRes.ok ? await raceDayRes.json() : { raceDay: null };
        const practiceData: GetPracticeLeaderboardResponse = practiceRes?.ok ? await practiceRes.json() : { sessions: [] };
        const raceData: GetRaceLeaderboardResponse = raceRes.ok ? await raceRes.json() : { results: [] };
        const seasonData: GetSeasonStandingsResponse = seasonRes.ok ? await seasonRes.json() : { standings: [] };
        const podiumData: GetPodiumResponse = podiumRes.ok ? await podiumRes.json() : { podium: { p1: null, p2: null, p3: null } };

        setState({
          username: data.username,
          currentSession: data.currentSession,
          date: data.date,
          raceDay: raceDayData.raceDay,
          practiceSessions: practiceData.sessions || [],
          raceResults: raceData.results || [],
          seasonStandings: seasonData.standings || [],
          podium: podiumData.podium || { p1: null, p2: null, p3: null },
          loading: false,
        });
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
