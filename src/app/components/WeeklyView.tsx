import { useState, useEffect, useRef, useLayoutEffect } from 'react';

function AutoResizeTextarea({ value, onChange, placeholder, maxLength, className }: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={1}
      className={className}
      style={{ overflow: 'hidden', resize: 'none' }}
    />
  );
}
import { CircularProgress } from './CircularProgress';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';
import { useHabitLogs } from '../../hooks/useHabitLogs';
import { useTasks } from '../../hooks/useTasks';
import { useDailyLogs } from '../../hooks/useDailyLogs';
import { useWindowWidth } from '../../hooks/useWindowWidth';
import type { Habit } from '../App';

interface WeeklyViewProps {
  habits: Habit[];
}

function getWeekDays(baseDate: Date): Date[] {
  const startOfWeek = new Date(baseDate);
  startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function WeeklyView({ habits }: WeeklyViewProps) {
  const { isDark } = useDarkMode();
  const width = useWindowWidth();
  const daysToShow = width < 640 ? 1 : width < 1024 ? 2 : 3;

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const weekDays = getWeekDays(currentDate);
  const startDate = toDateKey(weekDays[0]);
  const endDate   = toDateKey(weekDays[6]);

  // Start on the group that contains today (or 0 if viewing another week)
  const [groupStart, setGroupStart] = useState(() => {
    const todayKey = toDateKey(new Date());
    const idx = weekDays.findIndex(d => toDateKey(d) === todayKey);
    if (idx < 0) return 0;
    return Math.min(Math.floor(idx / daysToShow) * daysToShow, Math.max(0, 7 - daysToShow));
  });

  // Clamp groupStart whenever daysToShow changes (window resize)
  useEffect(() => {
    setGroupStart(prev => Math.min(prev, Math.max(0, 7 - daysToShow)));
  }, [daysToShow]);

  const { completions, toggleLog } = useHabitLogs(startDate, endDate);
  const { tasksByDate, addTask, updateTask, toggleTask, deleteTask } = useTasks(startDate, endDate);
  const { logsByDate, updateLog } = useDailyLogs(startDate, endDate);

  const visibleDays = weekDays.slice(groupStart, groupStart + daysToShow);
  const canGoPrev   = groupStart > 0;
  const canGoNext   = groupStart + daysToShow < 7;

  const goPrev = () => setGroupStart(prev => Math.max(0, prev - daysToShow));
  const goNext = () => setGroupStart(prev => Math.min(7 - daysToShow, prev + daysToShow));

  const previousWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
    setGroupStart(0);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
    setGroupStart(0);
  };

  const formatDateRange = () => {
    const start = weekDays[0];
    const end   = weekDays[6];
    // Shorter on mobile (no year), full on desktop
    if (width < 640) {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getWeekCompletion = () => {
    let total = 0, done = 0;
    for (const day of weekDays) {
      const dayCompletions = completions[toDateKey(day)] ?? {};
      total += habits.length;
      done  += habits.filter(h => dayCompletions[h.id]).length;
    }
    return total > 0 ? (done / total) * 100 : 0;
  };

  // Shared style helpers
  const navBtnClass = (active: boolean) =>
    `p-2 rounded-lg transition-colors flex-shrink-0 ${
      active
        ? isDark
          ? 'bg-[#2A3D55] hover:bg-[#354D67] text-[#E8E6E0]'
          : 'bg-white hover:bg-[#E8E6E0] text-[#2D2D2D]'
        : `opacity-20 cursor-default ${isDark ? 'bg-[#2A3D55] text-[#ABABAB]' : 'bg-white text-[#ABABAB]'}`
    }`;

  const inputClass = (extra = '') =>
    `w-full px-3 py-2 rounded-lg resize-none border-0 focus:outline-none transition-all ${
      daysToShow === 1 ? 'text-base' : 'text-sm'
    } ${
      isDark
        ? 'bg-[#1A2332] text-[#E8E6E0] placeholder-[#ABABAB] focus:border-b-2 focus:border-[#7AA897]'
        : 'bg-[#F8F7F4] text-[#2D2D2D] placeholder-[#6B6B6B] focus:border-b-2 focus:border-[#6B9B8C]'
    } ${extra}`;

  const checkboxClass = (checked: boolean) =>
    `w-4 h-4 rounded border flex-shrink-0 transition-all cursor-pointer ${
      checked
        ? isDark ? 'bg-[#7AA897] border-[#7AA897]' : 'bg-[#6B9B8C] border-[#6B9B8C]'
        : isDark ? 'border-[#4A5E72] hover:border-[#7AA897]/50' : 'border-[#D4D2CA] hover:border-[#6B9B8C]/50'
    }`;

  return (
    <div className="p-4 sm:p-6">
      {/* Week Navigation */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={previousWeek}
            className={navBtnClass(true)}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className={`font-semibold text-sm sm:text-xl ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
            {formatDateRange()}
          </span>
          <button
            onClick={nextWeek}
            className={navBtnClass(true)}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className={`p-3 sm:p-4 rounded-lg ${isDark ? 'bg-[#2A3D55]' : 'bg-white'}`}
             style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <CircularProgress percentage={getWeekCompletion()} size={width < 640 ? 48 : 60} strokeWidth={5} />
        </div>
      </div>

      {/* Day group: [← ] [cards] [ →] */}
      <div className="flex items-start gap-2">

        {/* Prev-group arrow */}
        <button
          onClick={goPrev}
          disabled={!canGoPrev}
          className={`mt-5 ${navBtnClass(canGoPrev)}`}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Visible day cards */}
        <div className="flex flex-1 gap-3 sm:gap-4 min-w-0">
          {visibleDays.map((day) => {
            const dateKey        = toDateKey(day);
            const dayCompletions = completions[dateKey] ?? {};
            const dayTasks       = tasksByDate[dateKey] ?? [];
            const dayLog         = logsByDate[dateKey];
            const completedCount = habits.filter(h => dayCompletions[h.id]).length;
            const dayPct         = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;
            const isToday        = dateKey === toDateKey(new Date());

            return (
              <div
                key={dateKey}
                className={`rounded-xl p-4 sm:p-5 flex flex-col gap-4 flex-1 min-w-0 transition-colors border ${
                  isToday
                    ? isDark
                      ? 'bg-[#2A3D55] border-[#7AA897]/60'
                      : 'bg-white border-[#6B9B8C]/60'
                    : isDark
                    ? 'bg-[#2A3D55] border-[#4A5E72]'
                    : 'bg-white border-[#D4D2CA]'
                }`}
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                {/* Day Header */}
                <div className={`text-center pb-3 border-b ${isDark ? 'border-[#4A5E72]' : 'border-[#D4D2CA]'}`}>
                  <div className={`font-semibold ${daysToShow === 1 ? 'text-2xl' : 'text-lg'} ${
                    isToday
                      ? isDark ? 'text-[#7AA897]' : 'text-[#6B9B8C]'
                      : isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'
                  }`}>
                    {day.toLocaleDateString('en-US', { weekday: daysToShow === 1 ? 'long' : 'short' })}
                    {isToday && <span className={`ml-1.5 font-normal opacity-70 ${daysToShow === 1 ? 'text-sm' : 'text-xs'}`}>Today</span>}
                  </div>
                  <div className={`${daysToShow === 1 ? 'text-base' : 'text-sm'} ${isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]'}`}>
                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {/* Progress Ring */}
                <div className="flex justify-center">
                  <CircularProgress percentage={dayPct} size={daysToShow === 1 ? 120 : daysToShow === 2 ? 100 : 80} strokeWidth={daysToShow === 1 ? 7 : 6} />
                </div>

                {/* Completion Count */}
                <div className={`text-center font-medium ${daysToShow === 1 ? 'text-base' : 'text-sm'} ${isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]'}`}
                     style={{ fontFamily: 'var(--font-mono)' }}>
                  {completedCount} / {habits.length} completed
                </div>

                {/* Habits Checklist */}
                <div className="space-y-2">
                  <div className={`uppercase tracking-wider text-xs font-semibold ${isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]'}`}>Habits</div>
                  {habits.length === 0 && (
                    <div className={`text-xs ${isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]'}`}>
                      No habits yet. Add some in the Habits tab.
                    </div>
                  )}
                  {habits.map((habit) => (
                    <label key={habit.id} className="flex items-center gap-2 cursor-pointer">
                      <div onClick={() => toggleLog(dateKey, habit.id)} className={checkboxClass(!!dayCompletions[habit.id])} />
                      <span className={`${daysToShow === 1 ? 'text-base' : 'text-sm'} ${
                        dayCompletions[habit.id]
                          ? isDark ? 'line-through text-[#ABABAB]' : 'line-through text-[#6B6B6B]'
                          : isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'
                      }`}>
                        {habit.name}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Tasks */}
                <div className="space-y-2">
                  <div className={`uppercase tracking-wider text-xs font-semibold ${isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]'}`}>Tasks</div>
                  {dayTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2">
                      <div onClick={() => toggleTask(dateKey, task.id)} className={checkboxClass(task.completed)} />
                      <input
                        type="text"
                        value={task.text}
                        onChange={(e) => updateTask(dateKey, task.id, e.target.value)}
                        placeholder="Task..."
                        maxLength={200}
                        className={inputClass('flex-1 py-1.5')}
                      />
                      <button
                        onClick={() => deleteTask(dateKey, task.id)}
                        className={`p-1 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-[#354D67] text-[#ABABAB] hover:text-[#D66A6A]' : 'hover:bg-[#E8E6E0] text-[#6B6B6B] hover:text-[#C84C4C]'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addTask(dateKey)}
                    className={`flex items-center gap-1 font-medium transition-colors ${
                      daysToShow === 1 ? 'text-base' : 'text-sm'
                    } ${isDark ? 'text-[#7AA897] hover:text-[#94BDAC]' : 'text-[#6B9B8C] hover:text-[#5A8B7D]'}`}
                  >
                    <Plus className={daysToShow === 1 ? 'w-5 h-5' : 'w-4 h-4'} /> Add task
                  </button>
                </div>

                {/* Notes / Improvements / Gratitude */}
                {(['notes', 'improvements', 'gratitude'] as const).map((field) => (
                  <div key={field}>
                    <label className={`uppercase tracking-wider text-xs font-semibold block mb-1.5 ${isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]'}`}>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <AutoResizeTextarea
                      value={dayLog?.[field] ?? ''}
                      onChange={(val) => updateLog(dateKey, field, val)}
                      placeholder={
                        field === 'notes' ? 'Daily notes…'
                        : field === 'improvements' ? 'What can I improve?'
                        : 'I\'m grateful for…'
                      }
                      maxLength={2000}
                      className={inputClass()}
                    />
                  </div>
                ))}

                {/* Mood & Motivation */}
                <div className="grid grid-cols-2 gap-3">
                  {(['mood', 'motivation'] as const).map((field) => (
                    <div key={field}>
                      <label className={`uppercase tracking-wider text-xs font-semibold block mb-1.5 ${isDark ? 'text-[#ABABAB]' : 'text-[#6B6B6B]'}`}>
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={dayLog?.[field] ?? 5}
                        onKeyDown={(e) => {
                          if (e.key >= '0' && e.key <= '9') {
                            e.preventDefault();
                            const digit = parseInt(e.key);
                            const current = dayLog?.[field] ?? 5;
                            if (current === 1 && digit === 0) updateLog(dateKey, field, 10);
                            else if (digit >= 1) updateLog(dateKey, field, digit);
                          } else if (!['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        readOnly
                        className={inputClass('cursor-default')}
                        style={{ fontFamily: 'var(--font-mono)' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Next-group arrow */}
        <button
          onClick={goNext}
          disabled={!canGoNext}
          className={`mt-5 ${navBtnClass(canGoNext)}`}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
