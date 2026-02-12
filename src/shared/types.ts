// Core domain models for Formula Red - Driver Edition

export type TrackConfig = {
  trackId: string; // YYYYMMDD format
  length: number; // Track length in meters
  cornerDensity: number; // 0-100, density of corners
  straightRatio: number; // 0-100, ratio of straight sections
  width: number; // Track width in meters
  surfaceGrip: number; // 0-100, grip level
  elevationProfile: number[]; // Array of elevation points
  weatherProbability: number; // 0-100, chance of weather effects
};

export type CarConfig = {
  downforce: number; // 0-100
  gearBias: number; // 0-100 (affects acceleration curve and max speed)
  tyres: 'soft' | 'medium' | 'hard';
  drivingStyle: number; // 0-100 (affects boost power and stability)
  tacticalAbility: number; // 0-100
};

export type DailyRace = {
  trackId: string; // YYYYMMDD format
  trackConfig: TrackConfig;
  frozen: boolean; // Whether race is frozen (end of day)
  results: OfficialRaceResult[];
  lapsRequired: number; // Number of laps required to complete the race
};

export type OfficialRaceResult = {
  userId: string;
  username: string;
  trackId: string;
  lapTime: number; // Lap time in seconds
  position: number; // Final position (1-based)
  points: number; // Points earned
  config: CarConfig;
  checkpointTimes: number[]; // Times at each checkpoint
  replayHash: string; // Hash of replay data for anti-cheat
  timestamp: number; // Submission timestamp
  avatarUrl?: string; // Reddit avatar URL
};

export type SeasonStanding = {
  userId: string;
  username: string;
  totalPoints: number;
  racesPlayed: number;
  podiumCount: number;
  wins: number;
  positions: number[]; // Array of finishing positions
};

export type SubmissionPayload = {
  userId: string;
  username: string;
  trackId: string;
  lapTime: number;
  config: CarConfig;
  checkpointTimes: number[];
  replayHash: string;
};

export type PlayerResultView = {
  rank: number;
  lapTime: number;
  leaderboard: OfficialRaceResult[];
};

export type PodiumResult = {
  p1: OfficialRaceResult | null;
  p2: OfficialRaceResult | null;
  p3: OfficialRaceResult | null;
};

export type MonthlyStanding = {
  userId: string;
  username: string;
  totalPoints: number;
  racesPlayed: number;
  wins: number;
  podiumCount: number;
  avatarUrl?: string;
};

export type PlayerProfile = {
  userId: string;
  username: string;
  racesParticipated: number;
  racesWon: number;
  totalPoints: number;
  podiumCount: number;
  bestPosition: number;
  recentRaces: Array<{
    trackId: string;
    position: number;
    points: number;
    lapTime: number;
    timestamp: number;
  }>;
  avatarUrl?: string;
};
