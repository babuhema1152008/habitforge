import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CATEGORIES } from '@/lib/categories';
import { useApp } from '@/context/AppProvider';
import type { HabitCategory } from '@/types';

export function CategoryBreakdownChart() {
  const { state } = useApp();

  const counts: Record<string, number> = {};
  for (const log of Object.values(state.logs)) {
    if (!log.completed) continue;
    const habit = state.habits.find((h) => h.id === log.habitId);
    if (!habit) continue;
    counts[habit.category] = (counts[habit.category] ?? 0) + 1;
  }

  const data = Object.entries(counts).map(([category, value]) => ({
    name: CATEGORIES[category as HabitCategory].label,
    value,
    color: CATEGORIES[category as HabitCategory].color,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-slate-400">
        No completions yet — check off a habit to see the breakdown.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
            {d.name} ({d.value})
          </span>
        ))}
      </div>
    </div>
  );
}
