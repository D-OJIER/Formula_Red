import type { PodiumResult } from '../../shared/types';

type PodiumProps = {
  podium: PodiumResult;
};

export const Podium = ({ podium }: PodiumProps) => {
  if (!podium.p1 && !podium.p2 && !podium.p3) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center">🏆 Podium 🏆</h3>
      <div className="flex items-end justify-center gap-4">
        {podium.p2 && (
          <div className="flex flex-col items-center">
            <div className="bg-gray-300 text-gray-800 p-4 rounded-t-lg w-24 h-20 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl">🥈</div>
                <div className="text-sm font-semibold">{podium.p2.username}</div>
                <div className="text-xs">{podium.p2.lapTime.toFixed(3)}s</div>
              </div>
            </div>
            <div className="text-sm font-semibold mt-2">2nd</div>
          </div>
        )}

        {podium.p1 && (
          <div className="flex flex-col items-center">
            <div className="bg-yellow-400 text-yellow-900 p-4 rounded-t-lg w-28 h-28 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl">🥇</div>
                <div className="text-sm font-semibold">{podium.p1.username}</div>
                <div className="text-xs">{podium.p1.lapTime.toFixed(3)}s</div>
              </div>
            </div>
            <div className="text-sm font-semibold mt-2">1st</div>
          </div>
        )}

        {podium.p3 && (
          <div className="flex flex-col items-center">
            <div className="bg-orange-300 text-orange-900 p-4 rounded-t-lg w-24 h-16 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl">🥉</div>
                <div className="text-sm font-semibold">{podium.p3.username}</div>
                <div className="text-xs">{podium.p3.lapTime.toFixed(3)}s</div>
              </div>
            </div>
            <div className="text-sm font-semibold mt-2">3rd</div>
          </div>
        )}
      </div>
    </div>
  );
};
