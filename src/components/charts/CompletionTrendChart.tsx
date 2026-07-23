import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { lastNDays, formatFriendly } from '@/lib/date';
import { getDailyStats } from '@/lib/gamification';
import { useApp } from '@/context/AppProvider';

export function CompletionTrendChart({ days = 30 }: { days?: number }) {
  const { state } = useApp();
  const data = lastNDays(days).map((date) => {
    const stats = getDailyStats(state.habits, state.logs, date);
    return { date, percent: stats.percent, label: formatFriendly(date) };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            interval={Math.floor(days / 6)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            formatter={(value: number) => [`${value}%`, 'Completion']}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
          />
          <Area type="monotone" dataKey="percent" stroke="#4f46e5" strokeWidth={2.5} fill="url(#trendFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
