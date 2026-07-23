import type { CoachAction, CoachMessage, CoachMessageType } from '@/types';
import { Button } from '@/components/ui/Button';

const ACCENTS: Record<CoachMessageType, string> = {
  'streak-protection': 'border-l-rose-500',
  comeback: 'border-l-amber-500',
  milestone: 'border-l-emerald-500',
  'weekly-review': 'border-l-sky-500',
  'pattern-reminder': 'border-l-violet-500',
  'challenge-suggestion': 'border-l-brand-500',
  'struggle-support': 'border-l-amber-500',
  motivation: 'border-l-slate-300 dark:border-l-slate-600',
};

interface CoachMessageCardProps {
  message: CoachMessage;
  onAction: (action: CoachAction) => void;
  onDismiss?: (id: string) => void;
  compact?: boolean;
}

export function CoachMessageCard({ message, onAction, onDismiss, compact }: CoachMessageCardProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border-l-4 bg-slate-50 dark:bg-slate-800/50 ${ACCENTS[message.type]} ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <span className={compact ? 'text-lg' : 'text-xl'} aria-hidden="true">
        {message.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-bold text-slate-800 dark:text-slate-100 ${compact ? 'text-sm' : 'text-base'}`}>{message.title}</p>
        <p className={`mt-0.5 text-slate-600 dark:text-slate-300 ${compact ? 'text-xs' : 'text-sm'}`}>{message.body}</p>
        {message.action && (
          <Button size="sm" className="mt-3" onClick={() => onAction(message.action!)}>
            {message.action.label}
          </Button>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={() => onDismiss(message.id)}
          aria-label="Dismiss message"
          className="focus-ring shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
