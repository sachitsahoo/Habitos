import { useState, createContext, useContext, useEffect } from 'react';
import { WeeklyView } from './components/WeeklyView';
import { MonthlyView } from './components/MonthlyView';
import { AnalyticsView } from './components/AnalyticsView';
import { HabitsView } from './components/HabitsView';
import { Moon, Sun } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Button } from './components/ui/button';

export type Tab = 'weekly' | 'monthly' | 'analytics' | 'habits';

export interface Habit {
  id: string;
  name: string;
}

export const INITIAL_HABITS: Habit[] = [
  { id: '1', name: 'Morning Exercise' },
  { id: '2', name: 'Read 30 minutes' },
  { id: '3', name: 'Meditate' },
  { id: '4', name: 'Drink 8 glasses of water' },
  { id: '5', name: 'No social media before noon' },
];

const DarkModeContext = createContext({ isDark: false, toggleDark: () => {} });

export const useDarkMode = () => useContext(DarkModeContext);

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('weekly');
  const [isDark, setIsDark] = useLocalStorage('habitos-dark', false);
  const [habits, setHabits] = useLocalStorage<Habit[]>('habitos-habits', INITIAL_HABITS);

  const toggleDark = () => setIsDark(prev => !prev);

  // Keep .dark class on <html> in sync so shadcn dark: utilities activate
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

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
                isDark ? 'bg-[#7AA897]' : 'bg-[#6B9B8C]'
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
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDark}
                className={isDark
                  ? 'bg-[#2D3E54] hover:bg-[#3A4A5E] text-[#E8E6E0]'
                  : 'bg-[#E8E6E0] hover:bg-[#D4D2CA] text-[#2D2D2D]'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                className={isDark
                  ? 'bg-[#2D3E54] hover:bg-[#3A4A5E] text-[#E8E6E0]'
                  : 'bg-[#E8E6E0] hover:bg-[#D4D2CA] text-[#2D2D2D]'}
              >
                Export
              </Button>
              <Button
                className={isDark
                  ? 'bg-[#7AA897] hover:bg-[#669989] text-[#1A2332]'
                  : 'bg-[#6B9B8C] hover:bg-[#5A8B7D] text-white'}
              >
                Settings
              </Button>
            </div>
          </div>

          {/* Tab Bar */}
          <div className={`px-6 flex gap-6 border-t ${
            isDark ? 'border-[#3A4A5E]' : 'border-[#D4D2CA]'
          }`}>
            {([
              { id: 'weekly',    label: 'Weekly' },
              { id: 'monthly',   label: 'Monthly' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'habits',    label: 'Habits' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-3 font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'
                    : isDark ? 'text-[#9B9B9B] hover:text-[#E8E6E0]' : 'text-[#6B6B6B] hover:text-[#2D2D2D]'
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
          {activeTab === 'weekly'    && <WeeklyView habits={habits} />}
          {activeTab === 'monthly'   && <MonthlyView habits={habits} />}
          {activeTab === 'analytics' && <AnalyticsView habits={habits} />}
          {activeTab === 'habits'    && <HabitsView habits={habits} setHabits={setHabits} />}
        </main>
      </div>
    </DarkModeContext.Provider>
  );
}
