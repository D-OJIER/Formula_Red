import { useEffect, useState } from 'react';

type FinishPanelProps = {
  playerName: string;
  totalTime: number;
  lapTimes: number[];
  onClose?: () => void;
};

export const FinishPanel = ({ playerName, totalTime, lapTimes, onClose }: FinishPanelProps) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setShowAnimation(true), 100);
  }, []);

  const bestLap = lapTimes.length > 0 ? Math.min(...lapTimes.filter(lt => lt > 0)) : null;
  const averageLap = lapTimes.length > 0 
    ? lapTimes.reduce((sum, lt) => sum + lt, 0) / lapTimes.length 
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div
        className={`f1-card p-8 max-w-md w-full mx-4 transform transition-all duration-500 ${
          showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="f1-card-header rounded-t-lg -m-8 mb-6 pb-4">
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl">🏁</span>
            <h2 className="text-2xl font-bold text-center">RACE FINISHED</h2>
            <span className="text-4xl">🏁</span>
          </div>
        </div>

        {/* Player Info */}
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 uppercase tracking-wide mb-2">Driver</div>
            <div className="text-3xl font-bold text-gray-900">{playerName}</div>
          </div>

          {/* Total Race Time */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-lg p-6 text-center">
            <div className="text-sm text-yellow-700 uppercase tracking-wide mb-2 font-semibold">
              Total Race Time
            </div>
            <div className="text-5xl font-bold text-yellow-900 font-mono">
              {totalTime.toFixed(3)}s
            </div>
          </div>

          {/* Lap Times Breakdown */}
          {lapTimes.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Lap Times
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {lapTimes.map((lapTime, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                  >
                    <span className="text-sm font-semibold text-gray-700">
                      Lap {index + 1}
                    </span>
                    <span className="text-sm font-mono font-bold text-gray-900">
                      {lapTime.toFixed(3)}s
                    </span>
                  </div>
                ))}
              </div>

              {/* Best and Average */}
              <div className="grid grid-cols-2 gap-3">
                {bestLap !== null && (
                  <div className="bg-green-50 border border-green-300 rounded-lg p-3 text-center">
                    <div className="text-xs text-green-700 uppercase tracking-wide mb-1 font-semibold">
                      Best Lap
                    </div>
                    <div className="text-lg font-bold text-green-900 font-mono">
                      {bestLap.toFixed(3)}s
                    </div>
                  </div>
                )}
                {averageLap !== null && (
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 text-center">
                    <div className="text-xs text-blue-700 uppercase tracking-wide mb-1 font-semibold">
                      Average Lap
                    </div>
                    <div className="text-lg font-bold text-blue-900 font-mono">
                      {averageLap.toFixed(3)}s
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="f1-button w-full py-3 text-lg font-bold"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
