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
        className={`f1-card p-6 max-w-sm w-full mx-4 transform transition-all duration-500 ${
          showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="f1-card-header mb-4 pb-3" style={{ marginTop: '-1.5rem', marginLeft: '-1.5rem', marginRight: '-1.5rem' }}>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🏁</span>
            <h2 className="text-xl font-bold text-center">RACE FINISHED</h2>
            <span className="text-2xl">🏁</span>
          </div>
        </div>

        {/* Compact Container */}
        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 space-y-4">
          {/* Player Info */}
          <div className="text-center">
            <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Driver</div>
            <div className="text-xl font-bold text-gray-900 truncate">{playerName}</div>
          </div>

          {/* Total Race Time */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-lg p-4 text-center">
            <div className="text-xs text-yellow-700 uppercase tracking-wide mb-1 font-semibold">
              Total Race Time
            </div>
            <div className="text-3xl font-bold text-yellow-900 font-mono">
              {totalTime.toFixed(3)}s
            </div>
          </div>

          {/* Lap Times Breakdown */}
          {lapTimes.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Lap Times
              </div>
              <div className="bg-white rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto">
                {lapTimes.map((lapTime, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-1.5 bg-gray-50 rounded border border-gray-200"
                  >
                    <span className="text-xs font-semibold text-gray-700">
                      Lap {index + 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-900">
                      {lapTime.toFixed(3)}s
                    </span>
                  </div>
                ))}
              </div>

              {/* Best and Average */}
              <div className="grid grid-cols-2 gap-2">
                {bestLap !== null && (
                  <div className="bg-green-50 border border-green-300 rounded-lg p-2 text-center">
                    <div className="text-xs text-green-700 uppercase tracking-wide mb-1 font-semibold">
                      Best Lap
                    </div>
                    <div className="text-sm font-bold text-green-900 font-mono">
                      {bestLap.toFixed(3)}s
                    </div>
                  </div>
                )}
                {averageLap !== null && (
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-2 text-center">
                    <div className="text-xs text-blue-700 uppercase tracking-wide mb-1 font-semibold">
                      Average Lap
                    </div>
                    <div className="text-sm font-bold text-blue-900 font-mono">
                      {averageLap.toFixed(3)}s
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="f1-button w-full py-2 text-base font-bold mt-4"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};
