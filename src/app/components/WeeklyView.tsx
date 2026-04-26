import { useEffect } from 'react';
import { CircularProgress } from './CircularProgress';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useDarkMode } from '../App';
import type { Habit } from '../App';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

// DayData stored in localStorage — no `date` field (always derivable from the key)
interface StoredDayData {
  habits: (Habit & { completed: boolean })[];
  tasks: Task[];
  notes: string;
  improvements: string;
  gratitude: string;
  mood: number;
  motivation: number;
}

function getWeekDays(baseDate: Date): Date[] {
  const days: Date[] = [];
  const startOfWeek = new Date(baseDate);
  startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  return days;
}

function getDefaultDay(habits: Habit[]): StoredDayData {
  return {
    habits: habits.map(h => ({ ...h, completed: false })),
    tasks: [],
    notes: '',
    improvements: '',
    gratitude: '',
    mood: 5,
    motivation: 5,
  };
}

interface WeeklyViewProps {
  habits: Habit[];
}

export function WeeklyView({ habits }: WeeklyViewProps) {
  const { isDark } = useDarkMode();
  const [currentDate, setCurrentDate] = useLocalStorage('habitos-week-current', new Date().toISOString());
  const [weekData, setWeekData] = useLocalStorage<Record<string, StoredDayData>>('habitos-week-data', {});

  const parsedDate = new Date(currentDate);
  const weekDays = getWeekDays(parsedDate);

  // When habits list changes, reconcile all stored day entries:
  // - add new habits (uncompleted), remove deleted ones, update renamed ones
  useEffect(() => {
    setWeekData(prev => {
      const keys = Object.keys(prev);
      if (keys.length === 0) return prev;
      const updated: Record<string, StoredDayData> = {};
      for (const key of keys) {
        const day = prev[key];
        updated[key] = {
          ...day,
          habits: habits.map(h => {
            const existing = day.habits.find(dh => dh.id === h.id);
            return existing ? { ...existing, name: h.name } : { ...h, completed: false };
          }),
        };
      }
      return updated;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits]);

  // Returns stored data for a day, or a fresh default (lazy — not written until first user action)
  const getDay = (dateKey: string): StoredDayData =>
    weekData[dateKey] ?? getDefaultDay(habits);

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

  const getWeekCompletion = () => {
    let total = 0, completed = 0;
    weekDays.forEach(day => {
      const key = day.toISOString().split('T')[0];
      const data = getDay(key);
      total += data.habits.length;
      completed += data.habits.filter(h => h.completed).length;
    });
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getDayCompletion = (data: StoredDayData) => {
    const total = data.habits.length;
    const completed = data.habits.filter(h => h.completed).length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const formatDateRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Mutation helpers — all use lazy init via `?? getDefaultDay(habits)`
  const toggleHabit = (dateKey: string, habitId: string) => {
    setWeekData(prev => {
      const day = prev[dateKey] ?? getDefaultDay(habits);
      return {
        ...prev,
        [dateKey]: {
          ...day,
          habits: day.habits.map(h => h.id === habitId ? { ...h, completed: !h.completed } : h),
        },
      };
    });
  };

  const toggleTask = (dateKey: string, taskId: string) => {
    setWeekData(prev => {
      const day = prev[dateKey] ?? getDefaultDay(habits);
      return {
        ...prev,
        [dateKey]: {
          ...day,
          tasks: day.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t),
        },
      };
    });
  };

  const addTask = (dateKey: string) => {
    setWeekData(prev => {
      const day = prev[dateKey] ?? getDefaultDay(habits);
      return {
        ...prev,
        [dateKey]: {
          ...day,
          tasks: [...day.tasks, { id: Date.now().toString(), text: '', completed: false }],
        },
      };
    });
  };

  const updateTask = (dateKey: string, taskId: string, text: string) => {
    setWeekData(prev => {
      const day = prev[dateKey] ?? getDefaultDay(habits);
      return {
        ...prev,
        [dateKey]: {
          ...day,
          tasks: day.tasks.map(t => t.id === taskId ? { ...t, text } : t),
        },
      };
    });
  };

  const deleteTask = (dateKey: string, taskId: string) => {
    setWeekData(prev => {
      const day = prev[dateKey] ?? getDefaultDay(habits);
      return {
        ...prev,
        [dateKey]: { ...day, tasks: day.tasks.filter(t => t.id !== taskId) },
      };
    });
  };

  const updateField = (dateKey: string, field: 'notes' | 'improvements' | 'gratitude', value: string) => {
    setWeekData(prev => {
      const day = prev[dateKey] ?? getDefaultDay(habits);
      return { ...prev, [dateKey]: { ...day, [field]: value } };
    });
  };

  const updateNumber = (dateKey: string, field: 'mood' | 'motivation', value: number) => {
    setWeekData(prev => {
      const day = prev[dateKey] ?? getDefaultDay(habits);
      return { ...prev, [dateKey]: { ...day, [field]: value } };
    });
  };

  return (
    <div className="p-6">
      {/* Week Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={previousWeek}
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
            {formatDateRange()}
          </span>
          <button
            onClick={nextWeek}
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
        <div className={`p-4 rounded-lg ${isDark ? 'bg-[#243347]' : 'bg-white'}`}
             style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <CircularProgress percentage={getWeekCompletion()} size={80} strokeWidth={6} />
        </div>
      </div>

      {/* 7-Day Scrollable Grid */}
      <div className="overflow-x-auto pb-4 -mx-6 px-6">
        <div className="flex gap-4 min-w-min pr-6">
          {weekDays.map((day) => {
            const dateKey = day.toISOString().split('T')[0];
            const dayData = getDay(dateKey);
            const dayCompletion = getDayCompletion(dayData);
            const completedCount = dayData.habits.filter(h => h.completed).length;

            return (
              <div
                key={dateKey}
                className={`rounded-xl p-5 flex flex-col gap-4 w-[320px] flex-shrink-0 transition-colors border ${
                  isDark
                    ? 'bg-[#243347] border-[#3A4A5E]'
                    : 'bg-white border-[#D4D2CA]'
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
                  <CircularProgress percentage={dayCompletion} size={100} strokeWidth={6} />
                </div>

                {/* Completion Count */}
                <div className={`text-center text-sm font-medium ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}
                     style={{ fontFamily: 'var(--font-mono)' }}>
                  {completedCount} / {dayData.habits.length} completed
                </div>

                {/* Habits Checklist */}
                <div className="space-y-2">
                  <div className={`font-medium text-sm ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
                    Habits
                  </div>
                  {dayData.habits.map((habit) => (
                    <label key={habit.id} className="flex items-center gap-2 cursor-pointer group">
                      <div
                        onClick={() => toggleHabit(dateKey, habit.id)}
                        className={`w-4 h-4 rounded border transition-all flex-shrink-0 ${
                          habit.completed
                            ? isDark ? 'bg-[#7AA897] border-[#7AA897]' : 'bg-[#6B9B8C] border-[#6B9B8C]'
                            : isDark ? 'border-[#3A4A5E] hover:border-[#7AA897]/50' : 'border-[#D4D2CA] hover:border-[#6B9B8C]/50'
                        }`}
                      />
                      <span className={`text-sm ${
                        habit.completed
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
                  <div className={`font-medium text-sm ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
                    Tasks
                  </div>
                  {dayData.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2">
                      <div
                        onClick={() => toggleTask(dateKey, task.id)}
                        className={`w-4 h-4 rounded border flex-shrink-0 transition-all cursor-pointer ${
                          task.completed
                            ? isDark ? 'bg-[#7AA897] border-[#7AA897]' : 'bg-[#6B9B8C] border-[#6B9B8C]'
                            : isDark ? 'border-[#3A4A5E] hover:border-[#7AA897]/50' : 'border-[#D4D2CA] hover:border-[#6B9B8C]/50'
                        }`}
                      />
                      <input
                        type="text"
                        value={task.text}
                        onChange={(e) => updateTask(dateKey, task.id, e.target.value)}
                        placeholder="Task..."
                        className={`flex-1 text-sm px-3 py-1.5 rounded-lg transition-all ${
                          isDark
                            ? 'bg-[#1A2332] text-[#E8E6E0] placeholder-[#9B9B9B] focus:border-b-2 focus:border-[#7AA897]'
                            : 'bg-[#F8F7F4] text-[#2D2D2D] placeholder-[#6B6B6B] focus:border-b-2 focus:border-[#6B9B8C]'
                        } border-0 focus:outline-none`}
                      />
                      <button
                        onClick={() => deleteTask(dateKey, task.id)}
                        className={`p-1 rounded-lg transition-colors ${
                          isDark
                            ? 'hover:bg-[#2D3E54] text-[#9B9B9B] hover:text-[#D66A6A]'
                            : 'hover:bg-[#E8E6E0] text-[#6B6B6B] hover:text-[#C84C4C]'
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
                    <Plus className="w-4 h-4" />
                    Add task
                  </button>
                </div>

                {/* Notes */}
                <div>
                  <label className={`font-medium text-sm block mb-1.5 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
                    Notes
                  </label>
                  <textarea
                    value={dayData.notes}
                    onChange={(e) => updateField(dateKey, 'notes', e.target.value)}
                    placeholder="Daily notes..."
                    className={`w-full text-sm px-3 py-2 rounded-lg transition-all resize-none ${
                      isDark
                        ? 'bg-[#1A2332] text-[#E8E6E0] placeholder-[#9B9B9B] focus:border-b-2 focus:border-[#7AA897]'
                        : 'bg-[#F8F7F4] text-[#2D2D2D] placeholder-[#6B6B6B] focus:border-b-2 focus:border-[#6B9B8C]'
                    } border-0 focus:outline-none`}
                    rows={2}
                  />
                </div>

                {/* Improvements */}
                <div>
                  <label className={`font-medium text-sm block mb-1.5 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
                    Improvements
                  </label>
                  <textarea
                    value={dayData.improvements}
                    onChange={(e) => updateField(dateKey, 'improvements', e.target.value)}
                    placeholder="What can I improve?"
                    className={`w-full text-sm px-3 py-2 rounded-lg transition-all resize-none ${
                      isDark
                        ? 'bg-[#1A2332] text-[#E8E6E0] placeholder-[#9B9B9B] focus:border-b-2 focus:border-[#7AA897]'
                        : 'bg-[#F8F7F4] text-[#2D2D2D] placeholder-[#6B6B6B] focus:border-b-2 focus:border-[#6B9B8C]'
                    } border-0 focus:outline-none`}
                    rows={2}
                  />
                </div>

                {/* Gratitude */}
                <div>
                  <label className={`font-medium text-sm block mb-1.5 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
                    Gratitude
                  </label>
                  <textarea
                    value={dayData.gratitude}
                    onChange={(e) => updateField(dateKey, 'gratitude', e.target.value)}
                    placeholder="I'm grateful for..."
                    className={`w-full text-sm px-3 py-2 rounded-lg transition-all resize-none ${
                      isDark
                        ? 'bg-[#1A2332] text-[#E8E6E0] placeholder-[#9B9B9B] focus:border-b-2 focus:border-[#7AA897]'
                        : 'bg-[#F8F7F4] text-[#2D2D2D] placeholder-[#6B6B6B] focus:border-b-2 focus:border-[#6B9B8C]'
                    } border-0 focus:outline-none`}
                    rows={2}
                  />
                </div>

                {/* Mood & Motivation */}
                <div className="grid grid-cols-2 gap-3">
                  {(['mood', 'motivation'] as const).map((field) => (
                    <div key={field}>
                      <label className={`font-medium text-sm block mb-1.5 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={dayData[field]}
                        onChange={(e) => updateNumber(dateKey, field, parseInt(e.target.value) || 5)}
                        className={`w-full text-sm px-3 py-2 rounded-lg transition-all ${
                          isDark
                            ? 'bg-[#1A2332] text-[#E8E6E0] focus:border-b-2 focus:border-[#7AA897]'
                            : 'bg-[#F8F7F4] text-[#2D2D2D] focus:border-b-2 focus:border-[#6B9B8C]'
                        } border-0 focus:outline-none`}
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
