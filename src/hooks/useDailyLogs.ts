import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { DbDailyLog } from '../types/db';

type LogsByDate = Record<string, Partial<DbDailyLog>>;

export function useDailyLogs(startDate: string, endDate: string) {
  const [logsByDate, setLogsByDate] = useState<LogsByDate>({});
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setLoading(true);
    supabase
      .from('daily_logs')
      .select('*')
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .then(({ data, error }) => {
        if (error) console.error('useDailyLogs fetch:', error.message);
        const map: LogsByDate = {};
        for (const row of (data ?? []) as DbDailyLog[]) {
          map[row.log_date] = row;
        }
        setLogsByDate(map);
        setLoading(false);
      });
  }, [startDate, endDate]);

  const updateLog = (
    date: string,
    field: 'notes' | 'improvements' | 'gratitude' | 'mood' | 'motivation',
    value: string | number
  ) => {
    // Update local state immediately
    setLogsByDate(prev => ({
      ...prev,
      [date]: { ...(prev[date] ?? {}), [field]: value },
    }));

    // Debounce DB upsert (500ms)
    const key = `${date}-${field}`;
    clearTimeout(debounceRef.current[key]);
    debounceRef.current[key] = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Merge with any existing fields for this date so we don't overwrite them
      const existing = logsByDate[date] ?? {};
      const { error } = await supabase.from('daily_logs').upsert(
        {
          user_id: user.id,
          log_date: date,
          notes: existing.notes ?? '',
          improvements: existing.improvements ?? '',
          gratitude: existing.gratitude ?? '',
          mood: existing.mood ?? null,
          motivation: existing.motivation ?? null,
          [field]: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,log_date' }
      );
      if (error) console.error('updateLog:', error.message);
    }, 500);
  };

  return { logsByDate, loading, updateLog };
}
