import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useFormulaRed } from './hooks/useFormulaRed';
import { SubmissionForm } from './components/SubmissionForm';
import { Leaderboard } from './components/Leaderboard';
import { Podium } from './components/Podium';

const App = () => {
  const {
    username,
    currentSession,
    date,
    raceDay,
    practiceSessions,
    raceResults,
    seasonStandings,
    podium,
    loading,
    submitPractice,
    submitRace,
  } = useFormulaRed();

  const isPractice = currentSession === 'P1' || currentSession === 'P2' || currentSession === 'P3' || currentSession === 'P4';
  const isRace = currentSession === 'RACE';
  const canSubmit = isPractice || isRace;
  const raceFrozen = raceDay?.frozen || false;

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
            🏎️ Formula Red
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Welcome, {username || 'Driver'}!</span>
            <span>•</span>
            <span>Date: {date}</span>
            <span>•</span>
            <span className={`font-semibold ${
              currentSession === 'RACE' ? 'text-red-600' :
              isPractice ? 'text-blue-600' :
              'text-gray-400'
            }`}>
              Session: {currentSession}
            </span>
          </div>
        </div>

        {/* Track Info */}
        {raceDay && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Track Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Length</div>
                <div className="text-lg font-semibold">{raceDay.trackConfig.length}m</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Corners</div>
                <div className="text-lg font-semibold">{raceDay.trackConfig.corners}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Surface</div>
                <div className="text-lg font-semibold capitalize">{raceDay.trackConfig.surface}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Modifier</div>
                <div className="text-lg font-semibold">{raceDay.modifier}</div>
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

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Submission Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              {isPractice ? 'Practice Submission' : isRace ? 'Race Submission' : 'Session Closed'}
            </h2>
            {canSubmit && !raceFrozen ? (
              <SubmissionForm
                onSubmit={isRace ? submitRace : submitPractice}
                disabled={raceFrozen}
                sessionType={currentSession}
              />
            ) : (
              <div className="text-gray-500">
                {raceFrozen ? 'Race is frozen. Submissions are closed.' : 'No active session. Check back during practice or race times.'}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-lg shadow p-6">
            {isPractice ? (
              <Leaderboard
                practiceSessions={practiceSessions}
                type="practice"
              />
            ) : (
              <Leaderboard raceResults={raceResults} type="race" />
            )}
          </div>
        </div>

        {/* Season Standings */}
        {seasonStandings.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Season Standings</h2>
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
                  {seasonStandings
                    .sort((a, b) => b.totalPoints - a.totalPoints)
                    .map((standing, index) => (
                      <tr key={standing.userId} className="border-b">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">{standing.username}</td>
                        <td className="p-2 text-right font-semibold">
                          {standing.totalPoints}
                        </td>
                        <td className="p-2 text-right">{standing.racesPlayed}</td>
                        <td className="p-2 text-right">{standing.wins}</td>
                        <td className="p-2 text-right">{standing.podiumCount}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
