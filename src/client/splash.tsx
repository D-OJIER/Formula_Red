import './index.css';

import { navigateTo } from '@devvit/web/client';
import { context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export const Splash = () => {
  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-4 bg-gradient-to-b from-red-50 to-white">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold text-center text-[#d93900]">
          🏎️ Formula Red
        </h1>
        <p className="text-base text-center text-gray-600 max-w-md">
          Compete in daily Formula Red races! Submit your car setup and strategy
          during practice sessions, then race for the podium.
        </p>
      </div>
      <div className="flex items-center justify-center mt-5">
        <button
          className="flex items-center justify-center bg-[#d93900] text-white h-12 rounded-full cursor-pointer transition-colors px-8 font-semibold hover:bg-[#b83000]"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          Start Racing
        </button>
      </div>
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 text-[0.8em] text-gray-600">
        <button
          className="cursor-pointer hover:text-gray-900"
          onClick={() => navigateTo('https://developers.reddit.com/docs')}
        >
          Docs
        </button>
        <span className="text-gray-300">|</span>
        <button
          className="cursor-pointer hover:text-gray-900"
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
