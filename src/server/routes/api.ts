import { Hono } from 'hono';
import { context, reddit } from '@devvit/web/server';
import type {
  InitResponse,
  SubmitOfficialRunResponse,
  GetDailyRaceResponse,
  GetDailyLeaderboardResponse,
  GetSeasonLeaderboardResponse,
  GetPodiumResponse,
} from '../../shared/api';
import { handleOfficialSubmission } from '../handlers/submissionHandler';
import { getDailyRace } from '../storage/dailyRaceStorage';
import { getAllOfficialResults } from '../storage/dailyRaceStorage';
import { getSeasonStandings } from '../storage/seasonStorage';
import { getDateString } from '../utils/sessionTime';
import { getDailyLeaderboard } from '../utils/leaderboard';
import { getPodiumFromResults } from '../utils/finalization';
import type { SubmissionPayload } from '../../shared/types';
import { generateDailyTrack } from '../utils/trackGenerator';

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
    const trackId = getDateString();
    
    // Get or create race
    let race = await getDailyRace(trackId);
    let trackConfig = null;
    
    if (race) {
      trackConfig = race.trackConfig;
    } else {
      // Generate track config for today
      trackConfig = generateDailyTrack(trackId);
    }

    return c.json<InitResponse>({
      type: 'init',
      postId: postId,
      username: username ?? 'anonymous',
      trackId,
      trackConfig,
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

// Submit official run
api.post('/submit-official-run', async (c) => {
  try {
    const username = await reddit.getCurrentUsername();
    const userId = context.userId || username || 'anonymous';
    const trackId = getDateString();

    const body = await c.req.json() as Omit<SubmissionPayload, 'userId' | 'username' | 'trackId'> & {
      lapTime: number;
      config: SubmissionPayload['config'];
      checkpointTimes: number[];
      replayHash: string;
    };

    const payload: SubmissionPayload = {
      userId,
      username: username || 'anonymous',
      trackId,
      lapTime: body.lapTime,
      config: body.config,
      checkpointTimes: body.checkpointTimes,
      replayHash: body.replayHash,
    };

    const result = await handleOfficialSubmission(payload);
    return c.json<SubmitOfficialRunResponse>(result);
  } catch (error) {
    return c.json<SubmitOfficialRunResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      400
    );
  }
});

// Get daily race info
api.get('/race/daily', async (c) => {
  const trackId = c.req.query('trackId') || getDateString();
  const race = await getDailyRace(trackId);
  return c.json<GetDailyRaceResponse>({ race });
});

// Get daily leaderboard
api.get('/leaderboard/daily', async (c) => {
  const trackId = c.req.query('trackId') || getDateString();
  const allResults = await getAllOfficialResults(trackId);
  const results = getDailyLeaderboard(allResults);
  return c.json<GetDailyLeaderboardResponse>({ results });
});

// Get season leaderboard
api.get('/leaderboard/season', async (c) => {
  const standings = await getSeasonStandings();
  // Sort by totalPoints descending, then podiumCount descending
  const sorted = standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return b.podiumCount - a.podiumCount;
  });
  return c.json<GetSeasonLeaderboardResponse>({ standings: sorted });
});

// Get podium for a race
api.get('/race/podium', async (c) => {
  const trackId = c.req.query('trackId') || getDateString();
  const allResults = await getAllOfficialResults(trackId);
  const podium = getPodiumFromResults(allResults);
  return c.json<GetPodiumResponse>({ podium });
});
