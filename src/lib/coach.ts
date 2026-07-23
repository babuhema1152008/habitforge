import type { AppState, CoachMessage, Habit } from '@/types';
import { addDays, lastNDays, todayISO } from '@/lib/date';
import { computeHabitStreak, getDailyStats, getHabitsForDate, habitAppliesOn, logKey } from '@/lib/gamification';

export const COACH_NAME = 'Nova';
export const COACH_EMOJI = '🤖';

/** Streak lengths (in days) that trigger a one-time milestone celebration. */
export const MILESTONE_THRESHOLDS = [3, 7, 14, 21, 30, 50, 75, 100];

const MOTIVATIONAL_QUOTES = [
  "Small steps, repeated daily, beat big leaps taken rarely. Let's go.",
  "You don't need to be perfect today — you just need to show up.",
  "Every habit you check off is a vote for the person you're becoming.",
  "Discipline is just self-respect in action. Make today count.",
  "Momentum is easier to keep than to build. Don't stop now.",
  "The best time to build a habit was a month ago. The second best time is right now.",
  "Progress, not perfection. One habit at a time.",
  "Future you is watching. Give them something to thank you for.",
];

function pickDailyQuote(date: string): string {
  // Stable per day rather than random-per-render, using the date's day-of-year as a seed.
  const dayOfYear = Math.floor(new Date(`${date}T00:00:00`).getTime() / 86400000);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

function alreadyCelebrated(state: AppState, habitId: string, streak: number): boolean {
  return (state.coachState.celebratedMilestones[habitId] ?? []).includes(streak);
}

/** Generates a prioritized feed of coach messages from current app state. Pure — no side effects. */
export function generateCoachMessages(state: AppState, now: Date = new Date()): CoachMessage[] {
  const messages: CoachMessage[] = [];
  const today = todayISO();
  const activeHabits = state.habits.filter((h) => !h.archived);
  const todaysHabits = getHabitsForDate(state.habits, today);
  const pending = todaysHabits.filter((h) => !state.logs[logKey(h.id, today)]?.completed);
  const hour = now.getHours();

  // 1. Streak protection — it's evening and a valuable streak is still at risk.
  if (hour >= 17 && pending.length > 0) {
    const withStreak = pending
      .map((h) => ({ habit: h, streak: computeHabitStreak(h, state.logs, addDays(today, -1)) }))
      .filter((x) => x.streak >= 2)
      .sort((a, b) => b.streak - a.streak);

    if (withStreak.length > 0) {
      const top = withStreak[0];
      const habitWord = pending.length === 1 ? 'habit' : 'habits';
      messages.push({
        id: `streak-protection_${today}_${top.habit.id}`,
        type: 'streak-protection',
        priority: 95,
        emoji: '🔥',
        title: "Don't break your streak!",
        body:
          pending.length === 1
            ? `Only one habit left — don't break your ${top.streak}-day streak on "${top.habit.name}"!`
            : `Only ${pending.length} ${habitWord} left today, and your ${top.streak}-day streak on "${top.habit.name}" is on the line.`,
        action: { kind: 'complete-habit', label: `Mark "${top.habit.name}" done`, habitId: top.habit.id },
      });
    }
  }

  // 2. Comeback support — a habit's streak just broke.
  const brokenStreak = activeHabits.find((h) => {
    if (!habitAppliesOn(h, addDays(today, -1))) return false;
    const yesterdayCompleted = state.logs[logKey(h.id, addDays(today, -1))]?.completed;
    const hadHistory = Object.values(state.logs).some((l) => l.habitId === h.id && l.completed);
    return !yesterdayCompleted && hadHistory && computeHabitStreak(h, state.logs, today) === 0;
  });
  if (brokenStreak) {
    messages.push({
      id: `comeback_${today}_${brokenStreak.id}`,
      type: 'comeback',
      priority: 80,
      emoji: '💛',
      title: "Missing a day is okay — quitting isn't.",
      body: `You missed "${brokenStreak.name}" yesterday. Let's get back on track today — one rep rebuilds the habit.`,
      action: { kind: 'complete-habit', label: `Restart "${brokenStreak.name}"`, habitId: brokenStreak.id },
    });
  }

  // 3. Milestone celebrations (not yet acknowledged for this habit+streak).
  for (const h of activeHabits) {
    const streak = computeHabitStreak(h, state.logs, today);
    const milestone = MILESTONE_THRESHOLDS.find((m) => m === streak);
    if (milestone && !alreadyCelebrated(state, h.id, milestone)) {
      messages.push({
        id: `milestone_${h.id}_${milestone}`,
        type: 'milestone',
        priority: 90,
        emoji: '🎉',
        title: `${milestone}-Day Milestone!`,
        body: `"${h.name}" just hit a ${milestone}-day streak. That's real consistency — be proud of this one.`,
      });
    }
  }

  // 4. Weekly performance review — this week vs. last week completion rate.
  const thisWeekDays = lastNDays(7, today);
  const lastWeekDays = lastNDays(7, addDays(today, -7));
  const sumStats = (days: string[]) =>
    days.reduce(
      (acc, d) => {
        const s = getDailyStats(state.habits, state.logs, d);
        return { completed: acc.completed + s.completed, total: acc.total + s.total };
      },
      { completed: 0, total: 0 }
    );
  const thisWeek = sumStats(thisWeekDays);
  const lastWeek = sumStats(lastWeekDays);
  const thisWeekPct = thisWeek.total > 0 ? Math.round((thisWeek.completed / thisWeek.total) * 100) : 0;
  const lastWeekPct = lastWeek.total > 0 ? Math.round((lastWeek.completed / lastWeek.total) * 100) : 0;

  if (thisWeek.total > 0) {
    let body: string;
    if (lastWeek.total === 0) {
      body = `You've completed ${thisWeekPct}% of your goals this week. Keep building that baseline!`;
    } else if (thisWeekPct > lastWeekPct) {
      body = `You've completed ${thisWeekPct}% of your goals this week — better than last week's ${lastWeekPct}%. Keep climbing!`;
    } else if (thisWeekPct === lastWeekPct) {
      body = `You're holding steady at ${thisWeekPct}% this week, same as last week. Consistent is good — let's push a little higher.`;
    } else {
      body = `You're at ${thisWeekPct}% this week, down from ${lastWeekPct}% last week. No judgment — let's tighten it up over the next few days.`;
    }
    messages.push({
      id: `weekly-review_${today}`,
      type: 'weekly-review',
      priority: 60,
      emoji: '📊',
      title: 'Weekly Performance Review',
      body,
      action: { kind: 'view-calendar', label: 'View full analytics' },
    });
  }

  // 5. Pattern-based reminder — habit has a reminder time close to now and isn't done yet.
  const nowMinutes = hour * 60 + now.getMinutes();
  const patternHabit = pending.find((h) => {
    if (!h.reminderTime) return false;
    const [rh, rm] = h.reminderTime.split(':').map(Number);
    const reminderMinutes = rh * 60 + rm;
    return nowMinutes >= reminderMinutes - 15 && nowMinutes <= reminderMinutes + 60;
  });
  if (patternHabit) {
    messages.push({
      id: `pattern-reminder_${today}_${patternHabit.id}`,
      type: 'pattern-reminder',
      priority: 70,
      emoji: '⏰',
      title: 'Right on schedule',
      body: `You usually do "${patternHabit.name}" around ${patternHabit.reminderTime}. It's time to keep the momentum going!`,
      action: { kind: 'complete-habit', label: `Mark "${patternHabit.name}" done`, habitId: patternHabit.id },
    });
  }

  // 6. Adaptive support when the trailing week has been rough.
  if (thisWeek.total > 0 && thisWeekPct < 50) {
    const easiest = [...activeHabits].sort(
      (a, b) => computeHabitStreak(b, state.logs, today) - computeHabitStreak(a, state.logs, today)
    )[0];
    messages.push({
      id: `struggle-support_${today}`,
      type: 'struggle-support',
      priority: 75,
      emoji: '🌤️',
      title: "Rough week? Let's simplify.",
      body: easiest
        ? `This week's been tough — that happens. Let's focus on just "${easiest.name}" today. Small wins rebuild momentum fast.`
        : "This week's been tough — that happens. Pick just one habit today and give it everything. Small wins rebuild momentum fast.",
      action: easiest ? { kind: 'complete-habit', label: `Mark "${easiest.name}" done`, habitId: easiest.id } : undefined,
    });
  }

  // 7. Dynamic challenge suggestion when there's no active challenge.
  const hasActiveChallenge = state.challenges.some((c) => !c.completedAt);
  if (!hasActiveChallenge && activeHabits.length >= 2) {
    messages.push({
      id: `challenge-suggestion_${today}`,
      type: 'challenge-suggestion',
      priority: 50,
      emoji: '🛡️',
      title: 'Challenge accepted?',
      body: 'Complete all of your habits for the next 7 days straight to earn the "Iron Will" badge.',
      action: { kind: 'start-iron-will-challenge', label: 'Accept the Iron Will Challenge' },
    });
  }

  // 8. Fallback daily motivation — always present, lowest priority.
  messages.push({
    id: `motivation_${today}`,
    type: 'motivation',
    priority: 10,
    emoji: '✨',
    title: 'Daily motivation',
    body: pickDailyQuote(today),
  });

  return messages.sort((a, b) => b.priority - a.priority);
}

export function findNewMilestones(state: AppState, habits: Habit[] = state.habits): { habit: Habit; streak: number }[] {
  const today = todayISO();
  const found: { habit: Habit; streak: number }[] = [];
  for (const h of habits.filter((h) => !h.archived)) {
    const streak = computeHabitStreak(h, state.logs, today);
    const milestone = MILESTONE_THRESHOLDS.find((m) => m === streak);
    if (milestone && !alreadyCelebrated(state, h.id, milestone)) {
      found.push({ habit: h, streak: milestone });
    }
  }
  return found;
}
