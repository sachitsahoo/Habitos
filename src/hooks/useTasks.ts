import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { DbTask } from '../types/db';

type TasksByDate = Record<string, DbTask[]>;

export function useTasks(startDate: string, endDate: string) {
  const [tasksByDate, setTasksByDate] = useState<TasksByDate>({});
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setLoading(true);
    supabase
      .from('tasks')
      .select('*')
      .gte('task_date', startDate)
      .lte('task_date', endDate)
      .order('created_at')
      .then(({ data, error }) => {
        if (error) console.error('useTasks fetch:', error.message);
        const map: TasksByDate = {};
        for (const row of (data ?? []) as DbTask[]) {
          if (!map[row.task_date]) map[row.task_date] = [];
          map[row.task_date].push(row);
        }
        setTasksByDate(map);
        setLoading(false);
      });
  }, [startDate, endDate]);

  const addTask = async (date: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: DbTask = {
      id: tempId, user_id: user.id, task_date: date,
      text: '', completed: false, created_at: new Date().toISOString(),
    };
    setTasksByDate(prev => ({
      ...prev,
      [date]: [...(prev[date] ?? []), optimistic],
    }));

    const { data, error } = await supabase
      .from('tasks')
      .insert({ user_id: user.id, task_date: date, text: '', completed: false })
      .select()
      .single();

    if (data && !error) {
      setTasksByDate(prev => ({
        ...prev,
        [date]: (prev[date] ?? []).map(t => t.id === tempId ? data as DbTask : t),
      }));
    } else {
      console.error('addTask:', error?.message);
      setTasksByDate(prev => ({
        ...prev,
        [date]: (prev[date] ?? []).filter(t => t.id !== tempId),
      }));
    }
  };

  const updateTask = (date: string, id: string, text: string) => {
    // Update local state immediately
    setTasksByDate(prev => ({
      ...prev,
      [date]: (prev[date] ?? []).map(t => t.id === id ? { ...t, text } : t),
    }));
    // Debounce DB write (300ms)
    clearTimeout(debounceRef.current[id]);
    debounceRef.current[id] = setTimeout(async () => {
      if (id.startsWith('temp-')) return; // not yet committed
      const { error } = await supabase.from('tasks').update({ text }).eq('id', id);
      if (error) console.error('updateTask:', error.message);
    }, 300);
  };

  const toggleTask = async (date: string, id: string) => {
    const task = tasksByDate[date]?.find(t => t.id === id);
    if (!task) return;
    const next = !task.completed;
    setTasksByDate(prev => ({
      ...prev,
      [date]: (prev[date] ?? []).map(t => t.id === id ? { ...t, completed: next } : t),
    }));
    const { error } = await supabase.from('tasks').update({ completed: next }).eq('id', id);
    if (error) console.error('toggleTask:', error.message);
  };

  const deleteTask = async (date: string, id: string) => {
    setTasksByDate(prev => ({
      ...prev,
      [date]: (prev[date] ?? []).filter(t => t.id !== id),
    }));
    if (!id.startsWith('temp-')) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) console.error('deleteTask:', error.message);
    }
  };

  return { tasksByDate, loading, addTask, updateTask, toggleTask, deleteTask };
}
