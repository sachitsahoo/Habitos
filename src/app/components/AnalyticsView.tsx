import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '../context/DarkModeContext';
import { useHabitLogs } from '../../hooks/useHabitLogs';
import { useDailyLogs } from '../../hooks/useDailyLogs';
import type { Habit } from '../App';

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Midnight-normalize a date so arithmetic never drifts across DST boundaries
function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function daysAgo(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() - n);
  return d;
}

interface AnalyticsViewProps { habits: Habit[] }

export function AnalyticsView({ habits }: AnalyticsViewProps) {
  const { isDark } = useDarkMode();

  // Capture today once — midnight-normalized so all date arithmetic uses the same base
  const today = startOfDay(new Date());

  // Fetch 90 days for streak accuracy, 30 days for daily logs
  const startDate90 = toDateKey(daysAgo(today, 89));
  const startDate30 = toDateKey(daysAgo(today, 29));
  const endDate     = toDateKey(today);

  const { completions } = useHabitLogs(startDate90, endDate);
  const { logsByDate }  = useDailyLogs(startDate30, endDate);

  // Last 30 days chart data
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = daysAgo(today, 29 - i);
    const key = toDateKey(d);
    const dayLog = logsByDate[key];
    const dayCompletions = completions[key] ?? {};
    const done = habits.filter(h => dayCompletions[h.id]).length;
    const completion = habits.length > 0 ? (done / habits.length) * 100 : 0;
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completion,
      mood:       dayLog?.mood       ?? 0,
      motivation: dayLog?.motivation ?? 0,
      tracked:    !!dayLog,
    };
  });

  // Per-habit stats using 90-day window
  const habitStats = habits.map(habit => {
    // Current streak: count back from today
    let currentStreak = 0;
    for (let i = 0; i < 90; i++) {
      const key = toDateKey(daysAgo(today, i));
      if (completions[key]?.[habit.id]) currentStreak++;
      else break;
    }

    // Best streak in 90-day window
    let bestStreak = 0, run = 0;
    for (let i = 89; i >= 0; i--) {
      const key = toDateKey(daysAgo(today, i));
      if (completions[key]?.[habit.id]) {
        run++;
        bestStreak = Math.max(bestStreak, run);
      } else {
        run = 0;
      }
    }
    bestStreak = Math.max(bestStreak, currentStreak);

    // Completion % over days that have any log data in 90-day window
    let total = 0, done = 0;
    for (let i = 0; i < 90; i++) {
      const key = toDateKey(daysAgo(today, i));
      if (completions[key] !== undefined) {
        total++;
        if (completions[key][habit.id]) done++;
      }
    }
    const completion = total > 0 ? (done / total) * 100 : 0;

    return { ...habit, currentStreak, bestStreak, completion };
  });

  const avgCompletion = last30Days.reduce((s, d) => s + d.completion, 0) / 30;
  const trackedDays   = last30Days.filter(d => d.tracked);
  const avgMood       = trackedDays.length > 0 ? trackedDays.reduce((s, d) => s + d.mood, 0) / trackedDays.length : 0;
  const avgMotivation = trackedDays.length > 0 ? trackedDays.reduce((s, d) => s + d.motivation, 0) / trackedDays.length : 0;
  const longestStreak = habitStats.length > 0 ? Math.max(...habitStats.map(h => h.bestStreak)) : 0;

  const cardClass = `rounded-xl transition-colors border ${isDark ? 'bg-[#2A3D55] border-[#4A5E72]' : 'bg-white border-[#D4D2CA]'}`;
  const tooltipStyle = { backgroundColor: isDark ? '#2A3D55' : 'white', border: `1px solid ${isDark ? '#4A5E72' : '#D4D2CA'}`, borderRadius: '12px', color: isDark ? '#E8E6E0' : '#2D2D2D', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' };
  const axisProps = { stroke: isDark ? '#ABABAB' : '#6B6B6B', fontSize: 12, tickLine: false as const, style: { fontFamily: 'var(--font-mono)' } };

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '30-Day Avg Completion', value: `${Math.round(avgCompletion)}%` },
          { label: 'Longest Streak',        value: longestStreak },
          { label: 'Active Habits',         value: habits.length },
        ].map(({ label, value }) => (
          <div key={label} className={`${cardClass} p-6`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className={`text-3xl font-semibold ${isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'}`}
                 style={{ fontFamily: 'var(--font-mono)' }}>{value}</div>
            <div className={`text-sm mt-1 ${isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]'}`}>{label}</div>
          </div>
        ))}
      </div>

      {/* 30-Day Completion Trend */}
      <div className={`${cardClass} p-6 mb-6`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
          Last 30 Days Habit Completion
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={last30Days}>
            <defs>
              <linearGradient id="analyticsColorCompletion30" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4A5E72' : '#D4D2CA'} />
            <XAxis dataKey="date" {...axisProps} fontSize={11} interval={4} />
            <YAxis {...axisProps} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, 'Completion']} />
            <Area type="monotone" dataKey="completion" stroke={isDark ? '#7AA897' : '#6B9B8C'}
                  strokeWidth={2} fillOpacity={1} fill="url(#analyticsColorCompletion30)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Per-Habit Performance */}
      <div className={`${cardClass} p-6 mb-6`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
          Habit Performance
        </h3>
        {habitStats.length === 0 ? (
          <p className={`text-sm py-4 ${isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]'}`}>
            No habits yet. Add habits to see performance data here.
          </p>
        ) : (
          <div className="space-y-4">
            {habitStats.map((habit) => (
              <div key={habit.id} className={`pb-4 last:border-0 border-b ${isDark ? 'border-[#4A5E72]' : 'border-[#D4D2CA]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`font-medium ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>{habit.name}</div>
                  <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]'}`}>
                    <span>Current: <span style={{ fontFamily: 'var(--font-mono)' }}>{habit.currentStreak}</span> days</span>
                    <span>Best: <span style={{ fontFamily: 'var(--font-mono)' }}>{habit.bestStreak}</span> days</span>
                    <span className={`font-semibold ${isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'}`}
                          style={{ fontFamily: 'var(--font-mono)' }}>
                      {Math.round(habit.completion)}%
                    </span>
                  </div>
                </div>
                <div className={`flex-1 rounded-full h-2 overflow-hidden ${isDark ? 'bg-[#354D67]' : 'bg-[#E8E6E0]'}`}>
                  <div className={`h-full transition-all ${isDark ? 'bg-[#7AA897]' : 'bg-[#6B9B8C]'}`}
                       style={{ width: `${habit.completion}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mood Tracking */}
      <div className={`${cardClass} p-6 mb-6`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 className={`font-semibold text-lg mb-2 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
          Mood Tracking (Last 30 Days)
        </h3>
        <div className={`text-sm mb-4 ${isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]'}`}>
          {trackedDays.length > 0
            ? <>Average: <span className={`font-semibold ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}
                               style={{ fontFamily: 'var(--font-mono)' }}>{avgMood.toFixed(1)}/10</span></>
            : 'No tracked days yet.'}
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={last30Days}>
            <defs>
              <linearGradient id="analyticsMoodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4A5E72' : '#D4D2CA'} />
            <XAxis dataKey="date" {...axisProps} fontSize={11} interval={4} />
            <YAxis {...axisProps} domain={[0, 10]} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toFixed(1), 'Mood']} />
            <Area type="monotone" dataKey="mood" stroke={isDark ? '#7AA897' : '#6B9B8C'}
                  strokeWidth={2} fillOpacity={1} fill="url(#analyticsMoodGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Motivation Tracking */}
      <div className={`${cardClass} p-6`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 className={`font-semibold text-lg mb-2 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
          Motivation Tracking (Last 30 Days)
        </h3>
        <div className={`text-sm mb-4 ${isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]'}`}>
          {trackedDays.length > 0
            ? <>Average: <span className={`font-semibold ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}
                               style={{ fontFamily: 'var(--font-mono)' }}>{avgMotivation.toFixed(1)}/10</span></>
            : 'No tracked days yet.'}
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={last30Days}>
            <defs>
              <linearGradient id="analyticsMotivationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4A5E72' : '#D4D2CA'} />
            <XAxis dataKey="date" {...axisProps} fontSize={11} interval={4} />
            <YAxis {...axisProps} domain={[0, 10]} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toFixed(1), 'Motivation']} />
            <Area type="monotone" dataKey="motivation" stroke={isDark ? '#7AA897' : '#6B9B8C'}
                  strokeWidth={2} fillOpacity={1} fill="url(#analyticsMotivationGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
