import { useState, useEffect } from 'react';
import { WeeklyView } from './components/WeeklyView';
import { MonthlyView } from './components/MonthlyView';
import { AnalyticsView } from './components/AnalyticsView';
import { HabitsView } from './components/HabitsView';
import { AuthScreen } from './components/AuthScreen';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Button } from './components/ui/button';
import { supabase } from '../lib/supabase';
import { DarkModeContext } from './context/DarkModeContext';
import type { User } from '@supabase/supabase-js';

export type Tab = 'weekly' | 'monthly' | 'analytics' | 'habits';

export interface Habit {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
}

// ─── Authenticated shell ────────────────────────────────────────────────────
// Only mounts once `user` is known, so the localStorage key is stable from
// the very first render (no stale reads from a previous user's data).

function AuthenticatedApp({ user, isDark, toggleDark }: {
  user: User;
  isDark: boolean;
  toggleDark: () => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('weekly');

  // Key scoped to user — each account gets its own localStorage slot.
  // Default is [] so a brand-new account starts empty (no mock habits).
  // Phase 3 will replace this with Supabase reads.
  const [habits, setHabits] = useLocalStorage<Habit[]>(
    `habitos-habits-${user.id}`,
    []
  );

  // One-time migration: patch habits that predate the startDate field
  useEffect(() => {
    setHabits(prev => {
      if (!prev.some(h => !h.startDate)) return prev;
      return prev.map(h => h.startDate ? h : { ...h, startDate: '2000-01-01' });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className={`size-full flex flex-col transition-colors ${
      isDark ? 'bg-[#1A2332]' : 'bg-[#F8F7F4]'
    }`}>
      {/* Sticky Header */}
      <header className={`sticky top-0 z-50 border-b transition-colors ${
        isDark ? 'bg-[#243347] border-[#3A4A5E]' : 'bg-white border-[#D4D2CA]'
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
              size="icon"
              onClick={handleSignOut}
              title="Sign out"
              className={isDark
                ? 'bg-[#2D3E54] hover:bg-[#3A4A5E] text-[#E8E6E0]'
                : 'bg-[#E8E6E0] hover:bg-[#D4D2CA] text-[#2D2D2D]'}
            >
              <LogOut className="w-5 h-5" />
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
        {activeTab === 'monthly'   && <MonthlyView habits={habits.filter(h => !h.endDate)} />}
        {activeTab === 'analytics' && <AnalyticsView habits={habits.filter(h => !h.endDate)} />}
        {activeTab === 'habits'    && <HabitsView habits={habits} setHabits={setHabits} />}
      </main>
    </div>
  );
}

// ─── Root ───────────────────────────────────────────────────────────────────

export default function App() {
  const [isDark, setIsDark] = useLocalStorage('habitos-dark', false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const toggleDark = () => setIsDark(prev => !prev);

  // Keep .dark class on <html> in sync so shadcn dark: utilities work
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Check for existing session on mount, then subscribe to auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div className={`size-full flex items-center justify-center ${isDark ? 'bg-[#1A2332]' : 'bg-[#F8F7F4]'}`}>
        <div className={`w-8 h-8 rounded-full border-2 border-t-transparent animate-spin ${isDark ? 'border-[#7AA897]' : 'border-[#6B9B8C]'}`} />
      </div>
    );
  }

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDark }}>
      {user
        ? <AuthenticatedApp user={user} isDark={isDark} toggleDark={toggleDark} />
        : <AuthScreen />
      }
    </DarkModeContext.Provider>
  );
}
