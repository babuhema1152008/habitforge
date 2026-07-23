import { useOutletContext } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { CoachMessageCard } from '@/components/coach/CoachMessageCard';
import { useCoachActions } from '@/components/coach/useCoachActions';
import { COACH_EMOJI, COACH_NAME } from '@/lib/coach';
import { useApp } from '@/context/AppProvider';
import type { AppShellContext } from '@/components/layout/AppShell';

export function CoachCard() {
  const { coachMessages } = useApp();
  const runAction = useCoachActions();
  const { openCoachPanel } = useOutletContext<AppShellContext>();

  const top = coachMessages[0];
  const restCount = Math.max(0, coachMessages.length - 1);

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
          <span aria-hidden="true">{COACH_EMOJI}</span> Coach {COACH_NAME}
        </h3>
        <button
          onClick={openCoachPanel}
          className="focus-ring text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          {restCount > 0 ? `+${restCount} more` : 'Open coach'}
        </button>
      </div>
      {top ? (
        <CoachMessageCard message={top} onAction={runAction} />
      ) : (
        <p className="text-sm text-slate-400">Your coach is warming up...</p>
      )}
    </Card>
  );
}
