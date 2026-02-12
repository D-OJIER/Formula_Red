import type { OfficialRaceResult } from '../../shared/types';

type LeaderboardProps = {
  results: OfficialRaceResult[];
  type: 'daily' | 'season';
};

export const Leaderboard = ({ results, type }: LeaderboardProps) => {
  if (type === 'daily') {
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Daily Leaderboard</h3>
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

  // Season leaderboard
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Season Leaderboard</h3>
      {results.length === 0 ? (
        <div className="text-gray-500 py-4">No standings yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Pos</th>
                <th className="text-left p-2">Driver</th>
                <th className="text-right p-2">Points</th>
                <th className="text-right p-2">Races</th>
                <th className="text-right p-2">Wins</th>
                <th className="text-right p-2">Podiums</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={result.userId} className="border-b">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{result.username}</td>
                  <td className="p-2 text-right font-semibold">
                    {(result as any).totalPoints || 0}
                  </td>
                  <td className="p-2 text-right">{(result as any).racesPlayed || 0}</td>
                  <td className="p-2 text-right">{(result as any).wins || 0}</td>
                  <td className="p-2 text-right">{(result as any).podiumCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
