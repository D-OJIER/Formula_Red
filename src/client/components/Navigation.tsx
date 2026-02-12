import type { ReactNode } from 'react';

type NavigationProps = {
  activeTab: 'race' | 'monthly' | 'profile';
  onTabChange: (tab: 'race' | 'monthly' | 'profile') => void;
  children: ReactNode;
};

export const Navigation = ({ activeTab, onTabChange, children }: NavigationProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation Bar */}
      <nav className="f1-card p-4 mb-6 border-b-2 border-[#e10600]">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => onTabChange('race')}
            className={`px-6 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
              activeTab === 'race'
                ? 'f1-button text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-gray-600'
            }`}
          >
            🏁 Race
          </button>
          <button
            onClick={() => onTabChange('monthly')}
            className={`px-6 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
              activeTab === 'monthly'
                ? 'f1-button text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-gray-600'
            }`}
          >
            📅 Monthly Leaderboard
          </button>
          <button
            onClick={() => onTabChange('profile')}
            className={`px-6 py-3 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
              activeTab === 'profile'
                ? 'f1-button text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-2 border-gray-600'
            }`}
          >
            👤 Profile
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 pb-8">
        {children}
      </div>
    </div>
  );
};
