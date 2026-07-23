import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { StatsHeader } from '@/components/dashboard/StatsHeader';
import { WeeklySummary } from '@/components/dashboard/WeeklySummary';
import { CoachCard } from '@/components/dashboard/CoachCard';
import { HabitCard } from '@/components/habit/HabitCard';
import { HabitFormModal } from '@/components/habit/HabitFormModal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Confetti } from '@/components/ui/Confetti';
import { HabitCardSkeleton } from '@/components/ui/Skeleton';
import { getHabitsForDate } from '@/lib/gamification';
import { todayISO } from '@/lib/date';
import { findNewMilestones } from '@/lib/coach';
import { useApp } from '@/context/AppProvider';
import type { Habit } from '@/types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard() {
  const { state, todayStats, ackPerfectDayCelebration, celebrateMilestone } = useApp();
  const today = todayISO();
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [milestoneBanner, setMilestoneBanner] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (todayStats.total > 0 && todayStats.percent === 100 && state.lastCelebratedPerfectDay !== today) {
      setCelebrate(true);
      ackPerfectDayCelebration(today);
      const t = window.setTimeout(() => setCelebrate(false), 2600);
      return () => window.clearTimeout(t);
    }
  }, [todayStats.percent, todayStats.total, state.lastCelebratedPerfectDay, today, ackPerfectDayCelebration]);

  // Coach milestone celebrations — fire confetti once per newly reached streak milestone.
  useEffect(() => {
    const milestones = findNewMilestones(state);
    if (milestones.length === 0) return;
    const top = milestones[0];
    setMilestoneBanner(`🎉 ${top.streak}-Day Milestone! "${top.habit.name}" is on fire.`);
    for (const m of milestones) celebrateMilestone(m.habit.id, m.streak);
    const t = window.setTimeout(() => setMilestoneBanner(null), 2800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.logs]);

  const todaysHabits = useMemo(() => getHabitsForDate(state.habits, today), [state.habits, today]);
  const pending = todaysHabits.filter((h) => !state.logs[`${h.id}_${today}`]?.completed);
  const done = todaysHabits.filter((h) => state.logs[`${h.id}_${today}`]?.completed);
  const recentAchievements = state.achievements.slice(-3).reverse();

  function openAdd() {
    setEditingHabit(null);
    setModalOpen(true);
  }
  function openEdit(habit: Habit) {
    setEditingHabit(habit);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>{(celebrate || milestoneBanner) && <Confetti />}</AnimatePresence>
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            className="fixed left-1/2 top-6 z-[120] -translate-x-1/2 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-teal px-6 py-3 text-center text-white shadow-2xl"
          >
            <p className="text-sm font-extrabold">🎉 Perfect Day! All habits complete.</p>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {milestoneBanner && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            className="fixed left-1/2 top-6 z-[120] -translate-x-1/2 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-3 text-center text-white shadow-2xl"
          >
            <p className="text-sm font-extrabold">{milestoneBanner}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
            {getGreeting()}, {state.user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button onClick={openAdd}>+ Add Habit</Button>
      </div>

      <StatsHeader />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 font-bold text-slate-800 dark:text-slate-100">Today's Habits</h2>

            {loading ? (
              <div className="space-y-3">
                <HabitCardSkeleton />
                <HabitCardSkeleton />
                <HabitCardSkeleton />
              </div>
            ) : todaysHabits.length === 0 ? (
              <EmptyState
                emoji="🌱"
                title="No habits scheduled for today"
                description="Add your first habit — drink water, exercise, or read for 20 minutes — and start your streak."
                action={<Button onClick={openAdd}>+ Add Your First Habit</Button>}
              />
            ) : (
              <div className="space-y-3">
                {pending.length > 0 && (
                  <div className="space-y-2.5">
                    {pending.map((h) => (
                      <HabitCard key={h.id} habit={h} date={today} onEdit={openEdit} />
                    ))}
                  </div>
                )}
                {done.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Completed ({done.length})
                    </p>
                    <div className="space-y-2.5">
                      {done.map((h) => (
                        <HabitCard key={h.id} habit={h} date={today} onEdit={openEdit} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <CoachCard />

          <WeeklySummary />

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Recent Achievements</h3>
              <Link to="/profile" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
                View all
              </Link>
            </div>
            {recentAchievements.length === 0 ? (
              <p className="text-sm text-slate-400">Complete a habit to unlock your first badge.</p>
            ) : (
              <div className="space-y-2.5">
                {recentAchievements.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                    <span className="text-xl" aria-hidden="true">{a.emoji}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{a.title}</p>
                      <p className="truncate text-xs text-slate-400">{a.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <HabitFormModal open={modalOpen} onClose={() => setModalOpen(false)} habit={editingHabit} />
    </div>
  );
}
