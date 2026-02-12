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

  const handleLapComplete = async (
    lapTime: number,
    checkpointTimes: number[],
    replayHash: string
  ) => {
    if (mode === 'official' && !hasSubmitted && !raceFrozen) {
      try {
        await submitOfficialRun(lapTime, checkpointTimes, replayHash, carConfig);
      } catch (error) {
        console.error('Failed to submit official run:', error);
        alert(error instanceof Error ? error.message : 'Submission failed');
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Track Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Length</div>
                <div className="text-lg font-semibold">{trackConfig.length}m</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Corner Density</div>
                <div className="text-lg font-semibold">{trackConfig.cornerDensity}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Surface Grip</div>
                <div className="text-lg font-semibold">{trackConfig.surfaceGrip}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Width</div>
                <div className="text-lg font-semibold">{trackConfig.width}m</div>
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Select Mode</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setMode('practice')}
              className={`px-6 py-3 rounded font-semibold ${
                mode === 'practice'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Practice Mode
            </button>
            <button
              onClick={() => setMode('official')}
              disabled={hasSubmitted || raceFrozen}
              className={`px-6 py-3 rounded font-semibold ${
                mode === 'official'
                  ? 'bg-[#d93900] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Official Race
              {hasSubmitted && ' (Submitted)'}
            </button>
          </div>
          {hasSubmitted && (
            <p className="text-sm text-gray-600 mt-2">
              You have already submitted your official run for today.
            </p>
          )}
          {raceFrozen && (
            <p className="text-sm text-gray-600 mt-2">
              Race is frozen. Official submissions are closed.
            </p>
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
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {mode === 'practice' ? '🏎️ Practice Driving' : '🏁 Official Race'}
                </h2>
                <DrivingSimulator
                  carConfig={carConfig}
                  trackConfig={trackConfig}
                  mode={mode}
                  onLapComplete={handleLapComplete}
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
