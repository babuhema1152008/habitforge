import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CircularProgress } from '@/components/ui/CircularProgress';
import { Avatar } from '@/components/ui/Avatar';
import { useApp } from '@/context/AppProvider';

export function StatsHeader() {
  const { state, todayStats, levelProgress, overallStreak } = useApp();

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="p-5 sm:col-span-2">
        <div className="flex items-center gap-4">
          <Avatar emoji={state.user.avatarEmoji} color={state.user.avatarColor} size={52} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Level {levelProgress.level}
            </p>
            <p className="truncate text-lg font-bold text-slate-800 dark:text-slate-100">{state.user.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total XP</p>
            <p className="text-lg font-bold text-brand-600 dark:text-brand-400">{state.user.xp}</p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar
            percent={levelProgress.percent}
            colorClassName="bg-gradient-to-r from-brand-500 to-accent-violet"
            label={`${levelProgress.xpIntoLevel} / ${levelProgress.xpForNextLevel} XP to Level ${levelProgress.level + 1}`}
          />
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold text-accent-amber">
            🔥 {overallStreak}-day streak
          </span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
            🏅 Best: {Math.max(state.user.bestOverallStreak, overallStreak)} days
          </span>
        </div>
      </Card>

      <Card className="flex flex-col items-center justify-center p-5">
        <CircularProgress percent={todayStats.percent} size={104} strokeWidth={9}>
          <div className="text-center">
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{todayStats.percent}%</p>
            <p className="text-[10px] font-semibold uppercase text-slate-400">today</p>
          </div>
        </CircularProgress>
        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          {todayStats.completed} / {todayStats.total} habits done
        </p>
      </Card>
    </div>
  );
}
