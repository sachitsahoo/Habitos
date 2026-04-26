import { useState, createContext, useContext } from 'react';
import { WeeklyView } from './components/WeeklyView';
import { MonthlyView } from './components/MonthlyView';
import { AnalyticsView } from './components/AnalyticsView';
import { HabitsView } from './components/HabitsView';
import { Moon, Sun } from 'lucide-react';

type Tab = 'weekly' | 'monthly' | 'analytics' | 'habits';

const DarkModeContext = createContext({ isDark: false, toggleDark: () => {} });

export const useDarkMode = () => useContext(DarkModeContext);

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('weekly');
  const [isDark, setIsDark] = useState(false);

  const toggleDark = () => setIsDark(!isDark);

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDark }}>
      <div className={`size-full flex flex-col transition-colors ${
        isDark ? 'bg-[#1A2332]' : 'bg-[#F8F7F4]'
      }`}>
        {/* Sticky Header */}
        <header className={`sticky top-0 z-50 border-b transition-colors ${
          isDark
            ? 'bg-[#243347] border-[#3A4A5E]'
            : 'bg-white border-[#D4D2CA]'
        }`}>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                isDark
                  ? 'bg-[#7AA897]'
                  : 'bg-[#6B9B8C]'
              }`}>
                <span className="text-white font-semibold text-lg">H</span>
              </div>
              <span className={`font-semibold text-xl ${
                isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'
              }`}>
                HabitOS
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={toggleDark}
                className={`p-2 rounded-lg transition-colors ${
                  isDark
                    ? 'bg-[#2D3E54] hover:bg-[#3A4A5E] text-[#E8E6E0]'
                    : 'bg-[#E8E6E0] hover:bg-[#D4D2CA] text-[#2D2D2D]'
                }`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className={`px-4 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-[#2D3E54] hover:bg-[#3A4A5E] text-[#E8E6E0]'
                  : 'bg-[#E8E6E0] hover:bg-[#D4D2CA] text-[#2D2D2D]'
              }`}>
                Export
              </button>
              <button className={`px-4 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-[#7AA897] hover:bg-[#669989] text-[#1A2332]'
                  : 'bg-[#6B9B8C] hover:bg-[#5A8B7D] text-white'
              }`}>
                Settings
              </button>
            </div>
          </div>

          {/* Tab Bar */}
          <div className={`px-6 flex gap-6 border-t ${
            isDark ? 'border-[#3A4A5E]' : 'border-[#D4D2CA]'
          }`}>
            {[
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'habits', label: 'Habits' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-2 py-3 font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? isDark
                      ? 'text-[#7AA897]'
                      : 'text-[#6B9B8C]'
                    : isDark
                      ? 'text-[#9B9B9B] hover:text-[#E8E6E0]'
                      : 'text-[#6B6B6B] hover:text-[#2D2D2D]'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                    isDark ? 'bg-[#7AA897]' : 'bg-[#6B9B8C]'
                  }`} />
                )}
              </button>
            ))}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {activeTab === 'weekly' && <WeeklyView />}
          {activeTab === 'monthly' && <MonthlyView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'habits' && <HabitsView />}
        </main>
      </div>
    </DarkModeContext.Provider>
  );
}
