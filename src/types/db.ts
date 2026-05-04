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
  last_name_change_at: string | null;
}

export interface DbGroup {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  created_at: string;
}

export interface DbGroupMember {
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface LeaderboardRow {
  user_id: string;
  display_name: string;
  completion: number; // 0.0 – 1.0
}

export interface DbFriendRequest {
  id: string;
  from_user: string;
  to_user: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface DbFriend {
  user_id: string;
  friend_id: string;
  created_at: string;
}
