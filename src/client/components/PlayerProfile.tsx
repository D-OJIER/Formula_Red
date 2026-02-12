import type { PlayerProfile } from '../../shared/types';
import { getRedditAvatarUrl } from '../../shared/utils/avatar';

type PlayerProfileProps = {
  profile: PlayerProfile | null;
  loading?: boolean;
};

export const PlayerProfileComponent = ({ profile, loading }: PlayerProfileProps) => {
  if (loading) {
    return (
      <div className="f1-card p-8 text-center">
        <div className="text-gray-400">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="f1-card p-8 text-center">
        <div className="text-gray-400 text-lg">No profile data available.</div>
        <div className="text-gray-500 text-sm mt-2">Complete an official race to create your profile!</div>
      </div>
    );
  }

  const winRate = profile.racesParticipated > 0 
    ? ((profile.racesWon / profile.racesParticipated) * 100).toFixed(1)
    : '0.0';

  const podiumRate = profile.racesParticipated > 0
    ? ((profile.podiumCount / profile.racesParticipated) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="f1-card p-6">
        <div className="f1-card-header mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <img
              src={profile.avatarUrl || getRedditAvatarUrl(profile.userId)}
              alt={profile.username}
              className="w-12 h-12 rounded-full border-2 border-[#e10600] object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <span>{profile.username}</span>
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="f1-stat-box border-blue-400">
            <div className="f1-stat-label text-blue-600">Races Participated</div>
            <div className="f1-stat-value text-blue-900">{profile.racesParticipated}</div>
          </div>
          <div className="f1-stat-box border-yellow-400">
            <div className="f1-stat-label text-yellow-600">Races Won</div>
            <div className="f1-stat-value text-yellow-900">{profile.racesWon}</div>
          </div>
          <div className="f1-stat-box border-green-400">
            <div className="f1-stat-label text-green-600">Total Points</div>
            <div className="f1-stat-value text-green-900">{profile.totalPoints}</div>
          </div>
          <div className="f1-stat-box border-purple-400">
            <div className="f1-stat-label text-purple-600">Best Position</div>
            <div className="f1-stat-value text-purple-900">
              {profile.bestPosition === Infinity ? '-' : `#${profile.bestPosition}`}
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="f1-stat-box border-red-400">
            <div className="f1-stat-label text-red-600">Win Rate</div>
            <div className="f1-stat-value text-red-900">{winRate}%</div>
          </div>
          <div className="f1-stat-box border-orange-400">
            <div className="f1-stat-label text-orange-600">Podium Rate</div>
            <div className="f1-stat-value text-orange-900">{podiumRate}%</div>
          </div>
        </div>
      </div>

      {/* Recent Races */}
      {profile.recentRaces.length > 0 && (
        <div className="f1-card p-6">
          <div className="f1-card-header mb-4">
            <h3 className="text-xl font-bold">Recent Races</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2 px-4 text-gray-700 font-semibold">Date</th>
                  <th className="text-left py-2 px-4 text-gray-700 font-semibold">Position</th>
                  <th className="text-left py-2 px-4 text-gray-700 font-semibold">Lap Time</th>
                  <th className="text-left py-2 px-4 text-gray-700 font-semibold">Points</th>
                </tr>
              </thead>
              <tbody>
                {profile.recentRaces.map((race, index) => {
                  const date = new Date(race.timestamp);
                  const dateStr = date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  });
                  return (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-4 text-gray-700">{dateStr}</td>
                      <td className="py-2 px-4">
                        <span className={`f1-badge ${
                          race.position === 1 ? 'bg-yellow-500' :
                          race.position === 2 ? 'bg-gray-400' :
                          race.position === 3 ? 'bg-orange-500' :
                          'bg-gray-300'
                        }`}>
                          #{race.position}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-gray-700 font-mono">{race.lapTime.toFixed(3)}s</td>
                      <td className="py-2 px-4 text-gray-700 font-semibold">+{race.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
