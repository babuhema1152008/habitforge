import { Card } from '@/components/ui/Card';
import { lastNDays } from '@/lib/date';
import { getDailyStats } from '@/lib/gamification';
import { useApp } from '@/context/AppProvider';

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function WeeklySummary() {
  const { state } = useApp();
  const days = lastNDays(7);
  const stats = days.map((d) => ({ date: d, ...getDailyStats(state.habits, state.logs, d) }));
  const totalCompleted = stats.reduce((sum, s) => sum + s.completed, 0);
  const totalPossible = stats.reduce((sum, s) => sum + s.total, 0);
  const weekPercent = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">This Week</h3>
        <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">{weekPercent}% complete</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        {stats.map((s, i) => {
          const height = s.total > 0 ? Math.max(6, (s.percent / 100) * 64) : 4;
          const isToday = i === stats.length - 1;
          return (
            <div key={s.date} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-16 w-full items-end justify-center">
                <div
                  className={`w-full max-w-[22px] rounded-md transition-all ${
                    s.percent === 100 ? 'bg-emerald-500' : s.total === 0 ? 'bg-slate-100 dark:bg-slate-800' : 'bg-brand-400'
                  }`}
                  style={{ height }}
                />
              </div>
              <span className={`text-[10px] font-bold ${isToday ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>
                {DAY_INITIALS[new Date(`${s.date}T00:00:00`).getDay()]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        You completed <strong className="font-semibold text-slate-700 dark:text-slate-200">{totalCompleted}</strong> of{' '}
        {totalPossible} scheduled habits this week. Keep it up!
      </p>
    </Card>
  );
}
