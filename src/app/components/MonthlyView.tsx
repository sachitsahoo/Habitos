import { useState } from 'react';
import { CircularProgress } from './CircularProgress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '../context/DarkModeContext';
import { useHabitLogs } from '../../hooks/useHabitLogs';
import type { Habit } from '../App';

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

interface MonthlyViewProps { habits: Habit[] }

export function MonthlyView({ habits }: MonthlyViewProps) {
  const { isDark } = useDarkMode();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);

  const startDate = toDateKey(year, month, 1);
  const endDate = toDateKey(year, month, daysInMonth);

  const { completions } = useHabitLogs(startDate, endDate);

  const isCompleted = (day: number, habitId: string): boolean =>
    completions[toDateKey(year, month, day)]?.[habitId] ?? false;

  const getDayCompletion = (day: number): number => {
    if (habits.length === 0) return 0;
    return (habits.filter(h => isCompleted(day, h.id)).length / habits.length) * 100;
  };

  const getMonthCompletion = (): number => {
    if (daysInMonth === 0 || habits.length === 0) return 0;
    const sum = Array.from({ length: daysInMonth }, (_, i) => getDayCompletion(i + 1))
      .reduce((a, b) => a + b, 0);
    return sum / daysInMonth;
  };

  const getCurrentStreak = (): number => {
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    const startDay = isCurrentMonth ? today.getDate() : daysInMonth;
    let streak = 0;
    for (let day = startDay; day >= 1; day--) {
      if (getDayCompletion(day) >= 80) streak++;
      else break;
    }
    return streak;
  };

  const getBestDay = (): number | string => {
    let best = -1, bestDayNum = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const c = getDayCompletion(day);
      if (c > best) { best = c; bestDayNum = day; }
    }
    return best > 0 ? bestDayNum : '-';
  };

  const getHabitMonthCompletion = (habitId: string): number => {
    const completed = Array.from({ length: daysInMonth }, (_, i) =>
      isCompleted(i + 1, habitId)
    ).filter(Boolean).length;
    return (completed / daysInMonth) * 100;
  };

  const dailyCompletionData = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    completion: getDayCompletion(i + 1),
  }));

  const previousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const cardClass = `rounded-xl transition-colors border ${isDark ? 'bg-[#2A3D55] border-[#4A5E72]' : 'bg-white border-[#D4D2CA]'}`;

  return (
    <div className="p-6">
      {/* Month Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={previousMonth}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-[#2A3D55] hover:bg-[#354D67] text-[#E8E6E0]' : 'bg-white hover:bg-[#E8E6E0] text-[#2D2D2D]'}`}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className={`font-semibold text-xl ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-[#2A3D55] hover:bg-[#354D67] text-[#E8E6E0]' : 'bg-white hover:bg-[#E8E6E0] text-[#2D2D2D]'}`}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className={`p-4 rounded-lg ${isDark ? 'bg-[#2A3D55]' : 'bg-white'}`}
             style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <CircularProgress percentage={getMonthCompletion()} size={80} strokeWidth={6} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Month Completion', value: `${Math.round(getMonthCompletion())}%` },
          { label: 'Current Streak',   value: getCurrentStreak() },
          { label: 'Best Day',         value: getBestDay() },
        ].map(({ label, value }) => (
          <div key={label} className={`${cardClass} p-6`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div className={`text-3xl font-semibold ${isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'}`}
                 style={{ fontFamily: 'var(--font-mono)' }}>
              {value}
            </div>
            <div className={`text-sm mt-1 ${isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]'}`}>{label}</div>
          </div>
        ))}
      </div>

      {/* Habit Completion Matrix */}
      <div className={`${cardClass} p-6 mb-6`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
          Habit Completion Matrix
        </h3>
        {habits.length === 0 ? (
          <p className={`text-sm py-4 ${isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]'}`}>
            No habits yet. Add habits to track them here.
          </p>
        ) : (
          <>
            {/* Mobile: per-habit cards */}
            <div className="flex flex-col gap-4 sm:hidden">
              {habits.map((habit) => {
                const completion = getHabitMonthCompletion(habit.id);
                const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                const rows: number[][] = [];
                for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
                return (
                  <div key={habit.id} className={`rounded-xl p-4 border ${isDark ? 'bg-[#1A2332] border-[#4A5E72]' : 'bg-[#F8F7F4] border-[#D4D2CA]'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-sm font-medium ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>{habit.name}</span>
                      <span className={`text-sm font-semibold ${isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'}`}
                            style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(completion)}%</span>
                    </div>
                    <div className="flex flex-col gap-1 mb-3">
                      {rows.map((row, ri) => (
                        <div key={ri} className="flex gap-1">
                          {row.map(day => (
                            <div key={day} className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-medium ${
                              isCompleted(day, habit.id)
                                ? isDark ? 'bg-[#7AA897] text-[#1A2332]' : 'bg-[#6B9B8C] text-white'
                                : isDark ? 'bg-[#354D67] text-[#ABABAB]' : 'bg-[#E8E6E0] text-[#6B6B6B]'
                            }`} style={{ fontFamily: 'var(--font-mono)' }}>{day}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className={`rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-[#354D67]' : 'bg-[#E8E6E0]'}`}>
                      <div className={`h-full transition-all rounded-full ${isDark ? 'bg-[#7AA897]' : 'bg-[#6B9B8C]'}`}
                           style={{ width: `${completion}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: scrollable table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={`text-left p-2 border-b font-medium text-sm sticky left-0 z-10 ${
                      isDark ? 'border-[#4A5E72] bg-[#2A3D55] text-[#E8E6E0]' : 'border-[#D4D2CA] bg-white text-[#2D2D2D]'
                    }`}>Habit</th>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <th key={i} className={`text-center p-2 border-b font-medium text-xs min-w-[32px] ${
                        isDark ? 'border-[#4A5E72] text-[#ABABAB]' : 'border-[#D4D2CA] text-[#6B6B6B]'
                      }`}>{i + 1}</th>
                    ))}
                    <th className={`p-2 border-b font-medium text-sm sticky right-0 z-10 ${
                      isDark ? 'border-[#4A5E72] bg-[#2A3D55] text-[#E8E6E0]' : 'border-[#D4D2CA] bg-white text-[#2D2D2D]'
                    }`}>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {habits.map((habit) => {
                    const completion = getHabitMonthCompletion(habit.id);
                    return (
                      <tr key={habit.id} className={isDark ? 'hover:bg-[#354D67]/30' : 'hover:bg-[#F8F7F4]'}>
                        <td className={`p-2 border-b text-sm sticky left-0 z-10 font-medium ${
                          isDark ? 'border-[#4A5E72] bg-[#2A3D55] text-[#E8E6E0]' : 'border-[#D4D2CA] bg-white text-[#2D2D2D]'
                        }`}>{habit.name}</td>
                        {Array.from({ length: daysInMonth }, (_, i) => (
                          <td key={i} className={`p-2 border-b ${isDark ? 'border-[#4A5E72]' : 'border-[#D4D2CA]'}`}>
                            <div className="flex justify-center">
                              <div className={`w-3 h-3 rounded ${
                                isCompleted(i + 1, habit.id)
                                  ? isDark ? 'bg-[#7AA897]' : 'bg-[#6B9B8C]'
                                  : isDark ? 'bg-[#354D67]' : 'bg-[#E8E6E0]'
                              }`} />
                            </div>
                          </td>
                        ))}
                        <td className={`p-2 border-b sticky right-0 z-10 ${
                          isDark ? 'border-[#4A5E72] bg-[#2A3D55]' : 'border-[#D4D2CA] bg-white'
                        }`}>
                          <div className="flex items-center gap-2">
                            <div className={`flex-1 rounded-full h-2 overflow-hidden ${isDark ? 'bg-[#354D67]' : 'bg-[#E8E6E0]'}`}>
                              <div className={`h-full transition-all ${isDark ? 'bg-[#7AA897]' : 'bg-[#6B9B8C]'}`}
                                   style={{ width: `${completion}%` }} />
                            </div>
                            <span className={`text-xs font-medium min-w-[40px] text-right ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}
                                  style={{ fontFamily: 'var(--font-mono)' }}>
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
          </>
        )}
      </div>

      {/* Monthly Trend Chart */}
      <div className={`${cardClass} p-6`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
          Daily Completion Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyCompletionData}>
            <defs>
              <linearGradient id="monthlyColorCompletion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={isDark ? '#7AA897' : '#6B9B8C'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4A5E72' : '#D4D2CA'} />
            <XAxis dataKey="day" stroke={isDark ? '#ABABAB' : '#6B6B6B'} fontSize={12} tickLine={false}
                   style={{ fontFamily: 'var(--font-mono)' }} />
            <YAxis stroke={isDark ? '#ABABAB' : '#6B6B6B'} fontSize={12} tickLine={false}
                   domain={[0, 100]} tickFormatter={(v) => `${v}%`} style={{ fontFamily: 'var(--font-mono)' }} />
            <Tooltip
              contentStyle={{ backgroundColor: isDark ? '#2A3D55' : 'white', border: `1px solid ${isDark ? '#4A5E72' : '#D4D2CA'}`, borderRadius: '12px', color: isDark ? '#E8E6E0' : '#2D2D2D', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Completion']}
            />
            <Area type="monotone" dataKey="completion" stroke={isDark ? '#7AA897' : '#6B9B8C'}
                  strokeWidth={2} fillOpacity={1} fill="url(#monthlyColorCompletion)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
