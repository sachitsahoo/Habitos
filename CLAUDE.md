@/Users/sachitsahoo/.claude/primer.md
@.claude-memory.md

PROJECT CONTEXT:
- Project: Habitos (branded "HabitOS")
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
