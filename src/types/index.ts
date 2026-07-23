// Core domain types for HabitForge.
// This app persists everything to localStorage (see lib/storage.ts). The shape
// below is intentionally flat and serializable so it can later be swapped for
// a real backend (e.g. Supabase/Postgres) without touching component code —
// see README "Database schema" section for the equivalent SQL tables.

export type HabitCategory =
  | 'health'
  | 'fitness'
  | 'mindfulness'
  | 'productivity'
  | 'learning'
  | 'finance'
  | 'social'
  | 'other';

export interface CategoryMeta {
  label: string;
  emoji: string;
  color: string; // tailwind color token used for accents
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  category: HabitCategory;
  color: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO timestamp — used for last-write-wins sync
  deletedAt?: string | null; // soft-delete tombstone, for sync
  reminderTime?: string; // 'HH:MM', UI-only, no real notifications
  notes?: string;
  archived: boolean;
  targetDays: DayOfWeek[]; // which days of week this habit applies to
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

/** A single day's completion record for a habit. Keyed by `${habitId}_${date}`. */
export interface HabitLog {
  habitId: string;
  date: string; // 'YYYY-MM-DD'
  completed: boolean;
  note?: string;
  xpAwarded: number;
  completedAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp — used for last-write-wins sync
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlockedAt: string | null; // null = locked
}

export type ChallengeTemplateId = '7-day' | '21-day' | '30-day' | 'custom';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  durationDays: number;
  startDate: string; // 'YYYY-MM-DD'
  habitIds: string[]; // which habits count toward this challenge
  templateId: ChallengeTemplateId;
  xpReward: number;
  badgeEmoji: string;
  completedAt: string | null;
  joined: boolean;
  updatedAt: string; // ISO timestamp — used for last-write-wins sync
  deletedAt?: string | null; // soft-delete tombstone, for sync
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  avatarEmoji: string;
  createdAt: string;
  xp: number;
  level: number;
  bestOverallStreak: number;
}

export type ThemeMode = 'light' | 'dark';

export interface Settings {
  theme: ThemeMode;
  weekStartsOn: DayOfWeek;
  reminderNotesEnabled: boolean;
}

export interface CoachState {
  /** habitId -> streak-length milestones already celebrated, so confetti fires once each. */
  celebratedMilestones: Record<string, number[]>;
}

export type SyncTable = 'profiles' | 'habits' | 'habit_logs' | 'challenges' | 'achievements';

/** A queued mutation waiting to be pushed to Supabase. Persisted locally so it survives reloads while offline. */
export interface SyncTask {
  id: string;
  table: SyncTable;
  op: 'upsert' | 'delete';
  /** Row payload (already in snake_case DB shape) for 'upsert'; just the row id for 'delete'. */
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AppState {
  isAuthenticated: boolean;
  user: UserProfile;
  habits: Habit[];
  logs: Record<string, HabitLog>; // key: `${habitId}_${date}`
  challenges: Challenge[];
  achievements: Achievement[];
  settings: Settings;
  lastCelebratedPerfectDay: string | null; // 'YYYY-MM-DD'
  coachState: CoachState;
  syncQueue: SyncTask[];
}

export type CoachMessageType =
  | 'streak-protection'
  | 'comeback'
  | 'milestone'
  | 'weekly-review'
  | 'pattern-reminder'
  | 'challenge-suggestion'
  | 'struggle-support'
  | 'motivation';

export type CoachActionKind = 'complete-habit' | 'start-iron-will-challenge' | 'view-calendar' | 'view-challenges';

export interface CoachAction {
  kind: CoachActionKind;
  label: string;
  habitId?: string;
}

export interface CoachMessage {
  id: string;
  type: CoachMessageType;
  priority: number; // higher = more urgent, shown first
  emoji: string;
  title: string;
  body: string;
  action?: CoachAction;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'xp';
  title: string;
  description?: string;
}
