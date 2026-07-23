import type { AppState, Habit, HabitLog } from '@/types';
import { addDays, dayOfWeek, todayISO } from '@/lib/date';

const MAX_LOOKBACK_DAYS = 3650;

export function logKey(habitId: string, date: string): string {
  return `${habitId}_${date}`;
}

/** XP required to go from `level - 1` to `level`. Ramps up gently so early levels feel fast. */
function xpDeltaForLevel(level: number): number {
  return 100 + (level - 2) * 40;
}

/** Cumulative XP required to reach `level` starting from 0 at level 1. */
export function xpRequiredForLevel(level: number): number {
  let total = 0;
  for (let l = 2; l <= level; l++) total += xpDeltaForLevel(l);
  return total;
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  percent: number;
}

export function levelFromXp(xp: number): LevelProgress {
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= xp && level < 200) level++;
  const floor = xpRequiredForLevel(level);
  const ceil = xpRequiredForLevel(level + 1);
  const xpIntoLevel = xp - floor;
  const xpForNextLevel = ceil - floor;
  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    percent: xpForNextLevel > 0 ? Math.min(100, (xpIntoLevel / xpForNextLevel) * 100) : 100,
  };
}

/** XP granted for completing a habit, scaled by the streak it extends to. */
export function xpForCompletion(newStreakLength: number): number {
  const base = 10;
  let bonus = 0;
  if (newStreakLength >= 30) bonus = 25;
  else if (newStreakLength >= 21) bonus = 20;
  else if (newStreakLength >= 7) bonus = 15;
  else if (newStreakLength >= 3) bonus = 5;
  return base + bonus;
}

export const PERFECT_DAY_BONUS_XP = 30;
export const ACHIEVEMENT_BONUS_XP = 15;

export function habitAppliesOn(habit: Habit, date: string): boolean {
  if (habit.archived) return false;
  if (habit.createdAt.slice(0, 10) > date) return false;
  return habit.targetDays.includes(dayOfWeek(date));
}

export function getHabitsForDate(habits: Habit[], date: string): Habit[] {
  return habits.filter((h) => habitAppliesOn(h, date));
}

export interface DailyStats {
  total: number;
  completed: number;
  percent: number;
}

export function getDailyStats(habits: Habit[], logs: Record<string, HabitLog>, date: string): DailyStats {
  const applicable = getHabitsForDate(habits, date);
  const completed = applicable.filter((h) => logs[logKey(h.id, date)]?.completed).length;
  return {
    total: applicable.length,
    completed,
    percent: applicable.length > 0 ? Math.round((completed / applicable.length) * 100) : 0,
  };
}

export function isPerfectDay(habits: Habit[], logs: Record<string, HabitLog>, date: string): boolean {
  const stats = getDailyStats(habits, logs, date);
  return stats.total > 0 && stats.completed === stats.total;
}

/** Current consecutive-day streak for one habit, walking back from `asOf`. */
export function computeHabitStreak(habit: Habit, logs: Record<string, HabitLog>, asOf: string = todayISO()): number {
  let streak = 0;
  let cursor = asOf;
  for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
    if (cursor < habit.createdAt.slice(0, 10)) break;
    if (!habit.targetDays.includes(dayOfWeek(cursor))) {
      cursor = addDays(cursor, -1);
      continue;
    }
    const completed = logs[logKey(habit.id, cursor)]?.completed;
    const isToday = cursor === asOf;
    if (completed) {
      streak++;
      cursor = addDays(cursor, -1);
      continue;
    }
    if (isToday) {
      // Today isn't marked yet — streak is still "alive", just keep looking backward.
      cursor = addDays(cursor, -1);
      continue;
    }
    break;
  }
  return streak;
}

export function computeHabitBestStreak(habit: Habit, logs: Record<string, HabitLog>, asOf: string = todayISO()): number {
  let best = 0;
  let current = 0;
  let cursor = habit.createdAt.slice(0, 10);
  for (let i = 0; i < MAX_LOOKBACK_DAYS && cursor <= asOf; i++) {
    if (habit.targetDays.includes(dayOfWeek(cursor))) {
      if (logs[logKey(habit.id, cursor)]?.completed) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    cursor = addDays(cursor, 1);
  }
  return Math.max(best, current);
}

/** Consecutive-day streak of "perfect days" (all applicable habits completed). */
export function computeOverallStreak(habits: Habit[], logs: Record<string, HabitLog>, asOf: string = todayISO()): number {
  let streak = 0;
  let cursor = asOf;
  for (let i = 0; i < MAX_LOOKBACK_DAYS; i++) {
    const stats = getDailyStats(habits, logs, cursor);
    const isToday = cursor === asOf;
    if (stats.total === 0) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (stats.completed === stats.total) {
      streak++;
      cursor = addDays(cursor, -1);
      continue;
    }
    if (isToday) {
      cursor = addDays(cursor, -1);
      continue;
    }
    break;
  }
  return streak;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  emoji: string;
  check: (state: AppState) => boolean;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'first-step',
    title: 'First Step',
    description: 'Complete your very first habit.',
    emoji: '🌱',
    check: (state) => Object.values(state.logs).some((l) => l.completed),
  },
  {
    id: 'spark-3',
    title: '3-Day Spark',
    description: 'Reach a 3-day streak on any habit.',
    emoji: '🔥',
    check: (state) => state.habits.some((h) => computeHabitStreak(h, state.logs) >= 3),
  },
  {
    id: 'week-warrior',
    title: 'Week Warrior',
    description: 'Reach a 7-day streak on any habit.',
    emoji: '🗓️',
    check: (state) => state.habits.some((h) => computeHabitStreak(h, state.logs) >= 7),
  },
  {
    id: 'habit-builder-21',
    title: 'Habit Builder',
    description: 'Reach a 21-day streak on any habit.',
    emoji: '🧠',
    check: (state) => state.habits.some((h) => computeHabitStreak(h, state.logs) >= 21),
  },
  {
    id: 'month-master',
    title: 'Month Master',
    description: 'Reach a 30-day streak on any habit.',
    emoji: '🏆',
    check: (state) => state.habits.some((h) => computeHabitStreak(h, state.logs) >= 30),
  },
  {
    id: 'perfect-day',
    title: 'Perfect Day',
    description: 'Complete every habit scheduled for one day.',
    emoji: '🌟',
    check: (state) => isPerfectDay(state.habits, state.logs, todayISO()),
  },
  {
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'String together 7 perfect days in a row.',
    emoji: '💎',
    check: (state) => computeOverallStreak(state.habits, state.logs) >= 7,
  },
  {
    id: 'level-5',
    title: 'Level 5',
    description: 'Reach level 5.',
    emoji: '⚡',
    check: (state) => levelFromXp(state.user.xp).level >= 5,
  },
  {
    id: 'level-10',
    title: 'Level 10',
    description: 'Reach level 10.',
    emoji: '👑',
    check: (state) => levelFromXp(state.user.xp).level >= 10,
  },
  {
    id: 'challenge-champion',
    title: 'Challenge Champion',
    description: 'Complete a challenge.',
    emoji: '🎖️',
    check: (state) => state.challenges.some((c) => c.completedAt !== null),
  },
  {
    id: 'habit-collector',
    title: 'Habit Collector',
    description: 'Track 5 or more active habits.',
    emoji: '📋',
    check: (state) => state.habits.filter((h) => !h.archived).length >= 5,
  },
];

/** Returns IDs of achievements that are newly satisfied but not yet unlocked. */
export function findNewlyUnlockedAchievements(state: AppState): AchievementDef[] {
  const unlockedIds = new Set(state.achievements.filter((a) => a.unlockedAt).map((a) => a.id));
  return ACHIEVEMENT_DEFS.filter((def) => !unlockedIds.has(def.id) && def.check(state));
}
