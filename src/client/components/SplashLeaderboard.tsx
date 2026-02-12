import type { OfficialRaceResult, SeasonStanding } from '../../shared/types';

type SplashLeaderboardProps = {
  dailyResults: OfficialRaceResult[];
  seasonStandings: SeasonStanding[];
  showDaily?: boolean;
  showSeason?: boolean;
  maxItems?: number;
};

export const SplashLeaderboard = ({
  dailyResults,
  seasonStandings,
  showDaily = true,
  showSeason = true,
  maxItems = 5,
}: SplashLeaderboardProps) => {
  const topDaily = dailyResults.slice(0, maxItems);
  const topSeason = seasonStandings.slice(0, maxItems);

  return (
    <div className="w-full max-w-2xl space-y-4">
      {showDaily && (
        <div className="f1-card bg-white/95 backdrop-blur-sm p-4">
          <div className="f1-card-header rounded-t-lg -m-4 mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              🏁 Daily Leaderboard
            </h3>
          </div>
          {topDaily.length === 0 ? (
            <div className="text-gray-500 text-sm py-2">No results yet</div>
          ) : (
            <div className="space-y-1">
              {topDaily.map((result, index) => (
                <div
                  key={result.userId}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold w-8 text-center text-lg ${
                        index === 0
                          ? 'text-yellow-600'
                          : index === 1
                            ? 'text-gray-400'
                            : index === 2
                              ? 'text-orange-600'
                              : 'text-gray-600'
                      }`}
                    >
                      {result.position || index + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {result.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600 font-medium">{result.lapTime.toFixed(2)}s</span>
                    <span className="f1-badge w-10 text-center">
                      {result.points || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showSeason && seasonStandings.length > 0 && (
        <div className="f1-card bg-white/95 backdrop-blur-sm p-4">
          <div className="f1-card-header rounded-t-lg -m-4 mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              🏆 Season Leaderboard
            </h3>
          </div>
          <div className="space-y-1">
            {topSeason.map((standing, index) => (
              <div
                key={standing.userId}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-bold w-8 text-center text-lg ${
                      index === 0
                        ? 'text-yellow-600'
                        : index === 1
                          ? 'text-gray-400'
                          : index === 2
                            ? 'text-orange-600'
                            : 'text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-gray-800">
                    {standing.username}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 font-medium">{standing.racesPlayed} races</span>
                  <span className="f1-badge w-16 text-center">
                    {standing.totalPoints} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
