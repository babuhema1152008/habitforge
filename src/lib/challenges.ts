import type { Challenge, Habit, HabitLog } from '@/types';
import { addDays, todayISO } from '@/lib/date';
import { habitAppliesOn, logKey } from '@/lib/gamification';

export interface ChallengeProgress {
  completedDays: number;
  totalDays: number;
  percent: number;
  missedDays: number;
  endDate: string;
  isFinishedInTime: boolean; // duration has fully elapsed
  isSuccessful: boolean; // finished with zero missed days
}

export function computeChallengeProgress(
  challenge: Challenge,
  habits: Habit[],
  logs: Record<string, HabitLog>,
  asOf: string = todayISO()
): ChallengeProgress {
  const linkedHabits = habits.filter((h) => challenge.habitIds.includes(h.id));
  const endDate = addDays(challenge.startDate, challenge.durationDays - 1);

  let completedDays = 0;
  let missedDays = 0;
  let cursor = challenge.startDate;

  while (cursor <= endDate) {
    if (cursor > asOf) {
      cursor = addDays(cursor, 1);
      continue;
    }
    const applicable = linkedHabits.filter((h) => habitAppliesOn(h, cursor));
    const success = applicable.length === 0 || applicable.every((h) => logs[logKey(h.id, cursor)]?.completed);
    if (success) completedDays++;
    else missedDays++;
    cursor = addDays(cursor, 1);
  }

  const isFinishedInTime = asOf >= endDate;

  return {
    completedDays,
    totalDays: challenge.durationDays,
    percent: Math.round((completedDays / challenge.durationDays) * 100),
    missedDays,
    endDate,
    isFinishedInTime,
    isSuccessful: isFinishedInTime && missedDays === 0,
  };
}
