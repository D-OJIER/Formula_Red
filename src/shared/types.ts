// Core domain models for Formula Red

export type RaceDay = {
  date: string; // YYYYMMDD format
  trackSeed: string;
  trackConfig: TrackConfig;
  modifier: DailyModifier;
  frozen: boolean;
  results?: RaceResult[];
};

export type TrackConfig = {
  seed: string;
  length: number; // Track length in meters
  corners: number; // Number of corners
  elevation: number; // Elevation change in meters
  surface: 'asphalt' | 'concrete' | 'mixed';
  difficulty: number; // 0-100 difficulty rating
};

export type PracticeSession = {
  sessionType: 'P1' | 'P2' | 'P3' | 'P4';
  date: string; // YYYYMMDD format
  userId: string;
  submission: DriverSubmission;
  lapTime: number; // Lap time in seconds
  timestamp: number; // Submission timestamp
};

export type RaceResult = {
  userId: string;
  username: string;
  submission: DriverSubmission;
  lapTime: number; // Official lap time in seconds
  position: number; // Final position (1-based)
  points: number; // Points earned
  timestamp: number; // Submission timestamp
};

export type DriverSubmission = {
  userId: string;
  username: string;
  carSetup: CarSetup;
  strategy: RaceStrategy;
  timestamp: number;
};

export type CarSetup = {
  downforce: number; // 0-100
  suspension: number; // 0-100
  gearRatio: number; // 0-100
  tirePressure: number; // 0-100
  brakeBias: number; // 0-100
};

export type RaceStrategy = {
  fuelLoad: number; // 0-100
  tireCompound: 'soft' | 'medium' | 'hard';
  pitStrategy: 'no-pit' | 'one-stop' | 'two-stop';
};

export type DailyModifier =
  | 'RAIN'
  | 'DIRTY_AIR'
  | 'HIGH_TYRE_WEAR'
  | 'SAFETY_CAR'
  | 'LOW_GRIP';

export type SeasonStanding = {
  userId: string;
  username: string;
  totalPoints: number;
  racesPlayed: number;
  podiumCount: number;
  wins: number;
  positions: number[]; // Array of finishing positions
};

export type SessionType = 'P1' | 'P2' | 'P3' | 'P4' | 'RACE' | 'CLOSED';

export type PodiumResult = {
  p1: RaceResult | null;
  p2: RaceResult | null;
  p3: RaceResult | null;
};
