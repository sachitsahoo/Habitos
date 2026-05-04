import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { LeaderboardRow } from '../types/db';

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Compute start date in the user's local timezone — never relies on server current_date
function getPeriodStartDate(period: 'week' | 'month' | 'all'): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (period === 'week') {
    const d = new Date(today);
    d.setDate(d.getDate() - 6); // rolling last 7 days
    return toDateKey(d);
  }
  if (period === 'month') {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  }
  return '2000-01-01';
}

export function useLeaderboard(groupId: string | null, period: 'week' | 'month' | 'all') {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(() => {
    if (!groupId) { setRows([]); return; }

    setLoading(true);
    const startDate = getPeriodStartDate(period);

    supabase
      .rpc('get_group_leaderboard', { p_group_id: groupId, p_start_date: startDate })
      .then(({ data, error }) => {
        if (!error && data) {
          setRows(
            (data as { user_id: string; display_name: string; completion: number }[]).map(r => ({
              user_id: r.user_id,
              display_name: r.display_name,
              completion: Number(r.completion),
            }))
          );
        }
        setLoading(false);
      });
  }, [groupId, period]);

  // Initial fetch + re-fetch whenever groupId or period changes
  useEffect(() => {
    setRows([]);
    fetch();
  }, [fetch]);

  // Re-fetch when the tab regains focus (picks up other users' changes)
  useEffect(() => {
    window.addEventListener('focus', fetch);
    return () => window.removeEventListener('focus', fetch);
  }, [fetch]);

  return { rows, loading, refetch: fetch };
}
