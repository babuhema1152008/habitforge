# HabitForge 🔥

A clean, modern, production-ready habit tracking SaaS. Built with **React + TypeScript + Tailwind CSS + Framer Motion + Recharts**, following a strict product-definition framework: one core function (mark a habit done in under 3 seconds), one reward loop (streaks, XP, levels, badges), and exactly six pages.

Live data lives entirely in the browser's `localStorage` — no backend, no signup friction, works offline. The persistence layer (`src/lib/storage.ts`) is a thin wrapper so it can be swapped for a real API later without touching any component.

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
- **localStorage** — persistence (see schema below for the SQL-equivalent shape)

---

## 3. Setup Instructions

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Click **"🚀 Try the Demo"** on the auth screen to sign in instantly with pre-seeded sample data (5 habits, ~25 days of history, an active and a completed challenge, several unlocked achievements).

```bash
npm run build     # type-check + production build to dist/
npm run preview   # preview the production build locally
npm run lint      # ESLint
```

No environment variables or backend services are required.

---

## 4. Project Structure

```
src/
├── main.tsx                  # Provider tree: Router > Theme > Toast > App state > App
├── App.tsx                   # Route table (6 pages + protected routing)
├── index.css                 # Tailwind entry + small global utility classes
│
├── types/index.ts            # All domain types (Habit, HabitLog, Challenge, UserProfile, ...)
│
├── lib/                      # Pure logic — no React, fully unit-testable
│   ├── storage.ts            # localStorage get/set wrapper (swap point for a real API)
│   ├── date.ts                # ISO date helpers, month-grid generator, weekday labels
│   ├── id.ts                  # ID generator
│   ├── categories.ts          # Habit category metadata (emoji, color, label)
│   ├── gamification.ts        # XP curve, level curve, streak math, achievement defs
│   ├── challengeTemplates.ts  # 7/21/30-day challenge template definitions
│   ├── challenges.ts          # Challenge progress computation
│   ├── coach.ts                # AI Habit Coach message engine (rule-based, local-only)
│   ├── csv.ts                 # CSV export
│   └── sampleData.ts          # Demo seed data generator
│
├── context/                  # React state (all via useReducer + Context, no external store)
│   ├── AppProvider.tsx        # Single source of truth: habits, logs, challenges, XP, achievements
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

## 5. Component Hierarchy

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

## 6. Database Schema

The app currently persists a single JSON blob to `localStorage` (see `AppState` in `src/types/index.ts`). It is modeled directly on these relational tables so swapping in Postgres/Supabase later is a straight mapping — replace `src/lib/storage.ts` and the dispatch calls in `AppProvider.tsx` with API calls; component code doesn't change.

```sql
CREATE TABLE users (
  id               UUID PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT UNIQUE NOT NULL,
  avatar_emoji     TEXT NOT NULL,
  avatar_color     TEXT NOT NULL,
  xp               INTEGER NOT NULL DEFAULT 0,
  level            INTEGER NOT NULL DEFAULT 1,
  best_overall_streak INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE habits (
  id             UUID PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  emoji          TEXT NOT NULL,
  category       TEXT NOT NULL, -- health | fitness | mindfulness | productivity | learning | finance | social | other
  color          TEXT NOT NULL,
  target_days    SMALLINT[] NOT NULL, -- 0=Sun .. 6=Sat
  reminder_time  TIME NULL,
  notes          TEXT NULL,
  archived       BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE habit_logs (
  habit_id     UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  completed    BOOLEAN NOT NULL,
  note         TEXT NULL,
  xp_awarded   INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (habit_id, date)
);

CREATE TABLE challenges (
  id             UUID PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  emoji          TEXT NOT NULL,
  template_id    TEXT NOT NULL, -- '7-day' | '21-day' | '30-day' | 'custom'
  duration_days  INTEGER NOT NULL,
  start_date     DATE NOT NULL,
  xp_reward      INTEGER NOT NULL,
  badge_emoji    TEXT NOT NULL,
  completed_at   TIMESTAMPTZ NULL
);

CREATE TABLE challenge_habits ( -- many-to-many: which habits count toward a challenge
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  habit_id     UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  PRIMARY KEY (challenge_id, habit_id)
);

CREATE TABLE achievements (
  id           TEXT NOT NULL,      -- static achievement definition id, e.g. 'week-warrior'
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unlocked_at  TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (id, user_id)
);
```

---

## 7. UI Wireframe Descriptions

**Landing (`/`)** — Sticky nav (logo, theme toggle, login/signup). Hero: two-column layout with headline + CTA buttons on the left, a live-looking dashboard preview card (progress bar + 5-habit checklist) on the right. Below: 6-item feature grid, 3-card testimonial row, gradient CTA band, footer.

**Auth (`/auth`)** — Centered card, tab switcher (Sign Up / Log In), form fields, a "Start with sample habits" checkbox on signup, and a prominent "Try the Demo" button that skips form-filling entirely.

**Dashboard (`/dashboard`)** — Greeting + date header, "+ Add Habit" button. Stats row: level/XP card with avatar and progress bar (2/3 width) + circular "today %" ring (1/3 width). Two-column body: today's habit list (pending habits first, completed below, each a tap-to-toggle row with streak flame) on the left (2/3), weekly mini-bar-chart + recent achievements on the right (1/3). A confetti burst + banner fires once when the day's habits hit 100%.

**Calendar & Analytics (`/calendar`)** — 4 stat tiles (streak, best streak, 30-day avg, 30-day completions). Two charts side by side: 30-day completion trend (area chart) and category breakdown (donut). Below: month calendar heatmap (color-coded by daily completion %) with a day-detail panel that lists that day's habits and lets you toggle past days.

**Challenges (`/challenges`)** — 3 template cards (7/21/30-day) each with a "Start Challenge" button, plus a "+ Custom Challenge" action. Below: "In Progress" and "Completed" grids of challenge cards (progress bar, days left, XP reward). A demo/preview community leaderboard at the bottom.

**Profile & Settings (`/profile`)** — Edit-profile form (avatar emoji/color picker, name, email) on the left (2/3) plus the full achievements grid and data actions (CSV export, reset demo). Right column (1/3): snapshot stats, light/dark appearance switch, preferences, sign out.

---

## 8. AI Habit Coach ("Coach Nova")

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

## 9. Gamification Rules

- **XP per completion:** 10 base, +5 at a 3-day streak, +15 at 7 days, +20 at 21 days, +25 at 30 days (per habit, recalculated on every toggle).
- **Perfect day bonus:** +30 XP once per day when 100% of that day's scheduled habits are complete (reversed if you undo down from 100%).
- **Levels:** level *n* requires progressively more XP (ramping +40 XP per level); see `xpRequiredForLevel` in `src/lib/gamification.ts`.
- **Streaks:** each habit tracks its own current/best streak (only counting the weekdays it's scheduled for); an overall streak tracks consecutive "perfect days."
- **Achievements:** 11 badges (first completion, 3/7/21/30-day streaks, perfect day, perfect week, level 5/10, challenge champion, habit collector), each +15 XP on unlock, evaluated automatically after every state change.
- **Challenges:** progress = days-in-range where every linked habit was completed; auto-completes (and awards its XP + badge) the moment the full duration elapses with zero missed days.

---

## 10. Sample Data

Selecting "Try the Demo" or leaving "Start with sample habits" checked on signup seeds:

- **5 habits:** Drink Water (health), Exercise (fitness), Read 20 Minutes (learning), Meditate (mindfulness), Study Python (learning, weekdays only)
- **~25 days** of realistic completion history per habit, with a few intentional gaps
- **2 challenges:** an in-progress 21-Day Habit Builder and a 7-Day Consistency Challenge that completes on load
- A user profile with XP/level already earned, so the dashboard, charts, and achievements all have real data to show immediately

See `src/lib/sampleData.ts`.

---

## 11. Accessibility & States

- Every interactive control has an `aria-label`/`aria-pressed` where appropriate; modals are proper `role="dialog"` with focus-visible rings (`focus-ring` utility) and Escape-to-close.
- Empty states (`EmptyState`), loading skeletons (`Skeleton`, `HabitCardSkeleton`), and inline form error messages (`role="alert"`) are used throughout instead of blank screens or silent failures.
- Fully responsive: desktop sidebar collapses to a bottom tab bar + top bar below the `md` breakpoint; layouts re-stack from 3-column to single-column on small screens.
- Dark mode is a `class` strategy on `<html>`, respects `prefers-color-scheme` on first load, and every component is styled for both themes.
