import { useState, useEffect, useRef } from 'react';
import { WeeklyView } from './components/WeeklyView';
import { MonthlyView } from './components/MonthlyView';
import { AnalyticsView } from './components/AnalyticsView';
import { HabitsView } from './components/HabitsView';
import { FriendsView } from './components/FriendsView';
import { LeaderboardView } from './components/LeaderboardView';
import { AuthScreen } from './components/AuthScreen';
import { IOSInstallBanner } from './components/IOSInstallBanner';
import { Moon, Sun, LogOut, CalendarDays, Calendar, BarChart2, ListChecks, Users, Trophy } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useLocalStorage<Tab>(`ataraxia-active-tab-${user.id}`, 'weekly');
  const { habits, refetch: refetchHabits } = useHabits();
  const cacheKey = `ataraxia_display_name_${user.id}`;
  const [displayName, setDisplayName] = useState<string | null>(
    () => localStorage.getItem(cacheKey)
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('profiles').select('display_name').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name);
          localStorage.setItem(cacheKey, data.display_name);
        }
      });
  }, [user.id]);

  const startEditingName = () => {
    setEditValue(displayName ?? '');
    setNameError(null);
    setIsEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const saveDisplayName = async () => {
    const trimmed = editValue.trim();
    if (!trimmed) { setIsEditingName(false); setNameError(null); return; }

    // No change, or user blurred away while an error was showing — close silently
    if (trimmed === displayName || nameError) { setIsEditingName(false); setNameError(null); return; }

    const previous = displayName;
    setDisplayName(trimmed);
    localStorage.setItem(cacheKey, trimmed);
    setIsEditingName(false);
    setNameError(null);

    const { error } = await supabase.rpc('update_display_name', { p_new_name: trimmed });
    if (error) {
      setDisplayName(previous);
      if (previous) localStorage.setItem(cacheKey, previous); else localStorage.removeItem(cacheKey);
      setIsEditingName(true);
      setEditValue(trimmed);
      const msg = error.message ?? '';
      if (msg.includes('once per day'))
        setNameError('You can only change your display name once per day.');
      else if (error.code === '23505' || msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('already'))
        setNameError('That display name is already taken.');
      else
        setNameError(msg || 'Could not save display name.');
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); saveDisplayName(); }
    if (e.key === 'Escape') { setIsEditingName(false); setNameError(null); }
  };

  // Refetch the shared habits list whenever the user leaves the Habits tab,
  // since HabitsView has its own useHabits() instance and mutations there
  // don't propagate back to this one automatically.
  const prevTabRef = useRef<Tab>(activeTab);
  useEffect(() => {
    if (prevTabRef.current === 'habits' && activeTab !== 'habits') {
      refetchHabits();
    }
    prevTabRef.current = activeTab;
  }, [activeTab, refetchHabits]);

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
              <span className="text-white font-semibold text-base sm:text-lg">a</span>
            </div>

            {/* Desktop: editable display name */}
            <div className="hidden sm:flex flex-col">
              {isEditingName ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={editValue}
                      onChange={e => { setEditValue(e.target.value); setNameError(null); }}
                      onBlur={saveDisplayName}
                      onKeyDown={handleNameKeyDown}
                      maxLength={50}
                      className={`font-semibold text-base sm:text-xl w-32 sm:w-44 px-2 py-0.5 rounded-lg border outline-none transition-colors ${
                        isDark
                          ? 'bg-[#2D3E54] border-[#3A4A5E] text-[#E8E6E0] focus:border-[#7AA897]'
                          : 'bg-[#F8F7F4] border-[#D4D2CA] text-[#2D2D2D] focus:border-[#6B9B8C]'
                      }`}
                    />
                    <span className={`font-semibold text-base sm:text-xl flex-shrink-0 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
                      's Ataraxia
                    </span>
                  </div>
                  {nameError && (
                    <p className="text-xs text-[#C84C4C]">{nameError}</p>
                  )}
                </div>
              ) : (
                <button
                  onClick={startEditingName}
                  title="Click to edit your display name"
                  className={`font-semibold text-base sm:text-xl text-left transition-opacity hover:opacity-60 ${
                    isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'
                  }`}
                >
                  {displayName ? `${displayName}'s Ataraxia` : 'Ataraxia'}
                </button>
              )}
            </div>

            {/* Mobile: static, no edit */}
            <span className={`sm:hidden font-semibold text-base ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
              Ataraxia
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

        {/* Desktop tab bar — hidden on mobile */}
        <div className={`hidden sm:flex px-6 gap-6 border-t ${
          isDark ? 'border-[#3A4A5E]' : 'border-[#D4D2CA]'
        }`}>
          {([
            { id: 'weekly',      label: 'Weekly' },
            { id: 'monthly',     label: 'Monthly' },
            { id: 'analytics',   label: 'Analytics' },
            { id: 'habits',      label: 'Habits' },
            { id: 'friends',     label: 'Friends' },
            { id: 'leaderboard', label: 'Groups' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-3 text-sm font-medium transition-colors relative ${
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

      {/* Content Area — extra bottom padding on mobile for the nav bar */}
      <main className="flex-1 overflow-auto pb-[calc(64px+env(safe-area-inset-bottom))] sm:pb-0">
        {activeTab === 'weekly'    && <WeeklyView habits={habits} />}
        {activeTab === 'monthly'   && <MonthlyView habits={habits} />}
        {activeTab === 'analytics' && <AnalyticsView habits={habits} />}
        {activeTab === 'habits'    && <HabitsView />}
        {activeTab === 'friends'   && <FriendsView />}
        {activeTab === 'leaderboard' && (
          <LeaderboardView
            pendingInviteCode={pendingInviteCode}
            onJoinComplete={() => {
              onClearInviteCode();
              setActiveTab('leaderboard');
            }}
          />
        )}
      </main>

      {/* Mobile bottom nav — hidden on desktop */}
      <nav className={`sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t ${
        isDark ? 'bg-[#243347] border-[#3A4A5E]' : 'bg-white border-[#D4D2CA]'
      }`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex">
          {([
            { id: 'weekly',      label: 'Weekly',    icon: CalendarDays },
            { id: 'monthly',     label: 'Monthly',   icon: Calendar },
            { id: 'analytics',   label: 'Stats',     icon: BarChart2 },
            { id: 'habits',      label: 'Habits',    icon: ListChecks },
            { id: 'friends',     label: 'Friends',   icon: Users },
            { id: 'leaderboard', label: 'Groups',    icon: Trophy },
          ] as const).map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                  active
                    ? isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'
                    : isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.75} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ─── Root ───────────────────────────────────────────────────────────────────

export default function App() {
  const [isDark, setIsDark] = useLocalStorage('ataraxia-dark', false);
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
      <IOSInstallBanner />
    </DarkModeContext.Provider>
  );
}
