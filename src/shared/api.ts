import type {
  SubmissionPayload,
  OfficialRaceResult,
  SeasonStanding,
  DailyRace,
  TrackConfig,
  PlayerResultView,
  PodiumResult,
} from './types';

export type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
  trackId: string;
  trackConfig: TrackConfig | null;
  lapsRequired: number;
};

export type SubmitOfficialRunResponse = {
  success: boolean;
  result?: PlayerResultView;
  error?: string;
};

export type GetDailyRaceResponse = {
  race: DailyRace | null;
};

export type GetDailyLeaderboardResponse = {
  results: OfficialRaceResult[];
};

export type GetSeasonLeaderboardResponse = {
  standings: SeasonStanding[];
};

export type GetPodiumResponse = {
  podium: PodiumResult;
};
