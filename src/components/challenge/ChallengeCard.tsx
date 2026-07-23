import type { Challenge } from '@/types';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { computeChallengeProgress } from '@/lib/challenges';
import { addDays, formatFriendly, todayISO } from '@/lib/date';
import { useApp } from '@/context/AppProvider';

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const { state, leaveChallenge } = useApp();
  const progress = computeChallengeProgress(challenge, state.habits, state.logs);
  const endDate = addDays(challenge.startDate, challenge.durationDays - 1);
  const daysLeft = Math.max(0, Math.ceil((new Date(`${endDate}T00:00:00`).getTime() - new Date(`${todayISO()}T00:00:00`).getTime()) / 86400000));
  const linkedNames = state.habits.filter((h) => challenge.habitIds.includes(h.id)).map((h) => h.name);

  return (
    <Card className={`p-5 ${challenge.completedAt ? 'border-emerald-200 dark:border-emerald-500/25' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{challenge.emoji}</span>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">{challenge.title}</h3>
            <p className="text-xs text-slate-400">{linkedNames.join(', ') || 'No habit linked'}</p>
          </div>
        </div>
        {challenge.completedAt ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            {challenge.badgeEmoji} Completed
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {daysLeft}d left
          </span>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{challenge.description}</p>

      <div className="mt-4">
        <ProgressBar
          percent={progress.percent}
          colorClassName={challenge.completedAt ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-accent-teal'}
          label={`${progress.completedDays} / ${progress.totalDays} days`}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>
          {formatFriendly(challenge.startDate)} → {formatFriendly(endDate)}
        </span>
        <span className="font-semibold text-brand-600 dark:text-brand-400">+{challenge.xpReward} XP</span>
      </div>

      {!challenge.completedAt && (
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={() => leaveChallenge(challenge.id)}>
            Leave challenge
          </Button>
        </div>
      )}
    </Card>
  );
}
