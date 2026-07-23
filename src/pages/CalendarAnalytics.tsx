import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { CalendarHeatmap } from '@/components/charts/CalendarHeatmap';
import { CompletionTrendChart } from '@/components/charts/CompletionTrendChart';
import { CategoryBreakdownChart } from '@/components/charts/CategoryBreakdownChart';
import { CATEGORIES } from '@/lib/categories';
import { formatFriendly, lastNDays, todayISO } from '@/lib/date';
import { computeHabitBestStreak, getHabitsForDate, logKey } from '@/lib/gamification';
import { useApp } from '@/context/AppProvider';

export function CalendarAnalytics() {
  const { state, toggleLog, overallStreak } = useApp();
  const today = todayISO();
  const [selectedDate, setSelectedDate] = useState(today);

  const dayHabits = useMemo(() => getHabitsForDate(state.habits, selectedDate), [state.habits, selectedDate]);

  const bestEverStreak = useMemo(
    () => Math.max(0, ...state.habits.map((h) => computeHabitBestStreak(h, state.logs))),
    [state.habits, state.logs]
  );

  const last30 = lastNDays(30);
  const monthlyCompletions = last30.reduce((sum, d) => {
    return sum + Object.values(state.logs).filter((l) => l.date === d && l.completed).length;
  }, 0);

  const avgCompletion = useMemo(() => {
    let totalPercent = 0;
    let count = 0;
    for (const d of last30) {
      const applicable = getHabitsForDate(state.habits, d);
      if (applicable.length === 0) continue;
      const completed = applicable.filter((h) => state.logs[logKey(h.id, d)]?.completed).length;
      totalPercent += (completed / applicable.length) * 100;
      count++;
    }
    return count > 0 ? Math.round(totalPercent / count) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.habits, state.logs]);

  const insightCards = [
    { label: 'Current Overall Streak', value: `${overallStreak} days`, emoji: '🔥' },
    { label: 'Best Habit Streak Ever', value: `${bestEverStreak} days`, emoji: '🏅' },
    { label: '30-Day Avg Completion', value: `${avgCompletion}%`, emoji: '📈' },
    { label: 'Completions (30 days)', value: `${monthlyCompletions}`, emoji: '✅' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Calendar & Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">See how consistent you've really been.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {insightCards.map((c) => (
          <Card key={c.label} className="p-4">
            <span className="text-xl" aria-hidden="true">{c.emoji}</span>
            <p className="mt-2 text-xl font-extrabold text-slate-800 dark:text-slate-100">{c.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{c.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 font-bold text-slate-800 dark:text-slate-100">30-Day Completion Trend</h2>
          <CompletionTrendChart days={30} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-bold text-slate-800 dark:text-slate-100">Completions by Category</h2>
          <CategoryBreakdownChart />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <CalendarHeatmap selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </Card>

        <Card className="p-5">
          <h3 className="mb-1 font-bold text-slate-800 dark:text-slate-100">{formatFriendly(selectedDate)}</h3>
          <p className="mb-4 text-xs text-slate-400">
            {selectedDate === today ? "Today's" : "That day's"} scheduled habits
          </p>
          {dayHabits.length === 0 ? (
            <p className="text-sm text-slate-400">No habits were scheduled this day.</p>
          ) : (
            <div className="space-y-2">
              {dayHabits.map((h) => {
                const completed = state.logs[logKey(h.id, selectedDate)]?.completed ?? false;
                return (
                  <button
                    key={h.id}
                    onClick={() => toggleLog(h.id, selectedDate)}
                    className={`focus-ring flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      completed
                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span aria-hidden="true">{completed ? '✅' : h.emoji}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">{h.name}</span>
                    <span className="text-[10px] font-semibold uppercase text-slate-400">{CATEGORIES[h.category].label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
