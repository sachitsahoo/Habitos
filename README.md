# ataraxia

a habit tracker i built for myself. tracks daily habits, visualizes streaks and completion, and lets you compete with friends on a leaderboard.

live at [ataraxia.today](https://ataraxia.today)

## stack

- react 18 + typescript + vite
- tailwind css v4 + shadcn/ui
- supabase (auth + database)
- recharts

## features

- daily and monthly habit tracking
- streak and completion analytics
- friends system with leaderboard
- group invite links
- dark mode
- installable as a mobile app (pwa)

## dev

```bash
pnpm install
pnpm dev
```

requires a `.env.local` with:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```
