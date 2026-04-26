import { useState } from 'react';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { useDarkMode } from '../App';

interface Habit {
  id: string;
  name: string;
}

const INITIAL_HABITS: Habit[] = [
  { id: '1', name: 'Morning Exercise' },
  { id: '2', name: 'Read 30 minutes' },
  { id: '3', name: 'Meditate' },
  { id: '4', name: 'Drink 8 glasses of water' },
  { id: '5', name: 'No social media before noon' }
];

export function HabitsView() {
  const { isDark } = useDarkMode();
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [newHabitName, setNewHabitName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const addHabit = () => {
    if (newHabitName.trim()) {
      setHabits([
        ...habits,
        {
          id: Date.now().toString(),
          name: newHabitName.trim()
        }
      ]);
      setNewHabitName('');
    }
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  const updateHabit = (id: string, newName: string) => {
    setHabits(habits.map(h => h.id === id ? { ...h, name: newName } : h));
    setEditingId(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent, id?: string) => {
    if (e.key === 'Enter') {
      if (id) {
        setEditingId(null);
      } else {
        addHabit();
      }
    }
  };

  return (
    <div className="p-6 flex items-start justify-center min-h-full">
      <div className="w-full max-w-2xl">
        <div className={`rounded-xl p-8 transition-colors border ${
          isDark
            ? 'bg-[#243347] border-[#3A4A5E]'
            : 'bg-white border-[#D4D2CA]'
        }`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <h2 className={`text-2xl font-semibold mb-6 ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}>
            Manage Habits
          </h2>

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
                <button className={`cursor-grab active:cursor-grabbing transition-colors ${
                  isDark
                    ? 'text-[#9B9B9B] hover:text-[#E8E6E0]'
                    : 'text-[#6B6B6B] hover:text-[#2D2D2D]'
                }`}>
                  <GripVertical className="w-5 h-5" />
                </button>

                {editingId === habit.id ? (
                  <input
                    type="text"
                    defaultValue={habit.name}
                    onBlur={(e) => updateHabit(habit.id, e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, habit.id)}
                    autoFocus
                    className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                      isDark
                        ? 'bg-[#243347] text-[#E8E6E0] border-b-2 border-[#7AA897]'
                        : 'bg-white text-[#2D2D2D] border-b-2 border-[#6B9B8C]'
                    } border-0 focus:outline-none`}
                  />
                ) : (
                  <div
                    className={`flex-1 px-4 py-2 cursor-pointer font-medium ${
                      isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'
                    }`}
                    onClick={() => setEditingId(habit.id)}
                  >
                    {habit.name}
                  </div>
                )}

                <button
                  onClick={() => deleteHabit(habit.id)}
                  className={`p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                    isDark
                      ? 'text-[#9B9B9B] hover:text-[#D66A6A] hover:bg-[#2D3E54]'
                      : 'text-[#6B6B6B] hover:text-[#C84C4C] hover:bg-[#E8E6E0]'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter habit name..."
                className={`flex-1 px-4 py-3 rounded-xl transition-all ${
                  isDark
                    ? 'bg-[#1A2332] text-[#E8E6E0] placeholder-[#9B9B9B] focus:border-b-2 focus:border-[#7AA897]'
                    : 'bg-[#F8F7F4] text-[#2D2D2D] placeholder-[#6B6B6B] focus:border-b-2 focus:border-[#6B9B8C]'
                } border-0 focus:outline-none`}
              />
              <button
                onClick={addHabit}
                disabled={!newHabitName.trim()}
                className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-medium ${
                  isDark
                    ? 'bg-[#7AA897] hover:bg-[#669989] disabled:bg-[#2D3E54] text-[#1A2332] disabled:text-[#9B9B9B]'
                    : 'bg-[#6B9B8C] hover:bg-[#5A8B7D] disabled:bg-[#E8E6E0] text-white disabled:text-[#6B6B6B]'
                } disabled:cursor-not-allowed`}
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className={`mt-6 pt-6 border-t ${isDark ? 'border-[#3A4A5E]' : 'border-[#D4D2CA]'}`}>
            <div className="flex items-center justify-between text-sm">
              <span className={isDark ? 'text-[#9B9B9B]' : 'text-[#6B6B6B]'}>Total Habits</span>
              <span className={`font-semibold text-lg ${isDark ? 'text-[#E8E6E0]' : 'text-[#2D2D2D]'}`}
                    style={{ fontFamily: 'var(--font-mono)' }}>
                {habits.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
