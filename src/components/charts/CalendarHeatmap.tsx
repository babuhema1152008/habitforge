import { useState } from 'react';
import { formatMonthYear, getMonthGrid, todayISO, WEEKDAY_LABELS_SHORT } from '@/lib/date';
import { getDailyStats } from '@/lib/gamification';
import { useApp } from '@/context/AppProvider';

function heatColor(percent: number, total: number): string {
  if (total === 0) return 'bg-slate-50 dark:bg-slate-800/40';
  if (percent === 0) return 'bg-rose-100 dark:bg-rose-500/10';
  if (percent < 50) return 'bg-amber-100 dark:bg-amber-500/15';
  if (percent < 100) return 'bg-emerald-200 dark:bg-emerald-500/25';
  return 'bg-emerald-500 dark:bg-emerald-500/80';
}

interface CalendarHeatmapProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function CalendarHeatmap({ selectedDate, onSelectDate }: CalendarHeatmapProps) {
  const { state } = useApp();
  const [cursor, setCursor] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const grid = getMonthGrid(cursor.getFullYear(), cursor.getMonth());
  const today = todayISO();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          aria-label="Previous month"
          className="focus-ring rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          ‹
        </button>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatMonthYear(cursor)}</h3>
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          aria-label="Next month"
          className="focus-ring rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAY_LABELS_SHORT.map((d, i) => (
          <span key={i} className="text-[10px] font-bold uppercase text-slate-400">
            {d}
          </span>
        ))}
        {grid.map((date, i) => {
          if (!date) return <div key={i} />;
          const stats = getDailyStats(state.habits, state.logs, date);
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const isFuture = date > today;
          return (
            <button
              key={date}
              onClick={() => !isFuture && onSelectDate(date)}
              disabled={isFuture}
              aria-label={`${date}, ${stats.completed} of ${stats.total} habits complete`}
              aria-pressed={isSelected}
              className={`focus-ring relative flex aspect-square items-center justify-center rounded-lg text-xs font-semibold transition-transform disabled:cursor-not-allowed disabled:opacity-40 ${heatColor(
                stats.percent,
                stats.total
              )} ${isSelected ? 'ring-2 ring-brand-600' : ''} ${stats.percent === 100 ? 'text-white' : 'text-slate-600 dark:text-slate-300'} ${!isFuture ? 'hover:scale-105' : ''}`}
            >
              {Number(date.slice(-2))}
              {isToday && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-brand-600" />}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-rose-100 dark:bg-rose-500/10" /> Missed</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-amber-100 dark:bg-amber-500/15" /> Partial</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-200 dark:bg-emerald-500/25" /> Mostly</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Perfect</span>
      </div>
    </div>
  );
}
