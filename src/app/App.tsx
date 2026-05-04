import { useState, useEffect } from 'react';
import { WeeklyView } from './components/WeeklyView';
import { MonthlyView } from './components/MonthlyView';
import { AnalyticsView } from './components/AnalyticsView';
import { HabitsView } from './components/HabitsView';
import { FriendsView } from './components/FriendsView';
import { LeaderboardView } from './components/LeaderboardView';
import { AuthScreen } from './components/AuthScreen';
import { Moon, Sun, LogOut } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useHabits } from '../hooks/useHabits';
import { Button } from './components/ui/button';
import { supabase } from '../lib/supabase';
import { DarkModeContext } from './context/DarkModeContext';
import type { User } from '@supabase/supabase-js';

export type Tab = 'weekly' | 'monthly' | 'analytics' | 'habits' | 'friends' | 'leaderboard';

// Minimal habit shape needed by views — DbHabit satisfies this.
export interface Habit {
  id: string;
  name: string;
}

// ─── Authenticated shell ────────────────────────────────────────────────────
// Only mounts once `user` is known, so the localStorage key is stable from
// the very first render (no stale reads from a previous user's data).

function AuthenticatedApp({ user, isDark, toggleDark, pendingInviteCode, onClearInviteCode }: {
  user: User;
  isDark: boolean;
  toggleDark: () => void;
  pendingInviteCode: string | null;
  onClearInviteCode: () => void;
}) {
  const [activeTab, setActiveTab] = useLocalStorage<Tab>(`habitos-active-tab-${user.id}`, 'weekly');
  const { habits } = useHabits();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('profiles').select('display_name').eq('id', user.id).single()
      .then(({ data }) => { if (data) setDisplayName(data.display_name); });
  }, [user.id]);

  // Auto-switch to Groups tab when an invite link was followed
  useEffect(() => {
    if (pendingInviteCode) setActiveTab('leaderboard');
  }, [pendingInviteCode]);

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
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isDark ? 'bg-[#7AA897]' : 'bg-[#6B9B8C]'
            }`}>
              <span className="text-white font-semibold text-base sm:text-lg">H</span>
            </div>
            <span className={`font-semibold text-base sm:text-xl ${
              isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'
            }`}>
              {displayName && <span className="hidden sm:inline">{displayName}'s </span>}HabitOS
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
        <div className={`px-3 sm:px-6 flex gap-1 sm:gap-6 border-t ${
          isDark ? 'border-[#3A4A5E]' : 'border-[#D4D2CA]'
        }`}>
          {([
            { id: 'weekly',    label: 'Weekly' },
            { id: 'monthly',   label: 'Monthly' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'habits',    label: 'Habits' },
            { id: 'friends',     label: 'Friends' },
            { id: 'leaderboard', label: 'Groups' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 sm:px-3 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors relative flex-1 sm:flex-none ${
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
        {activeTab === 'habits'    && <HabitsView />}
        {activeTab === 'friends'   && <FriendsView />}
        {activeTab === 'leaderboard' && (
          <LeaderboardView
            pendingInviteCode={pendingInviteCode}
            onJoinComplete={(groupId) => {
              onClearInviteCode();
              setActiveTab('leaderboard');
            }}
          />
        )}
      </main>
    </div>
  );
}

// ─── Root ───────────────────────────────────────────────────────────────────

export default function App() {
  const [isDark, setIsDark] = useLocalStorage('habitos-dark', false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(() => {
    const code = new URLSearchParams(window.location.search).get('join');
    if (code) window.history.replaceState({}, '', window.location.pathname);
    return code;
  });

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
        ? <AuthenticatedApp
            user={user}
            isDark={isDark}
            toggleDark={toggleDark}
            pendingInviteCode={pendingInviteCode}
            onClearInviteCode={() => setPendingInviteCode(null)}
          />
        : <AuthScreen invitePending={!!pendingInviteCode} />
      }
    </DarkModeContext.Provider>
  );
}
