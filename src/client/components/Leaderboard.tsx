import type { OfficialRaceResult, SeasonStanding, MonthlyStanding } from '../../shared/types';

type LeaderboardProps = {
  results: OfficialRaceResult[] | SeasonStanding[] | MonthlyStanding[];
  type: 'daily' | 'season' | 'monthly';
};

export const Leaderboard = ({ results, type }: LeaderboardProps) => {
  if (type === 'daily') {
    const dailyResults = results as OfficialRaceResult[];
    return (
      <div className="space-y-2">
        <div className="f1-card-header mb-4">
          <h3 className="text-lg font-bold">Daily Leaderboard</h3>
        </div>
        {dailyResults.length === 0 ? (
          <div className="text-gray-500 py-4">No results yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[#e10600]">
                  <th className="text-left p-3 font-bold text-gray-800 uppercase text-xs tracking-wide">Pos</th>
                  <th className="text-left p-3 font-bold text-gray-800 uppercase text-xs tracking-wide">Driver</th>
                  <th className="text-right p-3 font-bold text-gray-800 uppercase text-xs tracking-wide">Race Time</th>
                  <th className="text-right p-3 font-bold text-gray-800 uppercase text-xs tracking-wide">Points</th>
                </tr>
              </thead>
              <tbody>
                {dailyResults.map((result, index) => (
                  <tr key={result.userId} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className={`p-3 font-bold ${
                      index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      {result.position || index + 1}
                    </td>
                    <td className="p-3 font-semibold text-gray-800">{result.username}</td>
                    <td className="p-3 text-right font-mono text-gray-700">{result.lapTime.toFixed(3)}s</td>
                    <td className="p-3 text-right">
                      <span className="f1-badge">{result.points || 0}</span>
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

  if (type === 'monthly') {
    const monthlyStandings = results as MonthlyStanding[];
    return (
      <div className="space-y-2">
        <div className="f1-card-header mb-4 bg-gradient-to-r from-purple-600 to-purple-700">
          <h3 className="text-lg font-bold text-white">Monthly Leaderboard</h3>
        </div>
        {monthlyStandings.length === 0 ? (
          <div className="text-gray-500 py-4">No standings yet for this month</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-purple-500 bg-purple-50">
                  <th className="text-left p-3 font-bold text-purple-800 uppercase text-xs tracking-wide">Pos</th>
                  <th className="text-left p-3 font-bold text-purple-800 uppercase text-xs tracking-wide">Driver</th>
                  <th className="text-right p-3 font-bold text-purple-800 uppercase text-xs tracking-wide">Points</th>
                  <th className="text-right p-3 font-bold text-purple-800 uppercase text-xs tracking-wide">Races</th>
                  <th className="text-right p-3 font-bold text-purple-800 uppercase text-xs tracking-wide">Wins</th>
                  <th className="text-right p-3 font-bold text-purple-800 uppercase text-xs tracking-wide">Podiums</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStandings.map((standing, index) => (
                  <tr key={standing.userId} className={`border-b transition-colors ${
                    index === 0 ? 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200' :
                    index === 1 ? 'bg-gray-50 hover:bg-gray-100 border-gray-200' :
                    index === 2 ? 'bg-orange-50 hover:bg-orange-100 border-orange-200' :
                    'hover:bg-purple-50 border-purple-100'
                  }`}>
                    <td className={`p-3 font-bold ${
                      index === 0 ? 'text-yellow-700' : index === 1 ? 'text-gray-600' : index === 2 ? 'text-orange-700' : 'text-purple-700'
                    }`}>
                      {index + 1}
                    </td>
                    <td className="p-3 font-semibold text-gray-800 flex items-center gap-2">
                      {standing.avatarUrl && (
                        <img
                          src={standing.avatarUrl}
                          alt={standing.username}
                          className="w-6 h-6 rounded-full object-cover border border-purple-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                      {standing.username}
                    </td>
                    <td className="p-3 text-right">
                      <span className={`f1-badge ${
                        index === 0 ? 'bg-yellow-500 text-yellow-900' :
                        index === 1 ? 'bg-gray-400 text-gray-900' :
                        index === 2 ? 'bg-orange-500 text-orange-900' :
                        'bg-purple-500 text-white'
                      }`}>{standing.totalPoints}</span>
                    </td>
                    <td className={`p-3 text-right ${
                      index < 3 ? 'text-gray-800 font-semibold' : 'text-gray-700'
                    }`}>{standing.racesPlayed}</td>
                    <td className={`p-3 text-right ${
                      index < 3 ? 'text-gray-800 font-semibold' : 'text-gray-700'
                    }`}>{standing.wins || 0}</td>
                    <td className={`p-3 text-right ${
                      index < 3 ? 'text-gray-800 font-semibold' : 'text-gray-700'
                    }`}>{standing.podiumCount || 0}</td>
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
  const seasonStandings = results as SeasonStanding[];
  return (
    <div className="space-y-2">
      <div className="f1-card-header mb-4">
        <h3 className="text-lg font-bold">Season Leaderboard</h3>
      </div>
      {seasonStandings.length === 0 ? (
        <div className="text-gray-500 py-4">No standings yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-[#e10600]">
                <th className="text-left p-3 font-bold text-gray-800 uppercase text-xs tracking-wide">Pos</th>
                <th className="text-left p-3 font-bold text-gray-800 uppercase text-xs tracking-wide">Driver</th>
                <th className="text-right p-3 font-bold text-gray-800 uppercase text-xs tracking-wide">Points</th>
                <th className="text-right p-3 font-bold text-gray-800 uppercase text-xs tracking-wide">Races</th>
                <th className="text-right p-3 font-bold text-gray-800 uppercase text-xs tracking-wide">Wins</th>
                <th className="text-right p-3 font-bold text-gray-800 uppercase text-xs tracking-wide">Podiums</th>
              </tr>
            </thead>
            <tbody>
              {seasonStandings.map((standing, index) => (
                <tr key={standing.userId} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className={`p-3 font-bold ${
                    index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-gray-600'
                  }`}>
                    {index + 1}
                  </td>
                  <td className="p-3 font-semibold text-gray-800">{standing.username}</td>
                  <td className="p-3 text-right">
                    <span className="f1-badge">{standing.totalPoints}</span>
                  </td>
                  <td className="p-3 text-right text-gray-700">{standing.racesPlayed}</td>
                  <td className="p-3 text-right text-gray-700">{standing.wins || 0}</td>
                  <td className="p-3 text-right text-gray-700">{standing.podiumCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
