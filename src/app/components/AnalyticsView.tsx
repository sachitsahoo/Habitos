import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '../context/DarkModeContext';
import type { Habit } from '../App';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface StoredHabit extends Habit { completed: boolean }
interface StoredDayData { habits: StoredHabit[]; mood: number; motivation: number; }

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

interface AnalyticsViewProps { habits: Habit[] }

export function AnalyticsView({ habits }: AnalyticsViewProps) {
  const { isDark } = useDarkMode();
  const [allDayData] = useLocalStorage<Record<string, StoredDayData>>('habitos-week-data', {});

  // Last 30 days — most recent on the right
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = toDateKey(d);
    const stored = allDayData[key];
    const completedCount = stored?.habits
      ? habits.filter(h => stored.habits.find(sh => sh.id === h.id)?.completed).length
      : 0;
    const completion = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completion,
      mood: stored?.mood ?? 0,
      motivation: stored?.motivation ?? 0,
      tracked: !!stored,
    };
  });

  // Per-habit stats derived from all stored data
  const habitStats = habits.map(habit => {
    const sortedKeys = Object.keys(allDayData).sort();

    // Current streak: from today backward through consecutive calendar days
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = toDateKey(d);
      const completed = allDayData[key]?.habits?.find(h => h.id === habit.id)?.completed ?? false;
      if (completed) currentStreak++;
      else break;
    }

    // Best streak: longest run of consecutive completed days in all stored data
    let bestStreak = 0, run = 0;
    for (let i = 0; i < sortedKeys.length; i++) {
      const key = sortedKeys[i];
      const completed = allDayData[key]?.habits?.find(h => h.id === habit.id)?.completed ?? false;
      if (completed) {
        const isConsecutive = i > 0 && (() => {
          const prev = new Date(sortedKeys[i - 1]);
          const curr = new Date(key);
          return Math.round((curr.getTime() - prev.getTime()) / 86400000) === 1;
        })();
        run = (i === 0 || isConsecutive) ? run + 1 : 1;
      } else {
        run = 0;
      }
      bestStreak = Math.max(bestStreak, run);
    }
    bestStreak = Math.max(bestStreak, currentStreak);

    // Completion % over all days this habit appears in stored data
    const daysWithHabit = sortedKeys.filter(k =>
      allDayData[k]?.habits?.some(h => h.id === habit.id)
    );
    const completionPct = daysWithHabit.length > 0
      ? (daysWithHabit.filter(k =>
          allDayData[k]?.habits?.find(h => h.id === habit.id)?.completed
        ).length / daysWithHabit.length) * 100
      : 0;

    return { ...habit, currentStreak, bestStreak, completion: completionPct };
  });

  // Aggregate stats
  const avgCompletion = last30Days.reduce((sum, d) => sum + d.completion, 0) / 30;
  const trackedDays = last30Days.filter(d => d.tracked);
  const avgMood = trackedDays.length > 0
    ? trackedDays.reduce((sum, d) => sum + d.mood, 0) / trackedDays.length
    : 0;
  const avgMotivation = trackedDays.length > 0
    ? trackedDays.reduce((sum, d) => sum + d.motivation, 0) / trackedDays.length
    : 0;
  const longestStreak = habitStats.length > 0
    ? Math.max(...habitStats.map(h => h.bestStreak))
    : 0;

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`rounded-xl p-6 transition-colors border ${
          isDark
            ? 'bg-[#243347] border-[#3A4A5E]'
            : 'bg-white border-[#D4D2CA]'
        }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className={`text-3xl font-semibold ${isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'}`}
               style={{ fontFamily: 'var(--font-mono)' }}>
            {Math.round(avgCompletion)}%
          </div>
          <div className={`text-sm mt-1 ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
            30-Day Avg Completion
          </div>
        </div>
        <div className={`rounded-xl p-6 transition-colors border ${
          isDark
            ? 'bg-[#243347] border-[#3A4A5E]'
            : 'bg-white border-[#D4D2CA]'
        }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className={`text-3xl font-semibold ${isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'}`}
               style={{ fontFamily: 'var(--font-mono)' }}>
            {longestStreak}
          </div>
          <div className={`text-sm mt-1 ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
            Longest Streak
          </div>
        </div>
        <div className={`rounded-xl p-6 transition-colors border ${
          isDark
            ? 'bg-[#243347] border-[#3A4A5E]'
            : 'bg-white border-[#D4D2CA]'
        }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className={`text-3xl font-semibold ${isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'}`}
               style={{ fontFamily: 'var(--font-mono)' }}>
            {habits.length}
          </div>
          <div className={`text-sm mt-1 ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
            Active Habits
          </div>
        </div>
      </div>

      {/* 30-Day Completion Trend */}
      <div className={`rounded-xl p-6 mb-6 transition-colors border ${
        isDark
          ? 'bg-[#243347] border-[#3A4A5E]'
          : 'bg-white border-[#D4D2CA]'
      }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
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
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3A4A5E' : '#D4D2CA'} />
            <XAxis
              dataKey="date"
              stroke={isDark ? '#9B9B9B' : '#6B6B6B'}
              fontSize={11}
              tickLine={false}
              interval={4}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <YAxis
              stroke={isDark ? '#9B9B9B' : '#6B6B6B'}
              fontSize={12}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#243347' : 'white',
                border: `1px solid ${isDark ? '#3A4A5E' : '#D4D2CA'}`,
                borderRadius: '12px',
                color: isDark ? '#E8E6E0' : '#2D2D2D',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Completion']}
            />
            <Area
              type="monotone"
              dataKey="completion"
              stroke={isDark ? '#7AA897' : '#6B9B8C'}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#analyticsColorCompletion30)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Per-Habit Analytics */}
      <div className={`rounded-xl p-6 mb-6 transition-colors border ${
        isDark
          ? 'bg-[#243347] border-[#3A4A5E]'
          : 'bg-white border-[#D4D2CA]'
      }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
          Habit Performance
        </h3>
        {habitStats.length === 0 ? (
          <p className={`text-sm py-4 ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
            No habits yet. Add habits to see performance data here.
          </p>
        ) : (
          <div className="space-y-4">
            {habitStats.map((habit) => (
              <div key={habit.id} className={`pb-4 last:border-0 border-b ${
                isDark ? 'border-[#3A4A5E]' : 'border-[#D4D2CA]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`font-medium ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
                    {habit.name}
                  </div>
                  <div className={`flex items-center gap-4 text-sm ${
                    isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'
                  }`}>
                    <span>Current: <span style={{ fontFamily: 'var(--font-mono)' }}>{habit.currentStreak}</span> days</span>
                    <span>Best: <span style={{ fontFamily: 'var(--font-mono)' }}>{habit.bestStreak}</span> days</span>
                    <span className={`font-semibold ${isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'}`}
                          style={{ fontFamily: 'var(--font-mono)' }}>
                      {Math.round(habit.completion)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex-1 rounded-full h-2 overflow-hidden ${
                    isDark ? 'bg-[#2D3E54]' : 'bg-[#E8E6E0]'
                  }`}>
                    <div
                      className={isDark ? 'bg-[#7AA897] h-full transition-all' : 'bg-[#6B9B8C] h-full transition-all'}
                      style={{ width: `${habit.completion}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mood Tracking */}
      <div className={`rounded-xl p-6 mb-6 transition-colors border ${
        isDark
          ? 'bg-[#243347] border-[#3A4A5E]'
          : 'bg-white border-[#D4D2CA]'
      }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 className={`font-semibold text-lg mb-2 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
          Mood Tracking (Last 30 Days)
        </h3>
        <div className={`text-sm mb-4 ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
          {trackedDays.length > 0
            ? <>Average: <span className={`font-semibold ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}
                               style={{ fontFamily: 'var(--font-mono)' }}>
                {avgMood.toFixed(1)}/10
              </span></>
            : 'No tracked days yet.'
          }
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={last30Days}>
            <defs>
              <linearGradient id="analyticsMoodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3A4A5E' : '#D4D2CA'} />
            <XAxis
              dataKey="date"
              stroke={isDark ? '#9B9B9B' : '#6B6B6B'}
              fontSize={11}
              tickLine={false}
              interval={4}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <YAxis
              stroke={isDark ? '#9B9B9B' : '#6B6B6B'}
              fontSize={12}
              tickLine={false}
              domain={[0, 10]}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#243347' : 'white',
                border: `1px solid ${isDark ? '#3A4A5E' : '#D4D2CA'}`,
                borderRadius: '12px',
                color: isDark ? '#E8E6E0' : '#2D2D2D',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}
              formatter={(value: number) => [value.toFixed(1), 'Mood']}
            />
            <Area
              type="monotone"
              dataKey="mood"
              stroke={isDark ? '#7AA897' : '#6B9B8C'}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#analyticsMoodGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Motivation Tracking */}
      <div className={`rounded-xl p-6 transition-colors border ${
        isDark
          ? 'bg-[#243347] border-[#3A4A5E]'
          : 'bg-white border-[#D4D2CA]'
      }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 className={`font-semibold text-lg mb-2 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
          Motivation Tracking (Last 30 Days)
        </h3>
        <div className={`text-sm mb-4 ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
          {trackedDays.length > 0
            ? <>Average: <span className={`font-semibold ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}
                               style={{ fontFamily: 'var(--font-mono)' }}>
                {avgMotivation.toFixed(1)}/10
              </span></>
            : 'No tracked days yet.'
          }
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={last30Days}>
            <defs>
              <linearGradient id="analyticsMotivationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#3A4A5E' : '#D4D2CA'} />
            <XAxis
              dataKey="date"
              stroke={isDark ? '#9B9B9B' : '#6B6B6B'}
              fontSize={11}
              tickLine={false}
              interval={4}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <YAxis
              stroke={isDark ? '#9B9B9B' : '#6B6B6B'}
              fontSize={12}
              tickLine={false}
              domain={[0, 10]}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#243347' : 'white',
                border: `1px solid ${isDark ? '#3A4A5E' : '#D4D2CA'}`,
                borderRadius: '12px',
                color: isDark ? '#E8E6E0' : '#2D2D2D',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}
              formatter={(value: number) => [value.toFixed(1), 'Motivation']}
            />
            <Area
              type="monotone"
              dataKey="motivation"
              stroke={isDark ? '#7AA897' : '#6B9B8C'}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#analyticsMotivationGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
