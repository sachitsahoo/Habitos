import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { DbHabit } from '../types/db';

export function useHabits() {
  const [habits, setHabits] = useState<DbHabit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('habits')
      .select('*')
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) console.error('useHabits fetch:', error.message);
        if (data) setHabits(data as DbHabit[]);
        setLoading(false);
      });
  }, []);

  const addHabit = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const sort_order = habits.length;
    const tempId = `temp-${Date.now()}`;
    const optimistic: DbHabit = {
      id: tempId,
      user_id: user.id,
      name,
      sort_order,
      created_at: new Date().toISOString(),
    };
    setHabits(prev => [...prev, optimistic]);

    const { data, error } = await supabase
      .from('habits')
      .insert({ name, sort_order, user_id: user.id })
      .select()
      .single();

    if (data && !error) {
      setHabits(prev => prev.map(h => h.id === tempId ? data as DbHabit : h));
    } else {
      console.error('addHabit:', error?.message);
      setHabits(prev => prev.filter(h => h.id !== tempId));
    }
  };

  const deleteHabit = async (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (error) console.error('deleteHabit:', error.message);
  };

  const updateHabit = async (id: string, name: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, name } : h));
    const { error } = await supabase.from('habits').update({ name }).eq('id', id);
    if (error) console.error('updateHabit:', error.message);
  };

  const reorderHabits = async (reordered: DbHabit[]) => {
    setHabits(reordered);
    const { error } = await supabase.rpc('reorder_habits', {
      habit_ids: reordered.map(h => h.id),
    }).then(r => r);

    // Fallback: individual updates if RPC doesn't exist yet
    if (error) {
      await Promise.all(
        reordered.map((h, i) =>
          supabase.from('habits').update({ sort_order: i }).eq('id', h.id)
        )
      );
    }
  };

  return { habits, loading, addHabit, deleteHabit, updateHabit, reorderHabits };
}
