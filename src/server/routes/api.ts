import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import type {
  InitResponse,
  SubmitPracticeResponse,
  SubmitRaceResponse,
  GetRaceDayResponse,
  GetPracticeLeaderboardResponse,
  GetRaceLeaderboardResponse,
  GetSeasonStandingsResponse,
  GetCurrentSessionResponse,
  AdminFreezeRaceResponse,
  AdminRecomputeResponse,
  AdminResetPracticeResponse,
  AdminFinalizeResponse,
  GetPodiumResponse,
} from '../../shared/api';
import { handlePracticeSubmission, handleRaceSubmission, getPracticeLeaderboard, getRaceLeaderboard } from '../handlers/submissionHandler';
import { getRaceDay } from '../storage/raceStorage';
import { getSeasonStandings } from '../storage/seasonStorage';
import { getCurrentSession, getDateString } from '../utils/sessionTime';
import {
  adminForceFreezeRace,
  adminRecomputeRaceResults,
  adminResetPracticeSessions,
  adminFinalizeRaceDay,
} from '../handlers/adminHandler';
import { getPodiumFromResults } from '../utils/finalization';
import type { DriverSubmission } from '../../shared/types';

type ErrorResponse = {
  status: 'error';
  message: string;
};

export const api = new Hono();

// Initialize game state
api.get('/init', async (c) => {
  const { postId } = context;

  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required but missing from context',
      },
      400
    );
  }

  try {
    const username = await reddit.getCurrentUsername();
    const currentSession = getCurrentSession();
    const date = getDateString();

    return c.json<InitResponse>({
      type: 'init',
      postId: postId,
      username: username ?? 'anonymous',
      currentSession,
      date,
    });
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);
    let errorMessage = 'Unknown error during initialization';
    if (error instanceof Error) {
      errorMessage = `Initialization failed: ${error.message}`;
    }
    return c.json<ErrorResponse>(
      { status: 'error', message: errorMessage },
      400
    );
  }
});

// Get current session info
api.get('/session', async (c) => {
  const session = getCurrentSession();
  const date = getDateString();
  return c.json<GetCurrentSessionResponse>({ session, date });
});

// Submit practice session
api.post('/practice/submit', async (c) => {
  try {
    const username = await reddit.getCurrentUsername();
    const userId = context.userId || username || 'anonymous';

    const body = await c.req.json() as {
      carSetup: DriverSubmission['carSetup'];
      strategy: DriverSubmission['strategy'];
    };

    const submission: DriverSubmission = {
      userId,
      username: username || 'anonymous',
      carSetup: body.carSetup,
      strategy: body.strategy,
      timestamp: Date.now(),
    };

    const result = await handlePracticeSubmission(submission);
    return c.json<SubmitPracticeResponse>(result);
  } catch (error) {
    return c.json<SubmitPracticeResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      400
    );
  }
});

// Submit race
api.post('/race/submit', async (c) => {
  try {
    const username = await reddit.getCurrentUsername();
    const userId = context.userId || username || 'anonymous';

    const body = await c.req.json() as {
      carSetup: DriverSubmission['carSetup'];
      strategy: DriverSubmission['strategy'];
    };

    const submission: DriverSubmission = {
      userId,
      username: username || 'anonymous',
      carSetup: body.carSetup,
      strategy: body.strategy,
      timestamp: Date.now(),
    };

    const result = await handleRaceSubmission(submission);
    return c.json<SubmitRaceResponse>(result);
  } catch (error) {
    return c.json<SubmitRaceResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      400
    );
  }
});

// Get race day info
api.get('/race/day', async (c) => {
  const date = c.req.query('date') || getDateString();
  const raceDay = await getRaceDay(date);
  return c.json<GetRaceDayResponse>({ raceDay });
});

// Get practice leaderboard
api.get('/practice/leaderboard', async (c) => {
  const date = c.req.query('date') || getDateString();
  const sessionType = c.req.query('sessionType') || getCurrentSession();
  
  if (sessionType === 'RACE' || sessionType === 'CLOSED') {
    return c.json<GetPracticeLeaderboardResponse>({ sessions: [] });
  }

  const sessions = await getPracticeLeaderboard(date, sessionType);
  return c.json<GetPracticeLeaderboardResponse>({ sessions });
});

// Get race leaderboard
api.get('/race/leaderboard', async (c) => {
  const date = c.req.query('date') || getDateString();
  const results = await getRaceLeaderboard(date);
  return c.json<GetRaceLeaderboardResponse>({ results });
});

// Get season standings
api.get('/season/standings', async (c) => {
  const standings = await getSeasonStandings();
  return c.json<GetSeasonStandingsResponse>({ standings });
});

// Get podium for a race day
api.get('/race/podium', async (c) => {
  const date = c.req.query('date') || getDateString();
  const raceDay = await getRaceDay(date);
  
  if (!raceDay || !raceDay.results) {
    return c.json<GetPodiumResponse>({
      podium: { p1: null, p2: null, p3: null },
    });
  }

  const podium = getPodiumFromResults(raceDay.results);
  return c.json<GetPodiumResponse>({ podium });
});

// Admin endpoints
api.post('/admin/freeze', async (c) => {
  const body = await c.req.json() as { date: string };
  const result = await adminForceFreezeRace(body.date);
  return c.json<AdminFreezeRaceResponse>(result);
});

api.post('/admin/recompute', async (c) => {
  const body = await c.req.json() as { date: string };
  const result = await adminRecomputeRaceResults(body.date);
  return c.json<AdminRecomputeResponse>(result);
});

api.post('/admin/reset-practice', async (c) => {
  const body = await c.req.json() as { date: string };
  const result = await adminResetPracticeSessions(body.date);
  return c.json<AdminResetPracticeResponse>(result);
});

api.post('/admin/finalize', async (c) => {
  const body = await c.req.json() as { date: string };
  const result = await adminFinalizeRaceDay(body.date);
  return c.json<AdminFinalizeResponse>(result);
});
