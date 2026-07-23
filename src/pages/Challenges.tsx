import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChallengeCard } from '@/components/challenge/ChallengeCard';
import { NewChallengeModal } from '@/components/challenge/NewChallengeModal';
import { Leaderboard } from '@/components/challenge/Leaderboard';
import { CHALLENGE_TEMPLATES, type ChallengeTemplate } from '@/lib/challengeTemplates';
import { useApp } from '@/context/AppProvider';

export function Challenges() {
  const { state } = useApp();
  const [modalTemplate, setModalTemplate] = useState<ChallengeTemplate | null | undefined>(undefined);

  const active = state.challenges.filter((c) => !c.completedAt);
  const completed = state.challenges.filter((c) => c.completedAt);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Challenges</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Commit to a streak. Come back every day. Earn the badge.</p>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Start a Challenge</h2>
          <Button variant="outline" size="sm" onClick={() => setModalTemplate(null)}>
            + Custom Challenge
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {CHALLENGE_TEMPLATES.map((t) => (
            <Card key={t.templateId} className="flex flex-col p-5">
              <span className="text-2xl" aria-hidden="true">{t.emoji}</span>
              <h3 className="mt-2 font-bold text-slate-800 dark:text-slate-100">{t.title}</h3>
              <p className="mt-1.5 flex-1 text-sm text-slate-500 dark:text-slate-400">{t.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">{t.durationDays} days</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">+{t.xpReward} XP</span>
              </div>
              <Button className="mt-4" size="sm" onClick={() => setModalTemplate(t)}>
                Start Challenge
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-bold text-slate-800 dark:text-slate-100">In Progress</h2>
        {active.length === 0 ? (
          <EmptyState emoji="🏁" title="No active challenges" description="Start one above to build momentum toward a bigger streak." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        )}
      </div>

      {completed.length > 0 && (
        <div>
          <h2 className="mb-3 font-bold text-slate-800 dark:text-slate-100">Completed</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </div>
        </div>
      )}

      <Leaderboard />

      <NewChallengeModal
        open={modalTemplate !== undefined}
        onClose={() => setModalTemplate(undefined)}
        template={modalTemplate ?? null}
      />
    </div>
  );
}
