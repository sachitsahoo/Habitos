import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '../App';

const MOCK_HABITS = [
  { id: '1', name: 'Morning Exercise' },
  { id: '2', name: 'Read 30 minutes' },
  { id: '3', name: 'Meditate' },
  { id: '4', name: 'Drink 8 glasses of water' },
  { id: '5', name: 'No social media before noon' }
];

function generateLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completion: Math.random() * 40 + 60,
      mood: Math.random() * 4 + 6,
      motivation: Math.random() * 4 + 5
    };
  });
}

function generateHabitStats() {
  return MOCK_HABITS.map(habit => {
    const currentStreak = Math.floor(Math.random() * 15) + 1;
    const bestStreak = currentStreak + Math.floor(Math.random() * 10);
    const completion = Math.random() * 30 + 70;
    return {
      ...habit,
      currentStreak,
      bestStreak,
      completion
    };
  });
}

export function AnalyticsView() {
  const { isDark } = useDarkMode();
  const last30Days = generateLast30Days();
  const habitStats = generateHabitStats();

  const avgCompletion = last30Days.reduce((sum, day) => sum + day.completion, 0) / last30Days.length;
  const avgMood = last30Days.reduce((sum, day) => sum + day.mood, 0) / last30Days.length;
  const avgMotivation = last30Days.reduce((sum, day) => sum + day.motivation, 0) / last30Days.length;

  const longestStreak = Math.max(...habitStats.map(h => h.bestStreak));
  const totalHabits = MOCK_HABITS.length;

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
            {totalHabits}
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
        <ResponsiveContainer width="100%" height={300} key="analytics-completion-container">
          <AreaChart data={last30Days} id="analytics-completion-chart">
            <defs>
              <linearGradient id="analyticsColorCompletion30" x1="0" y1="0" x2="0" y2="1">
                <stop key="analytics-completion-stop-1" offset="5%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0.2}/>
                <stop key="analytics-completion-stop-2" offset="95%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid key="analytics-completion-grid" strokeDasharray="3 3" stroke={isDark ? '#3A4A5E' : '#D4D2CA'} />
            <XAxis
              key="analytics-completion-xaxis"
              dataKey="date"
              stroke={isDark ? '#9B9B9B' : '#6B6B6B'}
              fontSize={11}
              tickLine={false}
              interval={4}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <YAxis
              key="analytics-completion-yaxis"
              stroke={isDark ? '#9B9B9B' : '#6B6B6B'}
              fontSize={12}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <Tooltip
              key="analytics-completion-tooltip"
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
              key="analytics-completion-area"
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
          Average: <span className={`font-semibold ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}
                         style={{ fontFamily: 'var(--font-mono)' }}>
            {avgMood.toFixed(1)}/10
          </span>
        </div>
        <ResponsiveContainer width="100%" height={250} key="analytics-mood-container">
          <AreaChart data={last30Days} id="analytics-mood-chart">
            <defs>
              <linearGradient id="analyticsMoodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop key="analytics-mood-stop-1" offset="5%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0.2}/>
                <stop key="analytics-mood-stop-2" offset="95%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid key="analytics-mood-grid" strokeDasharray="3 3" stroke={isDark ? '#3A4A5E' : '#D4D2CA'} />
            <XAxis
              key="analytics-mood-xaxis"
              dataKey="date"
              stroke={isDark ? '#9B9B9B' : '#6B6B6B'}
              fontSize={11}
              tickLine={false}
              interval={4}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <YAxis
              key="analytics-mood-yaxis"
              stroke={isDark ? '#9B9B9B' : '#6B6B6B'}
              fontSize={12}
              tickLine={false}
              domain={[0, 10]}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <Tooltip
              key="analytics-mood-tooltip"
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
              key="analytics-mood-area"
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
          Average: <span className={`font-semibold ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}
                         style={{ fontFamily: 'var(--font-mono)' }}>
            {avgMotivation.toFixed(1)}/10
          </span>
        </div>
        <ResponsiveContainer width="100%" height={250} key="analytics-motivation-container">
          <AreaChart data={last30Days} id="analytics-motivation-chart">
            <defs>
              <linearGradient id="analyticsMotivationGradient" x1="0" y1="0" x2="0" y2="1">
                <stop key="analytics-motivation-stop-1" offset="5%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0.2}/>
                <stop key="analytics-motivation-stop-2" offset="95%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid key="analytics-motivation-grid" strokeDasharray="3 3" stroke={isDark ? '#3A4A5E' : '#D4D2CA'} />
            <XAxis
              key="analytics-motivation-xaxis"
              dataKey="date"
              stroke={isDark ? '#9B9B9B' : '#6B6B6B'}
              fontSize={11}
              tickLine={false}
              interval={4}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <YAxis
              key="analytics-motivation-yaxis"
              stroke={isDark ? '#9B9B9B' : '#6B6B6B'}
              fontSize={12}
              tickLine={false}
              domain={[0, 10]}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <Tooltip
              key="analytics-motivation-tooltip"
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
              key="analytics-motivation-area"
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
