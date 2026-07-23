// Maps between the app's camelCase local types and Supabase's snake_case DB rows.
import type { Achievement, Challenge, CoachState, DayOfWeek, Habit, HabitLog, Settings, UserProfile } from '@/types';

export type DbRow = Record<string, unknown>;

export function habitToRow(h: Habit, userId: string): DbRow {
  return {
    id: h.id,
    user_id: userId,
    name: h.name,
    emoji: h.emoji,
    category: h.category,
    color: h.color,
    target_days: h.targetDays,
    reminder_time: h.reminderTime ?? null,
    notes: h.notes ?? null,
    archived: h.archived,
    created_at: h.createdAt,
    updated_at: h.updatedAt,
    deleted_at: h.deletedAt ?? null,
  };
}

export function rowToHabit(row: DbRow): Habit {
  return {
    id: row.id as string,
    name: row.name as string,
    emoji: row.emoji as string,
    category: row.category as Habit['category'],
    color: row.color as string,
    targetDays: row.target_days as DayOfWeek[],
    reminderTime: (row.reminder_time as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    archived: row.archived as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    deletedAt: row.deleted_at as string | null,
  };
}

export function habitLogToRow(log: HabitLog, userId: string): DbRow {
  return {
    habit_id: log.habitId,
    user_id: userId,
    date: log.date,
    completed: log.completed,
    note: log.note ?? null,
    xp_awarded: log.xpAwarded,
    completed_at: log.completedAt,
    updated_at: log.updatedAt,
  };
}

export function rowToHabitLog(row: DbRow): HabitLog {
  return {
    habitId: row.habit_id as string,
    date: row.date as string,
    completed: row.completed as boolean,
    note: (row.note as string | null) ?? undefined,
    xpAwarded: row.xp_awarded as number,
    completedAt: row.completed_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function challengeToRow(c: Challenge, userId: string): DbRow {
  return {
    id: c.id,
    user_id: userId,
    title: c.title,
    description: c.description,
    emoji: c.emoji,
    template_id: c.templateId,
    duration_days: c.durationDays,
    start_date: c.startDate,
    habit_ids: c.habitIds,
    xp_reward: c.xpReward,
    badge_emoji: c.badgeEmoji,
    completed_at: c.completedAt,
    updated_at: c.updatedAt,
    deleted_at: c.deletedAt ?? null,
  };
}

export function rowToChallenge(row: DbRow): Challenge {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    emoji: row.emoji as string,
    templateId: row.template_id as Challenge['templateId'],
    durationDays: row.duration_days as number,
    startDate: row.start_date as string,
    habitIds: (row.habit_ids as string[]) ?? [],
    xpReward: row.xp_reward as number,
    badgeEmoji: row.badge_emoji as string,
    completedAt: row.completed_at as string | null,
    joined: true,
    updatedAt: row.updated_at as string,
    deletedAt: row.deleted_at as string | null,
  };
}

export function achievementToRow(a: Achievement, userId: string): DbRow {
  return {
    id: a.id,
    user_id: userId,
    unlocked_at: a.unlockedAt,
  };
}

export function rowToAchievement(row: DbRow): Achievement {
  return {
    id: row.id as string,
    title: '',
    description: '',
    emoji: '',
    unlockedAt: row.unlocked_at as string,
  };
}

export interface ProfilePayload {
  user: UserProfile;
  settings: Settings;
  coachState: CoachState;
  lastCelebratedPerfectDay: string | null;
  isDemo?: boolean;
}

export function profileToRow(p: ProfilePayload): DbRow {
  return {
    id: p.user.id,
    name: p.user.name,
    avatar_emoji: p.user.avatarEmoji,
    avatar_color: p.user.avatarColor,
    xp: p.user.xp,
    level: p.user.level,
    best_overall_streak: p.user.bestOverallStreak,
    settings: p.settings,
    coach_state: p.coachState,
    last_celebrated_perfect_day: p.lastCelebratedPerfectDay,
    ...(p.isDemo !== undefined ? { is_demo: p.isDemo } : {}),
  };
}

export interface ProfilePatch {
  user: Partial<UserProfile>;
  settings: Settings;
  coachState: CoachState;
  lastCelebratedPerfectDay: string | null;
}

export function rowToProfilePatch(row: DbRow, email: string): ProfilePatch {
  return {
    user: {
      id: row.id as string,
      name: row.name as string,
      email,
      avatarEmoji: row.avatar_emoji as string,
      avatarColor: row.avatar_color as string,
      xp: row.xp as number,
      level: row.level as number,
      bestOverallStreak: row.best_overall_streak as number,
      createdAt: row.created_at as string,
    },
    settings: row.settings as Settings,
    coachState: row.coach_state as CoachState,
    lastCelebratedPerfectDay: (row.last_celebrated_perfect_day as string | null) ?? null,
  };
}
