import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { COACH_EMOJI, COACH_NAME } from '@/lib/coach';
import { CoachMessageCard } from '@/components/coach/CoachMessageCard';
import { useCoachActions } from '@/components/coach/useCoachActions';
import { useApp } from '@/context/AppProvider';

interface CoachWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CoachWidget({ open, onOpenChange }: CoachWidgetProps) {
  const { coachMessages } = useApp();
  const runAction = useCoachActions();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = coachMessages.filter((m) => !dismissed.includes(m.id));
  const urgentCount = visible.filter((m) => m.priority >= 70).length;

  return (
    <>
      <button
        onClick={() => onOpenChange(!open)}
        aria-label={open ? 'Close AI coach' : 'Open AI coach'}
        aria-expanded={open}
        className="focus-ring fixed bottom-24 left-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-accent-violet text-2xl text-white shadow-xl transition-transform hover:scale-105 active:scale-95 md:bottom-6"
      >
        <span aria-hidden="true">{open ? '✕' : COACH_EMOJI}</span>
        {!open && urgentCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-surface-dark">
            {urgentCount}
          </span>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              role="dialog"
              aria-label="AI Habit Coach"
              className="fixed bottom-40 left-4 z-40 flex max-h-[65vh] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl2 border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-surface-darkCard md:bottom-24"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-brand-600 to-accent-violet px-4 py-3.5 dark:border-slate-800">
                <span className="text-2xl" aria-hidden="true">{COACH_EMOJI}</span>
                <div>
                  <p className="text-sm font-extrabold text-white">{COACH_NAME}</p>
                  <p className="text-[11px] text-brand-50">Your AI Habit Coach</p>
                </div>
              </div>
              <div className="flex-1 space-y-2.5 overflow-y-auto scrollbar-thin p-3">
                {visible.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-400">
                    You're all caught up — nothing urgent right now. 🎉
                  </p>
                ) : (
                  visible.map((m) => (
                    <CoachMessageCard
                      key={m.id}
                      message={m}
                      onAction={runAction}
                      onDismiss={(id) => setDismissed((prev) => [...prev, id])}
                      compact
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
