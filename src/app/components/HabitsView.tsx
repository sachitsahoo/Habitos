import { useState } from 'react';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { useDarkMode } from '../App';
import type { Habit } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface HabitsViewProps {
  habits: Habit[];
  setHabits: (value: Habit[] | ((prev: Habit[]) => Habit[])) => void;
}

export function HabitsView({ habits, setHabits }: HabitsViewProps) {
  const { isDark } = useDarkMode();
  const [newHabitName, setNewHabitName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const addHabit = () => {
    if (newHabitName.trim()) {
      setHabits(prev => [
        ...prev,
        { id: Date.now().toString(), name: newHabitName.trim() },
      ]);
      setNewHabitName('');
    }
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const updateHabit = (id: string, newName: string) => {
    if (newName.trim()) {
      setHabits(prev => prev.map(h => h.id === id ? { ...h, name: newName.trim() } : h));
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id?: string) => {
    if (e.key === 'Enter') {
      if (id) setEditingId(null);
      else addHabit();
    }
    if (e.key === 'Escape') setEditingId(null);
  };

  return (
    <div className="p-6 flex items-start justify-center min-h-full">
      <div className="w-full max-w-2xl">
        <Card
          className={`transition-colors border ${
            isDark ? 'bg-[#243347] border-[#3A4A5E]' : 'bg-white border-[#D4D2CA]'
          }`}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', gap: 0 }}
        >
          <CardHeader className="px-8 pt-8 pb-6">
            <CardTitle className={`text-2xl font-semibold ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
              Manage Habits
            </CardTitle>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {/* Habits List */}
            <div className="space-y-3 mb-6">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-colors group border ${
                    isDark
                      ? 'bg-[#1A2332] border-[#3A4A5E] hover:border-[#7AA897]/30'
                      : 'bg-[#F8F7F4] border-[#D4D2CA] hover:border-[#6B9B8C]/30'
                  }`}
                >
                  {/* Drag handle — visual only */}
                  <span className={`cursor-grab active:cursor-grabbing transition-colors ${
                    isDark ? 'text-[#9B9B9B] hover:text-[#E8E6E0]' : 'text-[#6B6B6B] hover:text-[#2D2D2D]'
                  }`}>
                    <GripVertical className="w-5 h-5" />
                  </span>

                  {editingId === habit.id ? (
                    <Input
                      defaultValue={habit.name}
                      onBlur={(e) => updateHabit(habit.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, habit.id)}
                      autoFocus
                      className={`flex-1 border-0 border-b-2 rounded-none shadow-none focus-visible:ring-0 px-1 py-1 h-auto text-base ${
                        isDark
                          ? 'bg-transparent text-[#E8E6E0] border-[#7AA897]'
                          : 'bg-transparent text-[#2D2D2D] border-[#6B9B8C]'
                      }`}
                    />
                  ) : (
                    <div
                      className={`flex-1 px-1 py-1 cursor-pointer font-medium ${
                        isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'
                      }`}
                      onClick={() => setEditingId(habit.id)}
                    >
                      {habit.name}
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteHabit(habit.id)}
                    className={`opacity-0 group-hover:opacity-100 transition-all ${
                      isDark
                        ? 'text-[#9B9B9B] hover:text-[#D66A6A] hover:bg-[#2D3E54]'
                        : 'text-[#6B6B6B] hover:text-[#C84C4C] hover:bg-[#E8E6E0]'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {habits.length === 0 && (
                <div className={`text-center py-16 ${isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}`}>
                  No habits yet. Add your first habit below!
                </div>
              )}
            </div>

            {/* Add New Habit */}
            <div className={`border-t pt-6 ${isDark ? 'border-[#3A4A5E]' : 'border-[#D4D2CA]'}`}>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'
              }`}>
                Add New Habit
              </label>
              <div className="flex gap-3">
                <Input
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e)}
                  placeholder="Enter habit name..."
                  className={`flex-1 rounded-xl border-0 px-4 py-3 h-auto shadow-none focus-visible:ring-0 focus-visible:border-b-2 ${
                    isDark
                      ? 'bg-[#1A2332] text-[#E8E6E0] placeholder:text-[#9B9B9B] focus-visible:border-[#7AA897]'
                      : 'bg-[#F8F7F4] text-[#2D2D2D] placeholder:text-[#6B6B6B] focus-visible:border-[#6B9B8C]'
                  }`}
                />
                <Button
                  onClick={addHabit}
                  disabled={!newHabitName.trim()}
                  className={`px-6 py-3 h-auto rounded-xl font-medium ${
                    isDark
                      ? 'bg-[#7AA897] hover:bg-[#669989] disabled:bg-[#2D3E54] text-[#1A2332] disabled:text-[#9B9B9B]'
                      : 'bg-[#6B9B8C] hover:bg-[#5A8B7D] disabled:bg-[#E8E6E0] text-white disabled:text-[#6B6B6B]'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  Add
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className={`mt-6 pt-6 border-t ${isDark ? 'border-[#3A4A5E]' : 'border-[#D4D2CA]'}`}>
              <div className="flex items-center justify-between text-sm">
                <span className={isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}>Total Habits</span>
                <span
                  className={`font-semibold text-lg ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {habits.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
