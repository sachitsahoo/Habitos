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
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = (id: string) => setDraggedId(id);

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggedId) setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    setHabits(prev => {
      const items = [...prev];
      const from = items.findIndex(h => h.id === draggedId);
      const to = items.findIndex(h => h.id === targetId);
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      return items;
    });
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const activeHabits = habits.filter(h => !h.endDate);

  const addHabit = () => {
    if (newHabitName.trim()) {
      const today = new Date().toISOString().split('T')[0];
      setHabits(prev => [
        ...prev,
        { id: Date.now().toString(), name: newHabitName.trim(), startDate: today },
      ]);
      setNewHabitName('');
    }
  };

  const archiveHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => h.id === id ? { ...h, endDate: today } : h));
  };

  const updateHabit = (id: string, newName: string) => {
    if (newName.trim()) {
      setHabits(prev => prev.map(h => h.id === id ? { ...h, name: newName.trim() } : h));
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id?: string) => {
    if (e.key === 'Enter') {
      if (id) updateHabit(id, e.currentTarget.value);
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
              {activeHabits.map((habit) => (
                <div
                  key={habit.id}
                  draggable
                  onDragStart={() => handleDragStart(habit.id)}
                  onDragOver={(e) => handleDragOver(e, habit.id)}
                  onDrop={(e) => handleDrop(e, habit.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all group border ${
                    draggedId === habit.id
                      ? 'opacity-40 scale-[0.98]'
                      : dragOverId === habit.id
                      ? isDark
                        ? 'bg-[#1A2332] border-[#7AA897] shadow-[0_0_0_2px_rgba(122,168,151,0.25)]'
                        : 'bg-[#F8F7F4] border-[#6B9B8C] shadow-[0_0_0_2px_rgba(107,155,140,0.2)]'
                      : isDark
                      ? 'bg-[#1A2332] border-[#3A4A5E] hover:border-[#7AA897]/30'
                      : 'bg-[#F8F7F4] border-[#D4D2CA] hover:border-[#6B9B8C]/30'
                  }`}
                >
                  {/* Drag handle */}
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
                    onClick={() => archiveHabit(habit.id)}
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

              {activeHabits.length === 0 && (
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
                  {activeHabits.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
