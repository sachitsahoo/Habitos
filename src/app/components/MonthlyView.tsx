import { useState } from 'react';
import { CircularProgress } from './CircularProgress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '../App';

const MOCK_HABITS = [
  'Morning Exercise',
  'Read 30 minutes',
  'Meditate',
  'Drink 8 glasses of water',
  'No social media before noon'
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function generateMonthData(year: number, month: number) {
  const daysInMonth = getDaysInMonth(year, month);
  const habitData: Record<string, boolean[]> = {};

  MOCK_HABITS.forEach(habit => {
    habitData[habit] = Array.from({ length: daysInMonth }, () => Math.random() > 0.3);
  });

  const dailyCompletion = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    let completed = 0;
    MOCK_HABITS.forEach(habit => {
      if (habitData[habit][i]) completed++;
    });
    return {
      day,
      completion: (completed / MOCK_HABITS.length) * 100
    };
  });

  return { habitData, dailyCompletion };
}

export function MonthlyView() {
  const { isDark } = useDarkMode();
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const [monthData] = useState(() => generateMonthData(year, month));
  const daysInMonth = getDaysInMonth(year, month);

  const previousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const getMonthCompletion = () => {
    const total = monthData.dailyCompletion.reduce((sum, day) => sum + day.completion, 0);
    return total / monthData.dailyCompletion.length;
  };

  const getCurrentStreak = () => {
    let streak = 0;
    for (let i = monthData.dailyCompletion.length - 1; i >= 0; i--) {
      if (monthData.dailyCompletion[i].completion >= 80) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getBestDay = () => {
    const best = monthData.dailyCompletion.reduce((max, day) =>
      day.completion > max.completion ? day : max
    );
    return best.day;
  };

  const getHabitCompletion = (habit: string) => {
    const completed = monthData.habitData[habit].filter(Boolean).length;
    return (completed / daysInMonth) * 100;
  };

  return (
    <div className="p-6">
      {/* Month Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={previousMonth}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-[#243347] hover:bg-[#2D3E54] text-[#E8E6E0]'
                : 'bg-white hover:bg-[#E8E6E0] text-[#2D2D2D]'
            }`}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className={`font-semibold text-xl ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={nextMonth}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'bg-[#243347] hover:bg-[#2D3E54] text-[#E8E6E0]'
                : 'bg-white hover:bg-[#E8E6E0] text-[#2D2D2D]'
            }`}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className={`p-4 rounded-lg ${
          isDark ? 'bg-[#243347]' : 'bg-white'
        }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <CircularProgress percentage={getMonthCompletion()} size={80} strokeWidth={6} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`rounded-xl p-6 transition-colors border ${
          isDark
            ? 'bg-[#243347] border-[#3A4A5E]'
            : 'bg-white border-[#D4D2CA]'
        }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className={`text-3xl font-semibold ${isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'}`}
               style={{ fontFamily: 'var(--font-mono)' }}>
            {Math.round(getMonthCompletion())}%
          </div>
          <div className={`text-sm mt-1 ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
            Month Completion
          </div>
        </div>
        <div className={`rounded-xl p-6 transition-colors border ${
          isDark
            ? 'bg-[#243347] border-[#3A4A5E]'
            : 'bg-white border-[#D4D2CA]'
        }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className={`text-3xl font-semibold ${isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'}`}
               style={{ fontFamily: 'var(--font-mono)' }}>
            {getCurrentStreak()}
          </div>
          <div className={`text-sm mt-1 ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
            Current Streak
          </div>
        </div>
        <div className={`rounded-xl p-6 transition-colors border ${
          isDark
            ? 'bg-[#243347] border-[#3A4A5E]'
            : 'bg-white border-[#D4D2CA]'
        }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className={`text-3xl font-semibold ${isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'}`}
               style={{ fontFamily: 'var(--font-mono)' }}>
            {getBestDay()}
          </div>
          <div className={`text-sm mt-1 ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
            Best Day
          </div>
        </div>
      </div>

      {/* Habit Completion Matrix */}
      <div className={`rounded-xl p-6 mb-6 overflow-x-auto transition-colors border ${
        isDark
          ? 'bg-[#243347] border-[#3A4A5E]'
          : 'bg-white border-[#D4D2CA]'
      }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
          Habit Completion Matrix
        </h3>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`text-left p-2 border-b font-medium text-sm sticky left-0 z-10 ${
                isDark
                  ? 'border-[#3A4A5E] bg-[#243347] text-[#E8E6E0]'
                  : 'border-[#D4D2CA] bg-white text-[#2D2D2D]'
              }`}>
                Habit
              </th>
              {Array.from({ length: daysInMonth }, (_, i) => (
                <th key={i} className={`text-center p-2 border-b font-medium text-xs min-w-[32px] ${
                  isDark ? 'border-[#3A4A5E] text-[#9B9B9B]' : 'border-[#D4D2CA] text-[#6B6B6B]'
                }`}>
                  {i + 1}
                </th>
              ))}
              <th className={`p-2 border-b font-medium text-sm sticky right-0 z-10 ${
                isDark
                  ? 'border-[#3A4A5E] bg-[#243347] text-[#E8E6E0]'
                  : 'border-[#D4D2CA] bg-white text-[#2D2D2D]'
              }`}>
                Progress
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_HABITS.map((habit) => {
              const completion = getHabitCompletion(habit);
              return (
                <tr key={habit} className={isDark ? 'hover:bg-[#2D3E54]/30' : 'hover:bg-[#F8F7F4]'}>
                  <td className={`p-2 border-b text-sm sticky left-0 z-10 font-medium ${
                    isDark
                      ? 'border-[#3A4A5E] bg-[#243347] text-[#E8E6E0]'
                      : 'border-[#D4D2CA] bg-white text-[#2D2D2D]'
                  }`}>
                    {habit}
                  </td>
                  {monthData.habitData[habit].map((completed, dayIndex) => (
                    <td key={dayIndex} className={`p-2 border-b ${
                      isDark ? 'border-[#3A4A5E]' : 'border-[#D4D2CA]'
                    }`}>
                      <div className="flex justify-center">
                        <div
                          className={`w-3 h-3 rounded ${
                            completed
                              ? isDark
                                ? 'bg-[#7AA897]'
                                : 'bg-[#6B9B8C]'
                              : isDark
                                ? 'bg-[#2D3E54]'
                                : 'bg-[#E8E6E0]'
                          }`}
                        />
                      </div>
                    </td>
                  ))}
                  <td className={`p-2 border-b sticky right-0 z-10 ${
                    isDark
                      ? 'border-[#3A4A5E] bg-[#243347]'
                      : 'border-[#D4D2CA] bg-white'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className={`flex-1 rounded-full h-2 overflow-hidden ${
                        isDark ? 'bg-[#2D3E54]' : 'bg-[#E8E6E0]'
                      }`}>
                        <div
                          className={isDark ? 'bg-[#7AA897] h-full transition-all' : 'bg-[#6B9B8C] h-full transition-all'}
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium min-w-[40px] text-right ${
                        isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'
                      }`} style={{ fontFamily: 'var(--font-mono)' }}>
                        {Math.round(completion)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Monthly Trend Chart */}
      <div className={`rounded-xl p-6 transition-colors border ${
        isDark
          ? 'bg-[#243347] border-[#3A4A5E]'
          : 'bg-white border-[#D4D2CA]'
      }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
          Daily Completion Trend
        </h3>
        <ResponsiveContainer width="100%" height={300} key="monthly-chart-container">
          <AreaChart data={monthData.dailyCompletion} id="monthly-completion-chart">
            <defs>
              <linearGradient id="monthlyColorCompletion" x1="0" y1="0" x2="0" y2="1">
                <stop key="monthly-stop-1" offset="5%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0.2}/>
                <stop key="monthly-stop-2" offset="95%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid key="monthly-grid" strokeDasharray="3 3" stroke={isDark ? '#3A4A5E' : '#D4D2CA'} />
            <XAxis
              key="monthly-xaxis"
              dataKey="day"
              stroke={isDark ? '#9B9B9B' : '#6B6B6B'}
              fontSize={12}
              tickLine={false}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <YAxis
              key="monthly-yaxis"
              stroke={isDark ? '#9B9B9B' : '#6B6B6B'}
              fontSize={12}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <Tooltip
              key="monthly-tooltip"
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
              key="monthly-area"
              type="monotone"
              dataKey="completion"
              stroke={isDark ? '#7AA897' : '#6B9B8C'}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#monthlyColorCompletion)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
