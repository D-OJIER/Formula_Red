import type {
  DriverSubmission,
  PracticeSession,
  RaceResult,
  RaceDay,
  SeasonStanding,
  SessionType,
  TrackConfig,
  DailyModifier,
  PodiumResult,
} from './types';

export type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
  currentSession: SessionType;
  date: string;
};

export type SubmitPracticeResponse = {
  success: boolean;
  lapTime?: number;
  error?: string;
};

export type SubmitRaceResponse = {
  success: boolean;
  lapTime?: number;
  error?: string;
};

export type GetRaceDayResponse = {
  raceDay: RaceDay | null;
};

export type GetPracticeLeaderboardResponse = {
  sessions: PracticeSession[];
};

export type GetRaceLeaderboardResponse = {
  results: RaceResult[];
};

export type GetSeasonStandingsResponse = {
  standings: SeasonStanding[];
};

export type GetCurrentSessionResponse = {
  session: SessionType;
  date: string;
};

export type AdminFreezeRaceResponse = {
  success: boolean;
  error?: string;
};

export type AdminRecomputeResponse = {
  success: boolean;
  error?: string;
};

export type AdminResetPracticeResponse = {
  success: boolean;
  error?: string;
};

export type AdminFinalizeResponse = {
  success: boolean;
  podium?: PodiumResult;
  error?: string;
};

export type GetPodiumResponse = {
  podium: PodiumResult;
};
