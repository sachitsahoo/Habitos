// TypeScript interfaces matching the Supabase schema exactly.

export interface DbHabit {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface DbHabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  log_date: string; // 'YYYY-MM-DD'
  completed: boolean;
}

export interface DbTask {
  id: string;
  user_id: string;
  task_date: string; // 'YYYY-MM-DD'
  text: string;
  completed: boolean;
  created_at: string;
}

export interface DbDailyLog {
  id: string;
  user_id: string;
  log_date: string; // 'YYYY-MM-DD'
  notes: string;
  improvements: string;
  gratitude: string;
  mood: number | null;
  motivation: number | null;
  updated_at: string;
}

export interface DbProfile {
  id: string;
  display_name: string;
  created_at: string;
}
