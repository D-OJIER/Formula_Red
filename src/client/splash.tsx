import './index.css';

import { navigateTo } from '@devvit/web/client';
import { context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useSplashData } from './hooks/useSplashData';
import { SplashLeaderboard } from './components/SplashLeaderboard';

export const Splash = () => {
  const { dailyResults, seasonStandings, loading } = useSplashData();

  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="flex flex-col items-center gap-4 max-w-4xl w-full">
        <h1 className="text-5xl font-bold text-center bg-gradient-to-r from-[#e10600] to-[#b83000] bg-clip-text text-transparent flex items-center justify-center gap-3">
          <span className="text-6xl">🏎️</span>
          <span>FORMULA RED</span>
        </h1>
        <p className="text-base text-center text-gray-300 max-w-md font-medium">
          Drive your Formula Red car! Practice unlimited laps, then submit your
          official race time. Compete daily and climb the season leaderboard.
        </p>

        {/* Leaderboards */}
        {!loading && (
          <div className="w-full mt-4">
            <SplashLeaderboard
              dailyResults={dailyResults}
              seasonStandings={seasonStandings}
              maxItems={5}
            />
          </div>
        )}

        {loading && (
          <div className="text-gray-400 text-sm py-4 font-medium">Loading leaderboards...</div>
        )}

        <div className="flex items-center justify-center mt-5">
          <button
            className="f1-button flex items-center justify-center h-14 rounded-full cursor-pointer px-10 text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
          >
            🏁 START RACING
          </button>
        </div>
      </div>
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 text-[0.8em] text-gray-400">
        <button
          className="cursor-pointer hover:text-gray-200 transition-colors"
          onClick={() => navigateTo('https://developers.reddit.com/docs')}
        >
          Docs
        </button>
        <span className="text-gray-500">|</span>
        <button
          className="cursor-pointer hover:text-gray-200 transition-colors"
          onClick={() => navigateTo('https://www.reddit.com/r/Devvit')}
        >
          r/Devvit
        </button>
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
