@/Users/sachitsahoo/.claude/primer.md
@.claude-memory.md

PROJECT CONTEXT:
- Project: Ataraxia (branded "ataraxia")
- Origin: Generated from Figma Make (https://www.figma.com/design/TT6tRg5U3BGJtxG2ZrJtBG/HabitOS)
- Stack: React 18 + TypeScript + Vite 6 + Tailwind CSS v4 + shadcn/ui + Recharts
- Package manager: pnpm
- Client: Personal / solo project

PROJECT RULES:
- Read tasks/lessons.md at session start
- Update tasks/todo.md as you work
- Move completed tasks to tasks/completed.md at session end
- Run tests before marking anything complete

---

## Architecture

### Entry Points
- `index.html` → `src/main.tsx` → `src/app/App.tsx`
- CSS: `src/styles/index.css` imports `fonts.css` → `tailwind.css` → `theme.css`

### Navigation
- Tab-based in-component state in `App.tsx` (NO react-router, despite it being installed)
- Type: `Tab = 'weekly' | 'monthly' | 'analytics' | 'habits'`
- Default tab: `'weekly'`

### State Management
- All local React `useState` — no Redux, Zustand, or any external store
- Dark mode: custom `DarkModeContext` defined in `App.tsx`, consumed via `useDarkMode()` hook in all views
- No persistence — all data resets on page reload (no localStorage, no API)

### Data
- All data is mock/randomized via `Math.random()` at component mount
- No backend, no auth, no database, no `.env` files
- Types are defined inline per-component (no shared `types/` directory)

---

## File Map

```
src/
├── main.tsx                    # React DOM entry point
├── app/
│   ├── App.tsx                 # Root shell: header, tabs, dark mode context
│   └── components/
│       ├── WeeklyView.tsx      # 7-day scrollable habit tracker
│       ├── MonthlyView.tsx     # Monthly matrix + trend chart
│       ├── AnalyticsView.tsx   # 30-day analytics + mood/motivation charts
│       ├── HabitsView.tsx      # Habit CRUD (add/edit/delete)
│       ├── CircularProgress.tsx # SVG circular progress ring
│       ├── figma/
│       │   └── ImageWithFallback.tsx  # img with SVG fallback
│       └── ui/                 # Full shadcn/ui component library (unused in main views)
└── styles/
    ├── index.css               # CSS entry: imports fonts → tailwind → theme
    ├── fonts.css               # Google Fonts: Inter + JetBrains Mono
    ├── tailwind.css            # Tailwind v4 + tw-animate-css
    └── theme.css               # Full design token definitions (light + dark)
```

---

## Design System

### Fonts
- **UI:** `Inter` (400, 500, 600, 700) — all body text, labels, buttons → `var(--font-ui)`
- **Mono:** `JetBrains Mono` (500, 600, 700) — all numbers, percentages, stats, chart axes → `var(--font-mono)`
- Mono font applied inline: `style={{ fontFamily: 'var(--font-mono)' }}`

### Color Tokens (`src/styles/theme.css`)

**Light mode** (background: `#F8F7F4` warm off-white):
| Token | Value | Role |
|---|---|---|
| `--background` | `#F8F7F4` | Page background |
| `--foreground` | `#2D2D2D` | Primary text |
| `--card` | `#FFFFFF` | Card/panel background |
| `--secondary` | `#E8E6E0` | Secondary surfaces |
| `--muted-foreground` | `#6B6B6B` | Subdued text |
| `--accent` | `#6B9B8C` | Primary accent (sage green) |
| `--destructive` | `#C84C4C` | Errors / delete |
| `--border` | `#D4D2CA` | Borders |

**Dark mode** (background: `#1A2332` deep navy):
| Token | Value | Role |
|---|---|---|
| `--background` | `#1A2332` | Deep navy |
| `--card` | `#243347` | Card surface |
| `--secondary` | `#2D3E54` | Secondary surfaces |
| `--accent` | `#7AA897` | Lighter sage green |
| `--border` | `#3A4A5E` | Borders |

**Key hard-coded hex values used in components:**
- Accent light: `#6B9B8C` / dark: `#7AA897`
- Card hover dark: `#2D3E54`
- Progress track light: `#E8E6E0` / dark: `#2D3E54`

### Spacing & Shape
- Base border radius: `0.75rem` (12px) — cards, inputs, buttons use `rounded-xl`
- Card padding: `p-5` (week), `p-6` (monthly/analytics), `p-8` (habits)
- Header: `px-6 py-4`
- Consistent card shadow: `box-shadow: 0 1px 3px rgba(0,0,0,0.06)` (inline style, not Tailwind utility)

### Dark Mode Implementation
- CSS: `@custom-variant dark (&:is(.dark *))`
- Runtime: `isDark` boolean in `App.tsx` state — components use conditional Tailwind arbitrary values
- Pattern: `className={isDark ? 'bg-[#243347]' : 'bg-white'}`
- **NOT** using `next-themes` (installed but unwired)

---

## Data Models (inline per component)

**WeeklyView:**
```ts
interface Habit { id: string; name: string; completed: boolean; }
interface Task  { id: string; text: string; completed: boolean; }
interface DayData {
  date: Date; habits: Habit[]; tasks: Task[];
  notes: string; improvements: string; gratitude: string;
  mood: number; motivation: number; // both 1–10
}
```

**HabitsView:**
```ts
interface Habit { id: string; name: string; } // no completion status
```

**ID generation:** `Date.now().toString()` for new items.

**Default mock habits (5 items, ids '1'–'5'):**
Morning Exercise, Read 30 minutes, Meditate, Drink 8 glasses of water, No social media before noon

---

## Component Notes

### WeeklyView
- Horizontal scroll, 7 columns, each `w-[320px]`
- Week prev/next navigation + date range header
- Per-day: CircularProgress ring, habits checklist, tasks (add/delete/toggle), notes/improvements/gratitude textareas, mood + motivation number inputs

### MonthlyView
- Month navigation + CircularProgress
- Stats cards: completion %, current streak, best day
- Habit matrix: habits × days grid with filled/empty dots + per-habit progress bar
- Recharts `AreaChart` for daily completion trend
- **Bug:** changing months doesn't regenerate data (state initialized once with `useState(() => fn())`)

### AnalyticsView
- Stats: 30-day avg, longest streak, active habit count
- Recharts `AreaChart` for: 30-day completion, mood (0–10), motivation (0–10)
- Habit performance list: streak, best streak, completion %, progress bar
- All data randomly generated on mount

### HabitsView
- Max-width `2xl` (672px) centered layout
- Click-to-edit inline: click name → input appears, blur/Enter saves
- Add habit at bottom, delete on hover
- Drag handle (`GripVertical`) is **visual only** — react-dnd is installed but not wired up

### CircularProgress
- Pure SVG, two circles (track + arc), rotated -90deg (starts at top)
- 500ms CSS transition on `strokeDashoffset`
- Props: `percentage`, `size=120`, `strokeWidth=8`

---

## shadcn/ui Status
- Full component library present in `src/app/components/ui/`
- **NONE of the 35+ components are used in the four main views** — all views use raw HTML + Tailwind
- `cn()` utility (`clsx` + `tailwind-merge`) is available at `src/app/components/ui/utils.ts`
- `useIsMobile` hook (breakpoint 768px) at `src/app/components/ui/use-mobile.ts`

---

## Installed but Unused / Stubbed
| Package | Status |
|---|---|
| `react-router` 7.13 | Installed, not wired up (tab state used instead) |
| `next-themes` 0.4.6 | Installed, not wired up (manual dark mode instead) |
| `react-dnd` + `react-dnd-html5-backend` | Installed, grip icon shown, DnD not implemented |
| `@mui/material` + `@mui/icons-material` | Installed, not used |
| `canvas-confetti` | Installed, not used |

---

## Dev Commands
```bash
pnpm dev      # start Vite dev server
pnpm build    # production build
```

## Vite Config Notes
- Path alias: `@` → `./src`
- Custom `figmaAssetResolver` plugin: resolves `figma:asset/<name>` → `src/assets/<name>`
- Raw imports supported for `*.svg` and `*.csv`
- Tailwind v4 via `@tailwindcss/vite` plugin (no `tailwind.config.js` needed)

---

## Roadmap: Supabase + Auth + Friends + Leaderboard

This section is the authoritative implementation plan. Work through phases in order. Do not skip phases.

---

### Phase 1 — Supabase Project + Auth

**Goal:** Users can sign up / sign in once per device and stay logged in persistently.

**Steps:**
1. Create a Supabase project at supabase.com. Copy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` into `.env.local` (gitignored).
2. Install: `pnpm add @supabase/supabase-js`
3. Create `src/lib/supabase.ts` — single `createClient` export using the env vars.
4. Enable **Email + Password** auth in Supabase dashboard (Auth → Providers). Disable email confirmation for now (can re-enable later).
5. Configure session persistence:
   - Supabase JS SDK stores the refresh token in `localStorage` by default — this gives the "one sign-in per device" behavior automatically.
   - Set `auth.persistSession: true` and `auth.autoRefreshToken: true` in `createClient` options (both are default, but be explicit).
   - Access tokens expire in 1 hour; refresh tokens are valid for 30 days (configurable in Supabase dashboard → Auth → Settings → JWT expiry / Refresh token expiry). Set refresh token to **30 days**.
   - Users will stay signed in until they explicitly sign out or clear browser storage — matching the "premium website" behavior.
6. Create `src/app/components/AuthScreen.tsx`:
   - Two modes: Sign In / Sign Up (toggle link at bottom).
   - Fields: display name (sign-up only), email, password.
   - On sign-up: call `supabase.auth.signUp()` then insert a row into `public.profiles`.
   - On sign-in: call `supabase.auth.signInWithPassword()`.
   - Minimal styling matching existing design system (card, accent button, Inter font).
7. In `App.tsx`:
   - On mount, call `supabase.auth.getSession()` — if session exists, skip auth screen entirely.
   - Subscribe to `supabase.auth.onAuthStateChange` to reactively update `user` state.
   - Render `<AuthScreen />` when `user === null`, render the full app when `user` is set.
   - Add a Sign Out option in the header (small button or avatar dropdown).

**New files:** `src/lib/supabase.ts`, `src/app/components/AuthScreen.tsx`
**Modified files:** `src/app/App.tsx`
**New env vars:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

### Phase 2 — Database Schema

Run all of this in the Supabase SQL editor. Enable Row Level Security (RLS) on every table.

```sql
-- User profiles (display name, avatar color, etc.)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read any profile" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Habits definition (the list of habits a user has set up)
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
alter table public.habits enable row level security;
create policy "Own habits only" on public.habits using (auth.uid() = user_id);

-- Daily habit completions
create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  log_date date not null,
  completed boolean not null default false,
  unique (user_id, habit_id, log_date)
);
alter table public.habit_logs enable row level security;
create policy "Own habit logs only" on public.habit_logs using (auth.uid() = user_id);

-- Daily tasks (per-day free-form to-do items)
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_date date not null,
  text text not null,
  completed boolean not null default false,
  created_at timestamptz default now()
);
alter table public.tasks enable row level security;
create policy "Own tasks only" on public.tasks using (auth.uid() = user_id);

-- Daily journal (notes, improvements, gratitude, mood, motivation)
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null unique,  -- one row per user per day
  notes text default '',
  improvements text default '',
  gratitude text default '',
  mood int check (mood between 1 and 10),
  motivation int check (motivation between 1 and 10),
  updated_at timestamptz default now(),
  unique (user_id, log_date)
);
alter table public.daily_logs enable row level security;
create policy "Own daily logs only" on public.daily_logs using (auth.uid() = user_id);
```

**Data epoch:** All queries should filter `log_date >= '2026-04-01'`. If data density proves to be a problem, fall back to `>= '2026-01-01'`. Seed data / mock data should respect this cutoff — no data before April 1, 2026.

**Type definitions:** Create `src/types/db.ts` with TypeScript interfaces matching all tables above. This replaces the current inline-per-component pattern.

---

### Phase 3 — Migrate State to Supabase

Replace all `Math.random()` mock data with real reads/writes. Do views one at a time.

**New shared hooks to create in `src/hooks/`:**
- `useHabits()` — fetches `public.habits` for current user, exposes `habits`, `addHabit`, `updateHabit`, `deleteHabit`.
- `useHabitLogs(startDate, endDate)` — fetches `public.habit_logs` for a date range, exposes `logs`, `toggleLog`.
- `useTasks(date)` — fetches `public.tasks` for a single date, exposes `tasks`, `addTask`, `toggleTask`, `deleteTask`.
- `useDailyLog(date)` — fetches/upserts a single `public.daily_logs` row, exposes `log`, `updateLog` (debounced 500ms on textarea changes).
- All hooks use **optimistic updates**: update local state immediately, then sync to Supabase. On error, revert.

**Migration order:**
1. `HabitsView.tsx` — read/write `public.habits` via `useHabits()`. Simplest, no date logic.
2. `WeeklyView.tsx` — use `useHabitLogs`, `useTasks`, `useDailyLog` for the visible 7-day window.
3. `MonthlyView.tsx` — use `useHabitLogs` for the full month. Fix existing bug (month change doesn't reload data) at the same time.
4. `AnalyticsView.tsx` — query `habit_logs` and `daily_logs` for the past 30 days, compute stats client-side.

**Remove all `Math.random()` calls once a view is wired up.**

---

### Phase 4 — Friends System

**New DB tables:**

```sql
-- Friend requests (pending until accepted)
create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  unique (from_user, to_user)
);
alter table public.friend_requests enable row level security;
create policy "See own requests" on public.friend_requests
  using (auth.uid() = from_user or auth.uid() = to_user);

-- Accepted friendships (denormalized both directions for easy querying)
create table public.friends (
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, friend_id)
);
alter table public.friends enable row level security;
create policy "See own friends" on public.friends using (auth.uid() = user_id);
```

**New UI — Friends tab (add `'friends'` to the `Tab` type):**
- `FriendsView.tsx`: two sections — "Your Friends" list and "Add a Friend" search.
- Add Friend flow: search by display name → send friend request → pending state shown.
- Incoming requests shown with Accept / Decline buttons.
- Accepting a request inserts rows in both directions in `public.friends` and updates `friend_requests.status = 'accepted'`.
- Friend list shows display name + weekly completion % badge.

**New hook:** `useFriends()` — fetches friends + pending requests, exposes `friends`, `pendingIn`, `pendingOut`, `sendRequest`, `acceptRequest`, `declineRequest`.

---

### Phase 5 — Leaderboard

**Privacy model:** The leaderboard exposes **only aggregate percentages** — no habit names, task text, notes, mood, or motivation are ever visible to friends. Specifically:
- **Habits %:** `completed_habit_logs / total_possible_habit_logs × 100` for the period
- **Tasks %:** `completed_tasks / total_tasks × 100` for the period

**New DB view (read-only, computed server-side):**

```sql
-- Aggregate stats visible to friends (no PII, no content)
create or replace view public.friend_stats as
select
  u.id as user_id,
  p.display_name,
  date_trunc('week', hl.log_date)::date as week_start,
  count(*) filter (where hl.completed) as habits_done,
  count(*) as habits_total,
  round(
    100.0 * count(*) filter (where hl.completed) / nullif(count(*), 0), 1
  ) as habit_pct
from auth.users u
join public.profiles p on p.id = u.id
left join public.habit_logs hl on hl.user_id = u.id
group by u.id, p.display_name, date_trunc('week', hl.log_date)::date;
```

Task % is computed client-side from a similar query scoped to the viewer's friends list.

**RLS on the view:** Only return rows where `user_id` is in the current user's `public.friends` list, or is the current user themselves.

**New UI — Leaderboard tab (add `'leaderboard'` to the `Tab` type):**
- `LeaderboardView.tsx`: period picker (This Week / This Month / All Time).
- Ranked list: rank number, display name, habit % bar, task % bar, combined score.
- Current user row always shown, highlighted with accent color, even if not in top N.
- No names of habits or tasks ever shown — only the percentages.
- Ties broken by display name alphabetically.

**New hook:** `useLeaderboard(period)` — fetches friend stats + own stats, sorts, returns ranked array.

**Updated `Tab` type in `App.tsx`:**
```ts
type Tab = 'weekly' | 'monthly' | 'analytics' | 'habits' | 'friends' | 'leaderboard'
```

---

### Implementation Order (strict)

| # | Phase | Key deliverable |
|---|---|---|
| 1 | Supabase + Auth | Sign-up/in screen, persistent session, sign-out |
| 2 | Schema | All tables created + RLS policies |
| 3 | Migrate WeeklyView | Real data for the most-used view |
| 4 | Migrate HabitsView | Habit CRUD persisted |
| 5 | Migrate MonthlyView + fix bug | Month navigation reloads data |
| 6 | Migrate AnalyticsView | 30-day real stats |
| 7 | Friends system | Send/accept requests, friends list |
| 8 | Leaderboard | Privacy-safe aggregate comparison |

---

### New Files Summary (post-plan)

```
src/
├── lib/
│   └── supabase.ts              # Supabase client singleton
├── types/
│   └── db.ts                   # TypeScript interfaces for all DB tables
├── hooks/
│   ├── useHabits.ts
│   ├── useHabitLogs.ts
│   ├── useTasks.ts
│   ├── useDailyLog.ts
│   ├── useFriends.ts
│   └── useLeaderboard.ts
└── app/components/
    ├── AuthScreen.tsx           # Sign-in / sign-up UI
    ├── FriendsView.tsx          # Friends management tab
    └── LeaderboardView.tsx      # Leaderboard tab
```

### Packages to install

```bash
pnpm add @supabase/supabase-js
```

No other new runtime dependencies needed — all DB logic goes through the Supabase JS client.
