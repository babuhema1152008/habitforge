# HabitForge 🔥

A clean, modern, production-ready habit tracking SaaS. Built with **React + TypeScript + Tailwind CSS + Framer Motion + Recharts + Supabase**, following a strict product-definition framework: one core function (mark a habit done in under 3 seconds), one reward loop (streaks, XP, levels, badges), and exactly six pages.

Real accounts and data live in **Supabase** (Postgres + Auth), but the app is **offline-first**: every read renders from a local cache (`localStorage`), every mutation applies instantly and optimistically, and a background sync engine pushes queued changes to Supabase and pulls remote changes down whenever you're online. Lose your connection mid-session and the app keeps working exactly the same — see [§8](#8-offline-first-sync-architecture) for how.

---

## 1. Product Definition

**Core function:** Create habits and mark them complete in under 3 seconds. Everything else supports this.

**Core loop:** Open app → view today's habits → tap to complete → instant feedback (progress bar animates, streak flame increments, XP toast fires, badges unlock, confetti on a perfect day) → come back tomorrow.

**Retention hook:** Challenges (7-day, 21-day, 30-day, and custom) that track daily progress toward a badge + XP bonus.

**Surface area (exactly 6 pages):**

| # | Page | Route |
|---|------|-------|
| 1 | Landing | `/` |
| 2 | Login / Signup | `/auth` |
| 3 | Dashboard | `/dashboard` |
| 4 | Calendar & Analytics | `/calendar` |
| 5 | Challenges | `/challenges` |
| 6 | Profile & Settings | `/profile` |

---

## 2. Tech Stack

- **React 18 + TypeScript** — component-based architecture, strict mode
- **Tailwind CSS** — utility-first styling, `class`-based dark mode
- **Framer Motion** — progress bar fills, card entrances, confetti, modal/toast transitions
- **Recharts** — completion trend area chart, category breakdown pie chart
- **React Router v6** — client-side routing + protected routes
- **Vite** — build tooling
- **Supabase** — Postgres database, Auth (email/password), Row Level Security
- **localStorage** — offline-first local cache + queued-mutation outbox (`src/lib/sync/`)

---

## 3. Setup Instructions

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (or use an existing one).
2. **Run the migration once**: open your project's Dashboard → SQL Editor → New query, paste the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), and run it. This creates all 5 tables, RLS policies, and the auto-profile trigger.
3. **Check your Auth settings**: Dashboard → Authentication → Providers → Email. If "Confirm email" is enabled, new signups (including the first "Try the Demo" click) will need to click a confirmation link before they can log in. For the smoothest local/dev experience, consider turning it off; for a real deployment, leave it on.
4. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Dashboard → Project Settings → API (the anon/publishable key — never the service role key, and the app never needs your database password).
5. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```

Open `http://localhost:5173`. Click **"🚀 Try the Demo"** on the auth screen to sign into a real, shared, pre-seeded Supabase account (5 habits, ~25 days of history, an active and a completed challenge, several unlocked achievements) — no signup form required. Its credentials are fixed in `src/lib/demoAccount.ts`; anyone can log into it and "Reset to Demo Data" on the Profile page resets it for everyone.

```bash
npm run build     # type-check + production build to dist/
npm run preview   # preview the production build locally
npm run lint      # ESLint
```

---

## 4. Deploying to Vercel

The app is a static Vite build with no server-side code — Vercel just needs to build it and serve `index.html` for every route (client-side routing via React Router).

1. **Push this repo to GitHub** (already done if you're reading this from the repo).
2. **Import the project** at [vercel.com/new](https://vercel.com/new) → select the repo. Vercel auto-detects Vite (`npm run build`, output directory `dist`) — no config needed there.
3. **Add environment variables** in Vercel → Project Settings → Environment Variables (for Production, Preview, and Development):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   Same values as your local `.env`. Vite only exposes variables prefixed `VITE_` to client code, and these are meant to be public (the anon key is safe to ship to the browser — every table is protected by RLS).
4. **`vercel.json`** (already in the repo) adds a catch-all rewrite to `index.html`, so a hard refresh or direct link to `/dashboard`, `/calendar`, etc. doesn't 404.
5. **Deploy.** Once you have your `*.vercel.app` URL (or a custom domain), add it in Supabase → Authentication → URL Configuration → **Site URL** / **Redirect URLs**. This matters for any email-link flow (password reset, and email confirmation if you turn "Confirm email" back on for production) — without it, links in those emails will redirect to the wrong place.

No serverless functions, no build secrets beyond the two `VITE_` vars above — everything talks to Supabase directly from the browser over HTTPS.

---

## 5. Project Structure

```
src/
├── main.tsx                  # Provider tree: Router > Theme > Toast > App state > App
├── App.tsx                   # Route table (6 pages + protected routing)
├── index.css                 # Tailwind entry + small global utility classes
│
├── types/index.ts            # All domain types (Habit, HabitLog, Challenge, UserProfile, ...)
│
├── lib/                      # Pure logic — no React, fully unit-testable
│   ├── supabaseClient.ts     # createClient(), reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
│   ├── demoAccount.ts        # Fixed credentials for the shared "Try the Demo" account
│   ├── storage.ts            # localStorage get/set wrapper (the offline cache)
│   ├── sync/                 # Offline-first sync engine — see §8
│   │   ├── mappers.ts        # camelCase app types ⇄ snake_case DB rows
│   │   ├── syncEngine.ts     # flush() / pullAll() / reseedRemote()
│   │   └── merge.ts          # last-write-wins merge (pending-outbox-wins) helpers
│   ├── date.ts                # ISO date helpers, month-grid generator, weekday labels
│   ├── id.ts                  # UUID generator (crypto.randomUUID())
│   ├── categories.ts          # Habit category metadata (emoji, color, label)
│   ├── gamification.ts        # XP curve, level curve, streak math, achievement defs
│   ├── challengeTemplates.ts  # 7/21/30-day challenge template definitions
│   ├── challenges.ts          # Challenge progress computation
│   ├── coach.ts                # AI Habit Coach message engine (rule-based, local-only)
│   ├── csv.ts                 # CSV export
│   └── sampleData.ts          # Demo seed data generator
│
├── context/                  # React state (all via useReducer + Context, no external store)
│   ├── AppProvider.tsx        # Single source of truth: habits, logs, challenges, XP, achievements,
│   │                          # Supabase auth session, and the sync queue
│   ├── ThemeProvider.tsx      # Light/dark mode, persisted + respects OS preference
│   └── ToastProvider.tsx      # XP / achievement / success toast notifications
│
├── components/
│   ├── ui/                    # Design-system primitives (Button, Card, Modal, ProgressBar,
│   │                          # CircularProgress, Chip, Avatar, EmptyState, Skeleton, Confetti...)
│   ├── layout/                # PublicNavbar, Sidebar, MobileTabBar, AppShell, ProtectedRoute
│   ├── habit/                 # HabitCard, HabitFormModal (add/edit/archive/delete)
│   ├── dashboard/              # StatsHeader (level/XP/streak), WeeklySummary, CoachCard
│   ├── charts/                 # CompletionTrendChart, CategoryBreakdownChart, CalendarHeatmap
│   ├── challenge/              # ChallengeCard, NewChallengeModal, Leaderboard (preview/demo)
│   ├── coach/                   # CoachWidget (floating panel), CoachMessageCard, useCoachActions
│   └── profile/                # AchievementsGrid
│
└── pages/
    ├── Landing.tsx             # Hero, features, testimonials, CTA
    ├── Auth.tsx                 # Login/signup tabs + "Try the Demo"
    ├── Dashboard.tsx             # Today's habits, XP/level, streak, celebration, quick add
    ├── CalendarAnalytics.tsx     # Month heatmap + trend/category charts + day drill-down
    ├── Challenges.tsx            # Templates, active, completed, leaderboard
    └── Profile.tsx                # Edit profile, achievements, theme, CSV export, sign out
```

---

## 6. Component Hierarchy

```
main.tsx
└─ BrowserRouter
   └─ ThemeProvider
      └─ ToastProvider
         └─ AppProvider                     (habits/logs/challenges/XP state + game-engine effects)
            └─ App (Routes)
               ├─ Landing                    (public)
               ├─ Auth                       (public)
               └─ ProtectedRoute → AppShell   (redirects to /auth if signed out)
                  ├─ Sidebar (desktop) / MobileTabBar (mobile)
                  ├─ CoachWidget (floating button + panel, on every page — Outlet context supplies openCoachPanel)
                  └─ <Outlet>
                     ├─ Dashboard
                     │  ├─ StatsHeader (level ring, XP bar, streak)
                     │  ├─ HabitCard[] (today's habits, tap-to-complete)
                     │  ├─ CoachCard (top-priority coach message, inline)
                     │  ├─ WeeklySummary (7-day mini bar chart)
                     │  ├─ AchievementsGrid preview
                     │  ├─ HabitFormModal (add/edit)
                     │  └─ Confetti (perfect-day + streak-milestone celebrations)
                     ├─ CalendarAnalytics
                     │  ├─ CompletionTrendChart, CategoryBreakdownChart
                     │  └─ CalendarHeatmap + day-detail panel
                     ├─ Challenges
                     │  ├─ Template cards → NewChallengeModal
                     │  ├─ ChallengeCard[] (active/completed)
                     │  └─ Leaderboard
                     └─ Profile
                        ├─ Edit profile form (avatar/name/email)
                        ├─ AchievementsGrid (full)
                        └─ Data (CSV export, reset demo), Appearance, Account
```

---

## 7. Database Schema

Real Postgres tables in Supabase — the full migration lives at [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql); this is a summary. Every table has Row Level Security enabled with a policy scoped to `auth.uid()`, so a user can only ever read/write their own rows.

```sql
-- 1:1 with auth.users, auto-created by a trigger on signup
CREATE TABLE profiles (
  id                       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                     TEXT NOT NULL DEFAULT '',
  avatar_emoji             TEXT NOT NULL DEFAULT '🦊',
  avatar_color             TEXT NOT NULL DEFAULT '#4f46e5',
  xp                       INTEGER NOT NULL DEFAULT 0,
  level                    INTEGER NOT NULL DEFAULT 1,
  best_overall_streak      INTEGER NOT NULL DEFAULT 0,
  settings                 JSONB NOT NULL DEFAULT '{"theme":"light","weekStartsOn":0,"reminderNotesEnabled":true}',
  coach_state              JSONB NOT NULL DEFAULT '{"celebratedMilestones":{}}',
  last_celebrated_perfect_day DATE,
  is_demo                  BOOLEAN NOT NULL DEFAULT false,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE habits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  emoji          TEXT NOT NULL,
  category       TEXT NOT NULL, -- health | fitness | mindfulness | productivity | learning | finance | social | other
  color          TEXT NOT NULL,
  target_days    SMALLINT[] NOT NULL, -- 0=Sun .. 6=Sat
  reminder_time  TIME,
  notes          TEXT,
  archived       BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ -- soft-delete tombstone, for offline sync
);

CREATE TABLE habit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id     UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  completed    BOOLEAN NOT NULL DEFAULT false,
  note         TEXT,
  xp_awarded   INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, date)
);

-- habit_ids kept as an array column rather than a join table — simpler to sync
CREATE TABLE challenges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  emoji          TEXT NOT NULL,
  template_id    TEXT NOT NULL, -- '7-day' | '21-day' | '30-day' | 'custom'
  duration_days  INTEGER NOT NULL,
  start_date     DATE NOT NULL,
  habit_ids      UUID[] NOT NULL DEFAULT '{}',
  xp_reward      INTEGER NOT NULL DEFAULT 0,
  badge_emoji    TEXT NOT NULL,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);

CREATE TABLE achievements (
  id           TEXT NOT NULL,      -- static achievement definition id, e.g. 'week-warrior'
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unlocked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, user_id)
);
```

---

## 8. Offline-First Sync Architecture

The local cache is the source of truth for rendering; Supabase is the source of truth for persistence across devices. `src/lib/sync/`:

- **`mappers.ts`** — converts between the app's camelCase types and Postgres's snake_case rows.
- **`syncEngine.ts`** — `flush(queue)` pushes queued tasks to Supabase in order (stopping at the first failure to preserve ordering); `pullAll(userId)` fetches every row for a user; `reseedRemote(userId, data)` wipes and re-inserts a user's data (used by "Reset to Demo Data").
- **`merge.ts`** — the last-write-wins merge rule: `mergeEntities`/`mergeKeyed` take local state, a freshly pulled remote snapshot, and the set of ids still sitting in the local outbox — anything with a pending outbox entry keeps the local version (it hasn't reached the server yet); everything else takes the remote version.

Wired into `AppProvider.tsx`:

1. Every mutation (`toggleLog`, `addHabit`, `createCustomChallenge`, …) updates local state immediately (so the UI never waits on the network) and appends a `SyncTask` to `AppState.syncQueue`, which persists to `localStorage` right alongside everything else — so the outbox survives a reload while offline.
2. A queue-flush runs after every mutation, on browser `online` events, and on a 30s interval as a fallback. It pushes tasks via `.upsert()` (or a soft-delete upsert with `deleted_at` set, for habit/challenge deletion) and dequeues whatever succeeded.
3. On reconnect, a full `pullAll` + merge also runs, so changes made on another device show up here.
4. A small sync-status indicator (`SyncStatusBadge`, in the sidebar / mobile header) shows **Synced** / **Syncing…** / **Offline — will sync** / **Sync issue — retrying**.
5. Profile-shaped fields (XP, level, settings, coach state, avatar, …) are coalesced into a single debounced `profiles` upsert by one `useEffect`, rather than every action-creator remembering to push one.

**Explicit scope limit:** conflict resolution is last-write-wins, not CRDTs — correct and simple for one person using this on a couple of devices, not built for concurrent multi-user editing of the same row. There's no Realtime subscription in v1 (sync is pull-on-reconnect/interval, not push-on-change from the server) — a natural next step via `supabase.channel(...).on('postgres_changes', ...)` without any schema changes.

---

## 9. UI Wireframe Descriptions

**Landing (`/`)** — Sticky nav (logo, theme toggle, login/signup). Hero: two-column layout with headline + CTA buttons on the left, a live-looking dashboard preview card (progress bar + 5-habit checklist) on the right. Below: 6-item feature grid, 3-card testimonial row, gradient CTA band, footer.

**Auth (`/auth`)** — Centered card, tab switcher (Sign Up / Log In), form fields, a "Start with sample habits" checkbox on signup, and a prominent "Try the Demo" button that skips form-filling entirely.

**Dashboard (`/dashboard`)** — Greeting + date header, "+ Add Habit" button. Stats row: level/XP card with avatar and progress bar (2/3 width) + circular "today %" ring (1/3 width). Two-column body: today's habit list (pending habits first, completed below, each a tap-to-toggle row with streak flame) on the left (2/3), weekly mini-bar-chart + recent achievements on the right (1/3). A confetti burst + banner fires once when the day's habits hit 100%.

**Calendar & Analytics (`/calendar`)** — 4 stat tiles (streak, best streak, 30-day avg, 30-day completions). Two charts side by side: 30-day completion trend (area chart) and category breakdown (donut). Below: month calendar heatmap (color-coded by daily completion %) with a day-detail panel that lists that day's habits and lets you toggle past days.

**Challenges (`/challenges`)** — 3 template cards (7/21/30-day) each with a "Start Challenge" button, plus a "+ Custom Challenge" action. Below: "In Progress" and "Completed" grids of challenge cards (progress bar, days left, XP reward). A demo/preview community leaderboard at the bottom.

**Profile & Settings (`/profile`)** — Edit-profile form (avatar emoji/color picker, name, email) on the left (2/3) plus the full achievements grid and data actions (CSV export, reset demo). Right column (1/3): snapshot stats, light/dark appearance switch, preferences, sign out.

---

## 10. AI Habit Coach ("Coach Nova")

A rule-based motivational engine (`src/lib/coach.ts`) that reads your local habit/streak/challenge data and produces a prioritized feed of coach messages — no external API calls, fully deterministic from app state. It surfaces in two places:

- **Dashboard Coach Card** (`components/dashboard/CoachCard.tsx`) — the single highest-priority message, always visible.
- **Floating Coach Widget** (`components/coach/CoachWidget.tsx`) — a chat-bubble-style button (bottom-left, on every authenticated page) that opens the full feed; messages are session-dismissible.

Message types, highest priority first:

| Type | Trigger | Example |
|---|---|---|
| Streak protection | Evening (≥5 PM) with pending habits on a ≥2-day streak | "Only one habit left — don't break your 12-day streak!" |
| Milestone | A habit streak hits 3/7/14/21/30/50/75/100 days (celebrated once, with confetti) | "🎉 14-Day Milestone! ... is on fire." |
| Comeback support | A habit's streak just broke | "Missing a day is okay — quitting isn't." |
| Struggle support | Trailing-7-day completion < 50% | Suggests focusing on just one (your strongest) habit |
| Pattern reminder | Near a habit's set reminder time and still pending | "You usually do X around 8:00 PM..." |
| Weekly review | Always, when there's data | Compares this week's completion % to last week's |
| Challenge suggestion | No active challenge | Offers to auto-start a 7-day "Iron Will" challenge across all active habits |
| Daily motivation | Fallback, always present | Rotating quote, stable per day |

`findNewMilestones` + `celebrateMilestone` (in `AppProvider`) ensure each streak milestone only celebrates once, persisted in `AppState.coachState`.

---

## 11. Gamification Rules

- **XP per completion:** 10 base, +5 at a 3-day streak, +15 at 7 days, +20 at 21 days, +25 at 30 days (per habit, recalculated on every toggle).
- **Perfect day bonus:** +30 XP once per day when 100% of that day's scheduled habits are complete (reversed if you undo down from 100%).
- **Levels:** level *n* requires progressively more XP (ramping +40 XP per level); see `xpRequiredForLevel` in `src/lib/gamification.ts`.
- **Streaks:** each habit tracks its own current/best streak (only counting the weekdays it's scheduled for); an overall streak tracks consecutive "perfect days."
- **Achievements:** 11 badges (first completion, 3/7/21/30-day streaks, perfect day, perfect week, level 5/10, challenge champion, habit collector), each +15 XP on unlock, evaluated automatically after every state change.
- **Challenges:** progress = days-in-range where every linked habit was completed; auto-completes (and awards its XP + badge) the moment the full duration elapses with zero missed days.

---

## 12. Sample Data

Selecting "Try the Demo" or leaving "Start with sample habits" checked on signup seeds:

- **5 habits:** Drink Water (health), Exercise (fitness), Read 20 Minutes (learning), Meditate (mindfulness), Study Python (learning, weekdays only)
- **~25 days** of realistic completion history per habit, with a few intentional gaps
- **2 challenges:** an in-progress 21-Day Habit Builder and a 7-Day Consistency Challenge that completes on load
- A user profile with XP/level already earned, so the dashboard, charts, and achievements all have real data to show immediately

See `src/lib/sampleData.ts`.

---

## 13. Accessibility & States

- Every interactive control has an `aria-label`/`aria-pressed` where appropriate; modals are proper `role="dialog"` with focus-visible rings (`focus-ring` utility) and Escape-to-close.
- Empty states (`EmptyState`), loading skeletons (`Skeleton`, `HabitCardSkeleton`), and inline form error messages (`role="alert"`) are used throughout instead of blank screens or silent failures.
- Fully responsive: desktop sidebar collapses to a bottom tab bar + top bar below the `md` breakpoint; layouts re-stack from 3-column to single-column on small screens.
- Dark mode is a `class` strategy on `<html>`, respects `prefers-color-scheme` on first load, and every component is styled for both themes.
