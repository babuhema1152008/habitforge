import { motion } from 'framer-motion';
import type { Habit } from '@/types';
import { CATEGORIES } from '@/lib/categories';
import { computeHabitStreak } from '@/lib/gamification';
import { useApp } from '@/context/AppProvider';

interface HabitCardProps {
  habit: Habit;
  date: string;
  onEdit: (habit: Habit) => void;
}

export function HabitCard({ habit, date, onEdit }: HabitCardProps) {
  const { state, toggleLog } = useApp();
  const key = `${habit.id}_${date}`;
  const completed = state.logs[key]?.completed ?? false;
  const streak = computeHabitStreak(habit, state.logs, date);
  const category = CATEGORIES[habit.category];

  return (
    <motion.div
      layout
      className={`group flex items-center gap-3 rounded-xl2 border p-3.5 transition-colors sm:p-4 ${
        completed
          ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/25 dark:bg-emerald-500/[0.06]'
          : 'border-slate-200/70 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-surface-darkCard dark:hover:border-slate-700'
      }`}
    >
      <button
        onClick={() => toggleLog(habit.id, date)}
        aria-pressed={completed}
        aria-label={`Mark ${habit.name} as ${completed ? 'not done' : 'done'}`}
        className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl transition-transform active:scale-90"
        style={{ backgroundColor: `${category.color}1f` }}
      >
        <motion.span
          key={completed ? 'done' : 'todo'}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        >
          {completed ? '✅' : habit.emoji}
        </motion.span>
      </button>

      <button className="min-w-0 flex-1 text-left focus-ring rounded-lg" onClick={() => onEdit(habit)}>
        <p className={`truncate text-sm font-semibold sm:text-base ${completed ? 'text-slate-500 line-through decoration-emerald-400 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
          {habit.name}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <span>{category.emoji} {category.label}</span>
          {streak > 0 && (
            <span className="inline-flex items-center gap-0.5 font-semibold text-accent-amber">
              🔥 {streak}
            </span>
          )}
        </div>
      </button>

      <button
        onClick={() => toggleLog(habit.id, date)}
        className="focus-ring hidden shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 sm:inline-flex"
      >
        {completed ? 'Undo' : 'Mark done'}
      </button>
    </motion.div>
  );
}
