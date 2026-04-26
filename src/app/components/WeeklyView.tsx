import { useState } from 'react';
import { CircularProgress } from './CircularProgress';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useDarkMode } from '../App';

interface Habit {
  id: string;
  name: string;
  completed: boolean;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface DayData {
  date: Date;
  habits: Habit[];
  tasks: Task[];
  notes: string;
  improvements: string;
  gratitude: string;
  mood: number;
  motivation: number;
}

const MOCK_HABITS = [
  { id: '1', name: 'Morning Exercise' },
  { id: '2', name: 'Read 30 minutes' },
  { id: '3', name: 'Meditate' },
  { id: '4', name: 'Drink 8 glasses of water' },
  { id: '5', name: 'No social media before noon' }
];

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

export function WeeklyView() {
  const { isDark } = useDarkMode();
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekDays = getWeekDays(currentDate);

  const [weekData, setWeekData] = useState<Record<string, DayData>>(() => {
    const data: Record<string, DayData> = {};
    weekDays.forEach((date) => {
      const key = date.toISOString().split('T')[0];
      data[key] = {
        date,
        habits: MOCK_HABITS.map(h => ({ ...h, completed: Math.random() > 0.5 })),
        tasks: [
          { id: '1', text: 'Review project proposal', completed: Math.random() > 0.5 },
          { id: '2', text: 'Call dentist', completed: Math.random() > 0.5 }
        ],
        notes: '',
        improvements: '',
        gratitude: '',
        mood: Math.floor(Math.random() * 5) + 6,
        motivation: Math.floor(Math.random() * 5) + 6
      };
    });
    return data;
  });

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const getWeekCompletion = () => {
    let totalHabits = 0;
    let completedHabits = 0;
    Object.values(weekData).forEach(day => {
      totalHabits += day.habits.length;
      completedHabits += day.habits.filter(h => h.completed).length;
    });
    return totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
  };

  const getDayCompletion = (dayData: DayData) => {
    const total = dayData.habits.length;
    const completed = dayData.habits.filter(h => h.completed).length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const formatDateRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const toggleHabit = (dateKey: string, habitId: string) => {
    setWeekData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        habits: prev[dateKey].habits.map(h =>
          h.id === habitId ? { ...h, completed: !h.completed } : h
        )
      }
    }));
  };

  const toggleTask = (dateKey: string, taskId: string) => {
    setWeekData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        tasks: prev[dateKey].tasks.map(t =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
      }
    }));
  };

  const addTask = (dateKey: string) => {
    setWeekData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        tasks: [
          ...prev[dateKey].tasks,
          { id: Date.now().toString(), text: '', completed: false }
        ]
      }
    }));
  };

  const updateTask = (dateKey: string, taskId: string, text: string) => {
    setWeekData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        tasks: prev[dateKey].tasks.map(t =>
          t.id === taskId ? { ...t, text } : t
        )
      }
    }));
  };

  const deleteTask = (dateKey: string, taskId: string) => {
    setWeekData(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        tasks: prev[dateKey].tasks.filter(t => t.id !== taskId)
      }
    }));
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
        <div className={`p-4 rounded-lg ${
          isDark ? 'bg-[#243347]' : 'bg-white'
        }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <CircularProgress percentage={getWeekCompletion()} size={80} strokeWidth={6} />
        </div>
      </div>

      {/* 7-Day Scrollable Grid */}
      <div className="overflow-x-auto pb-4 -mx-6 px-6">
        <div className="flex gap-4 min-w-min pr-6">
          {weekDays.map((day) => {
            const dateKey = day.toISOString().split('T')[0];
            const dayData = weekData[dateKey];
            if (!dayData) return null;

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
                <div className={`text-center pb-3 border-b ${
                  isDark ? 'border-[#3A4A5E]' : 'border-[#D4D2CA]'
                }`}>
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
                <div className={`text-center text-sm font-medium ${
                  isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'
                }`} style={{ fontFamily: 'var(--font-mono)' }}>
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
                            ? isDark
                              ? 'bg-[#7AA897] border-[#7AA897]'
                              : 'bg-[#6B9B8C] border-[#6B9B8C]'
                            : isDark
                              ? 'border-[#3A4A5E] hover:border-[#7AA897]/50'
                              : 'border-[#D4D2CA] hover:border-[#6B9B8C]/50'
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
                            ? isDark
                              ? 'bg-[#7AA897] border-[#7AA897]'
                              : 'bg-[#6B9B8C] border-[#6B9B8C]'
                            : isDark
                              ? 'border-[#3A4A5E] hover:border-[#7AA897]/50'
                              : 'border-[#D4D2CA] hover:border-[#6B9B8C]/50'
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
                      isDark
                        ? 'text-[#7AA897] hover:text-[#94BDAC]'
                        : 'text-[#6B9B8C] hover:text-[#5A8B7D]'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Add task
                  </button>
                </div>

                {/* Notes */}
                <div>
                  <label className={`font-medium text-sm block mb-1.5 ${
                    isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'
                  }`}>
                    Notes
                  </label>
                  <textarea
                    value={dayData.notes}
                    onChange={(e) => setWeekData(prev => ({
                      ...prev,
                      [dateKey]: { ...prev[dateKey], notes: e.target.value }
                    }))}
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
                  <label className={`font-medium text-sm block mb-1.5 ${
                    isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'
                  }`}>
                    Improvements
                  </label>
                  <textarea
                    value={dayData.improvements}
                    onChange={(e) => setWeekData(prev => ({
                      ...prev,
                      [dateKey]: { ...prev[dateKey], improvements: e.target.value }
                    }))}
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
                  <label className={`font-medium text-sm block mb-1.5 ${
                    isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'
                  }`}>
                    Gratitude
                  </label>
                  <textarea
                    value={dayData.gratitude}
                    onChange={(e) => setWeekData(prev => ({
                      ...prev,
                      [dateKey]: { ...prev[dateKey], gratitude: e.target.value }
                    }))}
                    placeholder="I'm grateful for..."
                    className={`w-full text-sm px-3 py-2 rounded-lg transition-all resize-none ${
                      isDark
                        ? 'bg-[#1A2332] text-[#E8E6E0] placeholder-[#9B9B9B] focus:border-b-2 focus:border-[#7AA897]'
                        : 'bg-[#F8F7F4] text-[#2D2D2D] placeholder-[#6B6B6B] focus:border-b-2 focus:border-[#6B9B8C]'
                    } border-0 focus:outline-none`}
                    rows={2}
                  />
                </div>

                {/* Mood and Motivation */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`font-medium text-sm block mb-1.5 ${
                      isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'
                    }`}>
                      Mood
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={dayData.mood}
                      onChange={(e) => setWeekData(prev => ({
                        ...prev,
                        [dateKey]: { ...prev[dateKey], mood: parseInt(e.target.value) || 5 }
                      }))}
                      className={`w-full text-sm px-3 py-2 rounded-lg transition-all ${
                        isDark
                          ? 'bg-[#1A2332] text-[#E8E6E0] focus:border-b-2 focus:border-[#7AA897]'
                          : 'bg-[#F8F7F4] text-[#2D2D2D] focus:border-b-2 focus:border-[#6B9B8C]'
                      } border-0 focus:outline-none`}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                  <div>
                    <label className={`font-medium text-sm block mb-1.5 ${
                      isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'
                    }`}>
                      Motivation
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={dayData.motivation}
                      onChange={(e) => setWeekData(prev => ({
                        ...prev,
                        [dateKey]: { ...prev[dateKey], motivation: parseInt(e.target.value) || 5 }
                      }))}
                      className={`w-full text-sm px-3 py-2 rounded-lg transition-all ${
                        isDark
                          ? 'bg-[#1A2332] text-[#E8E6E0] focus:border-b-2 focus:border-[#7AA897]'
                          : 'bg-[#F8F7F4] text-[#2D2D2D] focus:border-b-2 focus:border-[#6B9B8C]'
                      } border-0 focus:outline-none`}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
