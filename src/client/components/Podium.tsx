import type { PodiumResult } from '../../shared/types';
import { getRedditAvatarUrl } from '../../shared/utils/avatar';

type PodiumProps = {
  podium: PodiumResult;
};

export const Podium = ({ podium }: PodiumProps) => {
  if (!podium.p1 && !podium.p2 && !podium.p3) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="f1-card-header rounded-t-lg -m-6 mb-4">
        <h3 className="text-xl font-bold text-center">🏆 Podium 🏆</h3>
      </div>
      <div className="flex items-end justify-center gap-4">
        {podium.p2 && (
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-gray-300 to-gray-400 text-gray-900 p-4 rounded-t-lg w-28 h-24 flex flex-col items-center justify-center border-2 border-gray-500 shadow-lg">
              <img
                src={podium.p2.avatarUrl || getRedditAvatarUrl(podium.p2.userId)}
                alt={podium.p2.username}
                className="w-12 h-12 rounded-full border-2 border-gray-600 mb-2 object-cover"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    const emoji = document.createElement('div');
                    emoji.className = 'text-2xl mb-2';
                    emoji.textContent = '🥈';
                    target.parentElement.insertBefore(emoji, target);
                  }
                }}
              />
              <div className="text-center">
                <div className="text-sm font-bold">{podium.p2.username}</div>
                <div className="text-xs font-mono">{podium.p2.lapTime.toFixed(3)}s</div>
              </div>
            </div>
            <div className="text-sm font-bold mt-2 text-gray-700">2nd</div>
          </div>
        )}

        {podium.p1 && (
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-yellow-900 p-5 rounded-t-lg w-32 h-32 flex flex-col items-center justify-center border-4 border-yellow-600 shadow-xl transform scale-105">
              <img
                src={podium.p1.avatarUrl || getRedditAvatarUrl(podium.p1.userId)}
                alt={podium.p1.username}
                className="w-16 h-16 rounded-full border-4 border-yellow-700 mb-2 object-cover shadow-md"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    const emoji = document.createElement('div');
                    emoji.className = 'text-3xl mb-2';
                    emoji.textContent = '🥇';
                    target.parentElement.insertBefore(emoji, target);
                  }
                }}
              />
              <div className="text-center">
                <div className="text-base font-bold">{podium.p1.username}</div>
                <div className="text-xs font-mono">{podium.p1.lapTime.toFixed(3)}s</div>
              </div>
            </div>
            <div className="text-base font-bold mt-2 text-yellow-700">1st</div>
          </div>
        )}

        {podium.p3 && (
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-orange-300 to-orange-400 text-orange-900 p-4 rounded-t-lg w-28 h-20 flex flex-col items-center justify-center border-2 border-orange-500 shadow-lg">
              <img
                src={podium.p3.avatarUrl || getRedditAvatarUrl(podium.p3.userId)}
                alt={podium.p3.username}
                className="w-10 h-10 rounded-full border-2 border-orange-600 mb-2 object-cover"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    const emoji = document.createElement('div');
                    emoji.className = 'text-xl mb-2';
                    emoji.textContent = '🥉';
                    target.parentElement.insertBefore(emoji, target);
                  }
                }}
              />
              <div className="text-center">
                <div className="text-sm font-bold">{podium.p3.username}</div>
                <div className="text-xs font-mono">{podium.p3.lapTime.toFixed(3)}s</div>
              </div>
            </div>
            <div className="text-sm font-bold mt-2 text-orange-700">3rd</div>
          </div>
        )}
      </div>
    </div>
  );
};
