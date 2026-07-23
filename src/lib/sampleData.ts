import type { AppState, Challenge, Habit, HabitLog, UserProfile } from '@/types';
import { generateId } from '@/lib/id';
import { addDays, todayISO } from '@/lib/date';
import { logKey, xpForCompletion, computeHabitStreak, levelFromXp } from '@/lib/gamification';
import { CHALLENGE_TEMPLATES } from '@/lib/challengeTemplates';

const ALL_DAYS: Habit['targetDays'] = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS: Habit['targetDays'] = [1, 2, 3, 4, 5];

function makeHabit(partial: Omit<Habit, 'id' | 'archived'>): Habit {
  return { id: generateId('habit'), archived: false, ...partial };
}

export function createSampleState(): AppState {
  const today = todayISO();

  const habits: Habit[] = [
    makeHabit({
      name: 'Drink Water',
      emoji: '💧',
      category: 'health',
      color: '#14b8a6',
      createdAt: addDays(today, -25),
      targetDays: ALL_DAYS,
      notes: '8 glasses a day keeps the doctor away.',
    }),
    makeHabit({
      name: 'Exercise',
      emoji: '💪',
      category: 'fitness',
      color: '#f43f5e',
      createdAt: addDays(today, -25),
      targetDays: ALL_DAYS,
      reminderTime: '07:00',
    }),
    makeHabit({
      name: 'Read 20 Minutes',
      emoji: '📖',
      category: 'learning',
      color: '#f59e0b',
      createdAt: addDays(today, -18),
      targetDays: ALL_DAYS,
    }),
    makeHabit({
      name: 'Meditate',
      emoji: '🧘',
      category: 'mindfulness',
      color: '#8b5cf6',
      createdAt: addDays(today, -15),
      targetDays: ALL_DAYS,
      reminderTime: '21:30',
    }),
    makeHabit({
      name: 'Study Python',
      emoji: '🐍',
      category: 'learning',
      color: '#4f46e5',
      createdAt: addDays(today, -10),
      targetDays: WEEKDAYS,
    }),
  ];

  const logs: Record<string, HabitLog> = {};

  // Deterministic-ish "mostly consistent, a few gaps" pattern per habit, generated
  // once as seed data. The most recent few days lean toward completed so the
  // dashboard and streak counters look alive on first run.
  const skipPatterns: Record<string, number[]> = {
    [habits[0].id]: [4, 11], // Drink Water — a couple of missed days
    [habits[1].id]: [2, 9, 16], // Exercise
    [habits[2].id]: [6, 13],
    [habits[3].id]: [3],
    [habits[4].id]: [5],
  };

  for (const habit of habits) {
    const created = habit.createdAt;
    let cursor = created;
    let dayIndex = 0;
    while (cursor < today) {
      const dow = new Date(`${cursor}T00:00:00`).getDay();
      if (habit.targetDays.includes(dow as Habit['targetDays'][number])) {
        const skip = skipPatterns[habit.id]?.includes(dayIndex) ?? false;
        if (!skip) {
          const streakSoFar = computeHabitStreak(habit, logs, addDays(cursor, -1)) + 1;
          logs[logKey(habit.id, cursor)] = {
            habitId: habit.id,
            date: cursor,
            completed: true,
            xpAwarded: xpForCompletion(streakSoFar),
            completedAt: new Date(`${cursor}T09:00:00`).toISOString(),
          };
        }
      }
      dayIndex++;
      cursor = addDays(cursor, 1);
    }
  }

  // Leave "today" partially complete so the dashboard demonstrates the core loop.
  const waterKey = logKey(habits[0].id, today);
  const exerciseKey = logKey(habits[1].id, today);
  logs[waterKey] = {
    habitId: habits[0].id,
    date: today,
    completed: true,
    xpAwarded: xpForCompletion(computeHabitStreak(habits[0], logs, addDays(today, -1)) + 1),
    completedAt: new Date().toISOString(),
  };
  logs[exerciseKey] = {
    habitId: habits[1].id,
    date: today,
    completed: true,
    xpAwarded: xpForCompletion(computeHabitStreak(habits[1], logs, addDays(today, -1)) + 1),
    completedAt: new Date().toISOString(),
  };

  const totalXp = Object.values(logs).reduce((sum, l) => sum + (l.completed ? l.xpAwarded : 0), 0);

  const user: UserProfile = {
    id: generateId('user'),
    name: 'Alex Rivera',
    email: 'alex@example.com',
    avatarColor: '#4f46e5',
    avatarEmoji: '🦊',
    createdAt: addDays(today, -25),
    xp: totalXp,
    level: levelFromXp(totalXp).level,
    bestOverallStreak: 6,
  };

  const challenges: Challenge[] = [
    {
      id: generateId('challenge'),
      title: CHALLENGE_TEMPLATES[0].title,
      description: CHALLENGE_TEMPLATES[0].description,
      emoji: CHALLENGE_TEMPLATES[0].emoji,
      durationDays: 7,
      startDate: addDays(today, -6),
      habitIds: [habits[1].id],
      templateId: '7-day',
      xpReward: CHALLENGE_TEMPLATES[0].xpReward,
      badgeEmoji: CHALLENGE_TEMPLATES[0].badgeEmoji,
      completedAt: null,
      joined: true,
    },
    {
      id: generateId('challenge'),
      title: CHALLENGE_TEMPLATES[1].title,
      description: CHALLENGE_TEMPLATES[1].description,
      emoji: CHALLENGE_TEMPLATES[1].emoji,
      durationDays: 21,
      startDate: addDays(today, -10),
      habitIds: [habits[4].id],
      templateId: '21-day',
      xpReward: CHALLENGE_TEMPLATES[1].xpReward,
      badgeEmoji: CHALLENGE_TEMPLATES[1].badgeEmoji,
      completedAt: null,
      joined: true,
    },
  ];

  return {
    isAuthenticated: true,
    user,
    habits,
    logs,
    challenges,
    achievements: [],
    settings: {
      theme: 'light',
      weekStartsOn: 0,
      reminderNotesEnabled: true,
    },
    lastCelebratedPerfectDay: null,
    coachState: { celebratedMilestones: {} },
  };
}
