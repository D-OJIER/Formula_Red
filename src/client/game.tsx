import './index.css';

import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useFormulaRed } from './hooks/useFormulaRed';
import { CarConfigForm } from './components/CarConfigForm';
import { Leaderboard } from './components/Leaderboard';
import { Podium } from './components/Podium';
import { DrivingSimulator } from './components/DrivingSimulator';
import type { CarConfig } from '../shared/types';

const App = () => {
  const {
    username,
    trackId,
    trackConfig,
    race,
    dailyResults,
    seasonStandings,
    podium,
    loading,
    hasSubmitted,
    playerResult,
    submitOfficialRun,
  } = useFormulaRed();

  const [carConfig, setCarConfig] = useState<CarConfig>({
    downforce: 50,
    gearBias: 50,
    tyres: 'medium',
    drivingStyle: 50,
    tacticalAbility: 50,
  });

  const [mode, setMode] = useState<'practice' | 'official'>('practice');
  const raceFrozen = race?.frozen || false;
  const lapsRequired = race?.lapsRequired || 3;

  const handleRaceComplete = async (
    totalTime: number,
    lapTimes: number[],
    checkpointTimes: number[],
    replayHash: string
  ) => {
    if (mode === 'official' && !hasSubmitted && !raceFrozen) {
      try {
        // Validate total time
        if (!totalTime || totalTime <= 0 || totalTime > 3600 || isNaN(totalTime)) {
          throw new Error(`Invalid total race time: ${totalTime}s. Please complete the race properly.`);
        }
        
        console.log('Race complete:', {
          totalTime,
          lapTimes,
          checkpointTimes,
        });
        
        // Ensure checkpointTimes is valid - if empty, create default checkpoints
        let validCheckpointTimes = checkpointTimes;
        if (!validCheckpointTimes || validCheckpointTimes.length === 0) {
          // Create checkpoints at 25%, 50%, 75% of total time
          validCheckpointTimes = [
            totalTime * 0.25,
            totalTime * 0.5,
            totalTime * 0.75,
            totalTime
          ];
        }
        
        // Ensure checkpointTimes are in ascending order and don't exceed total time
        validCheckpointTimes = validCheckpointTimes
          .filter((t) => t > 0 && t <= totalTime && !isNaN(t))
          .sort((a, b) => a - b);
        
        // If still empty, add at least one checkpoint
        if (validCheckpointTimes.length === 0) {
          validCheckpointTimes = [totalTime];
        }
        
        // Submit total race completion time instead of best lap time
        await submitOfficialRun(totalTime, validCheckpointTimes, replayHash, carConfig);
        
        // Use showToast instead of alert for Devvit
        const { showToast } = await import('@devvit/web/client');
        const bestLap = lapTimes.length > 0 ? Math.min(...lapTimes.filter(lt => lt > 0)) : totalTime / lapsRequired;
        showToast(`Race Complete! Total Time: ${totalTime.toFixed(2)}s (Best Lap: ${bestLap.toFixed(2)}s)`);
      } catch (error) {
        console.error('Failed to submit official run:', error);
        const errorMessage = error instanceof Error ? error.message : 'Submission failed';
        console.error('Submission error details:', { 
          totalTime,
          lapTimes, 
          checkpointTimes, 
          errorMessage 
        });
        
        // Use showToast instead of alert
        const { showToast } = await import('@devvit/web/client');
        showToast(`Error: ${errorMessage}`, { appearance: 'error' });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading Formula Red...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-[#d93900] mb-2">
            🏎️ Formula Red - Driver Edition
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Welcome, {username || 'Driver'}!</span>
            <span>•</span>
            <span>Track ID: {trackId}</span>
            <span>•</span>
            <span className={`font-semibold ${
              raceFrozen ? 'text-gray-400' : 'text-green-600'
            }`}>
              {raceFrozen ? 'Race Frozen' : 'Race Active'}
            </span>
          </div>
        </div>

        {/* Track Info */}
        {trackConfig && (
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <span>🏁</span> Track Information
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-600 font-semibold uppercase mb-1">Length</div>
                <div className="text-xl font-bold text-blue-900">{trackConfig.length}m</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-xs text-purple-600 font-semibold uppercase mb-1">Corner Density</div>
                <div className="text-xl font-bold text-purple-900">{trackConfig.cornerDensity}%</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-xs text-green-600 font-semibold uppercase mb-1">Surface Grip</div>
                <div className="text-xl font-bold text-green-900">{trackConfig.surfaceGrip}%</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="text-xs text-orange-600 font-semibold uppercase mb-1">Width</div>
                <div className="text-xl font-bold text-orange-900">{trackConfig.width}m</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-xs text-red-600 font-semibold uppercase mb-1">Laps Required</div>
                <div className="text-xl font-bold text-red-900">{lapsRequired}</div>
              </div>
            </div>
          </div>
        )}

        {/* Podium */}
        {podium.p1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <Podium podium={podium} />
          </div>
        )}

        {/* Player Result */}
        {playerResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">
              Your Official Result
            </h2>
            <div className="space-y-2">
              <div className="text-lg">
                <span className="font-semibold">Rank:</span> {playerResult.rank}
              </div>
              <div className="text-lg">
                <span className="font-semibold">Lap Time:</span> {playerResult.lapTime.toFixed(3)}s
              </div>
            </div>
          </div>
        )}

        {/* Mode Selection */}
        <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg shadow-lg p-6 border-2 border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Select Mode</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setMode('practice')}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
                mode === 'practice'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🏎️ Practice Mode
            </button>
            <button
              onClick={() => setMode('official')}
              disabled={hasSubmitted || raceFrozen}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
                mode === 'official'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              🏁 Official Race ({lapsRequired} Laps)
              {hasSubmitted && ' ✓'}
            </button>
          </div>
          {hasSubmitted && (
            <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-sm text-green-800 font-semibold">
                ✓ You have already submitted your official run for today.
              </p>
            </div>
          )}
          {raceFrozen && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-sm text-red-800 font-semibold">
                ⚠ Race is frozen. Official submissions are closed.
              </p>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Car Config & Driving Simulator */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <CarConfigForm
                onConfigChange={setCarConfig}
                disabled={raceFrozen}
              />
            </div>

            {trackConfig && (
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl p-6 border-2 border-gray-700">
                <h2 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
                  {mode === 'practice' ? '🏎️ Practice Driving' : '🏁 Official Race'}
                  {mode === 'official' && (
                    <span className="text-sm bg-red-600 text-white px-3 py-1 rounded-full">
                      {lapsRequired} Laps Required
                    </span>
                  )}
                </h2>
                <DrivingSimulator
                  carConfig={carConfig}
                  trackConfig={trackConfig}
                  mode={mode}
                  lapsRequired={lapsRequired}
                  onRaceComplete={handleRaceComplete}
                  disabled={raceFrozen || (mode === 'official' && hasSubmitted)}
                />
              </div>
            )}
          </div>

          {/* Leaderboards */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <Leaderboard results={dailyResults} type="daily" />
            </div>

            {seasonStandings.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <Leaderboard results={seasonStandings} type="season" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
