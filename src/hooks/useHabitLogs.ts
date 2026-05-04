import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { DbHabitLog } from '../types/db';

// completions[date][habitId] = true | false
type Completions = Record<string, Record<string, boolean>>;

export function useHabitLogs(startDate: string, endDate: string) {
  const [completions, setCompletions] = useState<Completions>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('habit_logs')
      .select('*')
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .then(({ data, error }) => {
        if (error && import.meta.env.DEV) console.error('useHabitLogs fetch:', error.message);
        const map: Completions = {};
        for (const row of (data ?? []) as DbHabitLog[]) {
          if (!map[row.log_date]) map[row.log_date] = {};
          map[row.log_date][row.habit_id] = row.completed;
        }
        setCompletions(map);
        setLoading(false);
      });
  }, [startDate, endDate]);

  const toggleLog = async (date: string, habitId: string) => {
    const current = completions[date]?.[habitId] ?? false;
    // Optimistic
    setCompletions(prev => ({
      ...prev,
      [date]: { ...(prev[date] ?? {}), [habitId]: !current },
    }));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('habit_logs').upsert(
      { user_id: user.id, habit_id: habitId, log_date: date, completed: !current },
      { onConflict: 'user_id,habit_id,log_date' }
    );
    if (error) {
      if (import.meta.env.DEV) console.error('toggleLog:', error.message);
      // Revert
      setCompletions(prev => ({
        ...prev,
        [date]: { ...(prev[date] ?? {}), [habitId]: current },
      }));
    }
  };

  return { completions, loading, toggleLog };
}
