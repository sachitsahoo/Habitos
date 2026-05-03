import { useState } from 'react';
import { CircularProgress } from './CircularProgress';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';
import { useHabitLogs } from '../../hooks/useHabitLogs';
import { useTasks } from '../../hooks/useTasks';
import { useDailyLogs } from '../../hooks/useDailyLogs';
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
  return d.toISOString().split('T')[0];
}

export function WeeklyView({ habits }: WeeklyViewProps) {
  const { isDark } = useDarkMode();
  const [currentDate, setCurrentDate] = useState(new Date().toISOString());

  const parsedDate = new Date(currentDate);
  const weekDays = getWeekDays(parsedDate);
  const startDate = toDateKey(weekDays[0]);
  const endDate = toDateKey(weekDays[6]);

  const { completions, toggleLog } = useHabitLogs(startDate, endDate);
  const { tasksByDate, addTask, updateTask, toggleTask, deleteTask } = useTasks(startDate, endDate);
  const { logsByDate, updateLog } = useDailyLogs(startDate, endDate);

  const previousWeek = () => {
    const d = new Date(parsedDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d.toISOString());
  };

  const nextWeek = () => {
    const d = new Date(parsedDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d.toISOString());
  };

  const formatDateRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getWeekCompletion = () => {
    let total = 0, done = 0;
    for (const day of weekDays) {
      const dayCompletions = completions[toDateKey(day)] ?? {};
      total += habits.length;
      done += habits.filter(h => dayCompletions[h.id]).length;
    }
    return total > 0 ? (done / total) * 100 : 0;
  };

  const inputClass = (extra = '') =>
    `w-full text-sm px-3 py-2 rounded-lg resize-none border-0 focus:outline-none transition-all ${
      isDark
        ? 'bg-[#1A2332] text-[#E8E6E0] placeholder-[#9B9B9B] focus:border-b-2 focus:border-[#7AA897]'
        : 'bg-[#F8F7F4] text-[#2D2D2D] placeholder-[#6B6B6B] focus:border-b-2 focus:border-[#6B9B8C]'
    } ${extra}`;

  const checkboxClass = (checked: boolean) =>
    `w-4 h-4 rounded border flex-shrink-0 transition-all cursor-pointer ${
      checked
        ? isDark ? 'bg-[#7AA897] border-[#7AA897]' : 'bg-[#6B9B8C] border-[#6B9B8C]'
        : isDark ? 'border-[#3A4A5E] hover:border-[#7AA897]/50' : 'border-[#D4D2CA] hover:border-[#6B9B8C]/50'
    }`;

  return (
    <div className="p-6">
      {/* Week Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={previousWeek}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'bg-[#243347] hover:bg-[#2D3E54] text-[#E8E6E0]' : 'bg-white hover:bg-[#E8E6E0] text-[#2D2D2D]'
            }`}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className={`font-semibold text-xl ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
            {formatDateRange()}
          </span>
          <button
            onClick={nextWeek}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'bg-[#243347] hover:bg-[#2D3E54] text-[#E8E6E0]' : 'bg-white hover:bg-[#E8E6E0] text-[#2D2D2D]'
            }`}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className={`p-4 rounded-lg ${isDark ? 'bg-[#243347]' : 'bg-white'}`}
             style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <CircularProgress percentage={getWeekCompletion()} size={80} strokeWidth={6} />
        </div>
      </div>

      {/* 7-Day Scrollable Grid */}
      <div className="overflow-x-auto pb-4 -mx-6 px-6">
        <div className="flex gap-4 min-w-min pr-6">
          {weekDays.map((day) => {
            const dateKey = toDateKey(day);
            const dayCompletions = completions[dateKey] ?? {};
            const dayTasks = tasksByDate[dateKey] ?? [];
            const dayLog = logsByDate[dateKey];
            const completedCount = habits.filter(h => dayCompletions[h.id]).length;
            const dayPct = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;

            return (
              <div
                key={dateKey}
                className={`rounded-xl p-5 flex flex-col gap-4 w-[320px] flex-shrink-0 transition-colors border ${
                  isDark ? 'bg-[#243347] border-[#3A4A5E]' : 'bg-white border-[#D4D2CA]'
                }`}
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                {/* Day Header */}
                <div className={`text-center pb-3 border-b ${isDark ? 'border-[#3A4A5E]' : 'border-[#D4D2CA]'}`}>
                  <div className={`font-semibold text-lg ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>

                {/* Progress Ring */}
                <div className="flex justify-center">
                  <CircularProgress percentage={dayPct} size={100} strokeWidth={6} />
                </div>

                {/* Completion Count */}
                <div className={`text-center text-sm font-medium ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}
                     style={{ fontFamily: 'var(--font-mono)' }}>
                  {completedCount} / {habits.length} completed
                </div>

                {/* Habits Checklist */}
                <div className="space-y-2">
                  <div className={`font-medium text-sm ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>Habits</div>
                  {habits.length === 0 && (
                    <div className={`text-xs ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
                      No habits yet — add some in the Habits tab.
                    </div>
                  )}
                  {habits.map((habit) => (
                    <label key={habit.id} className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => toggleLog(dateKey, habit.id)}
                        className={checkboxClass(!!dayCompletions[habit.id])}
                      />
                      <span className={`text-sm ${
                        dayCompletions[habit.id]
                          ? isDark ? 'line-through text-[#9B9B9B]' : 'line-through text-[#6B6B6B]'
                          : isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'
                      }`}>
                        {habit.name}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Tasks */}
                <div className="space-y-2">
                  <div className={`font-medium text-sm ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>Tasks</div>
                  {dayTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2">
                      <div onClick={() => toggleTask(dateKey, task.id)} className={checkboxClass(task.completed)} />
                      <input
                        type="text"
                        value={task.text}
                        onChange={(e) => updateTask(dateKey, task.id, e.target.value)}
                        placeholder="Task..."
                        className={inputClass('flex-1 py-1.5')}
                      />
                      <button
                        onClick={() => deleteTask(dateKey, task.id)}
                        className={`p-1 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-[#2D3E54] text-[#9B9B9B] hover:text-[#D66A6A]' : 'hover:bg-[#E8E6E0] text-[#6B6B6B] hover:text-[#C84C4C]'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addTask(dateKey)}
                    className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                      isDark ? 'text-[#7AA897] hover:text-[#94BDAC]' : 'text-[#6B9B8C] hover:text-[#5A8B7D]'
                    }`}
                  >
                    <Plus className="w-4 h-4" /> Add task
                  </button>
                </div>

                {/* Notes / Improvements / Gratitude */}
                {(['notes', 'improvements', 'gratitude'] as const).map((field) => (
                  <div key={field}>
                    <label className={`font-medium text-sm block mb-1.5 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <textarea
                      value={dayLog?.[field] ?? ''}
                      onChange={(e) => updateLog(dateKey, field, e.target.value)}
                      placeholder={
                        field === 'notes' ? 'Daily notes…'
                        : field === 'improvements' ? 'What can I improve?'
                        : 'I\'m grateful for…'
                      }
                      className={inputClass()}
                      rows={2}
                    />
                  </div>
                ))}

                {/* Mood & Motivation */}
                <div className="grid grid-cols-2 gap-3">
                  {(['mood', 'motivation'] as const).map((field) => (
                    <div key={field}>
                      <label className={`font-medium text-sm block mb-1.5 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
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
      </div>
    </div>
  );
}
