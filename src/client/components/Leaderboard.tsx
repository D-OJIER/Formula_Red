import type { PracticeSession, RaceResult } from '../../shared/types';

type LeaderboardProps = {
  practiceSessions?: PracticeSession[];
  raceResults?: RaceResult[];
  type: 'practice' | 'race';
};

export const Leaderboard = ({
  practiceSessions,
  raceResults,
  type,
}: LeaderboardProps) => {
  if (type === 'practice') {
    const sessions = practiceSessions || [];
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Practice Leaderboard</h3>
        {sessions.length === 0 ? (
          <div className="text-gray-500 py-4">No results yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Pos</th>
                  <th className="text-left p-2">Driver</th>
                  <th className="text-right p-2">Lap Time</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session, index) => (
                  <tr key={session.userId} className="border-b">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">{session.submission.username}</td>
                    <td className="p-2 text-right">
                      {session.lapTime.toFixed(3)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (type === 'race') {
    const results = raceResults || [];
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Race Leaderboard</h3>
        {results.length === 0 ? (
          <div className="text-gray-500 py-4">No results yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Pos</th>
                  <th className="text-left p-2">Driver</th>
                  <th className="text-right p-2">Lap Time</th>
                  <th className="text-right p-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result.userId} className="border-b">
                    <td className="p-2">{result.position || '-'}</td>
                    <td className="p-2">{result.username}</td>
                    <td className="p-2 text-right">{result.lapTime.toFixed(3)}s</td>
                    <td className="p-2 text-right">{result.points || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return <div className="text-gray-500">No results yet</div>;
};
