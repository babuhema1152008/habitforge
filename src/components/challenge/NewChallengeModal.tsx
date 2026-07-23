import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { ChallengeTemplate } from '@/lib/challengeTemplates';
import { useApp } from '@/context/AppProvider';

interface NewChallengeModalProps {
  open: boolean;
  onClose: () => void;
  template: ChallengeTemplate | null; // null = custom challenge
}

export function NewChallengeModal({ open, onClose, template }: NewChallengeModalProps) {
  const { state, joinTemplateChallenge, createCustomChallenge } = useApp();
  const activeHabits = state.habits.filter((h) => !h.archived);

  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [durationDays, setDurationDays] = useState(14);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelectedHabitIds(activeHabits[0] ? [activeHabits[0].id] : []);
    setTitle('');
    setDescription('');
    setEmoji('🎯');
    setDurationDays(14);
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template]);

  function toggleHabit(id: string) {
    setSelectedHabitIds((prev) => (prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]));
  }

  function handleSubmit() {
    if (selectedHabitIds.length === 0) {
      setError('Pick at least one habit for this challenge.');
      return;
    }
    if (template) {
      joinTemplateChallenge(template.templateId, selectedHabitIds);
    } else {
      if (!title.trim()) {
        setError('Give your challenge a title.');
        return;
      }
      if (durationDays < 1 || durationDays > 365) {
        setError('Duration must be between 1 and 365 days.');
        return;
      }
      createCustomChallenge({
        title: title.trim(),
        description: description.trim() || `A ${durationDays}-day custom challenge.`,
        emoji,
        durationDays,
        habitIds: selectedHabitIds,
      });
    }
    onClose();
  }

  if (activeHabits.length === 0) {
    return (
      <Modal open={open} onClose={onClose} title={template ? template.title : 'Custom Challenge'}>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          You need at least one active habit before starting a challenge. Add a habit from your Dashboard first.
        </p>
        <div className="mt-5 flex justify-end">
          <Button onClick={onClose}>Got it</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={template ? template.title : 'New Custom Challenge'}>
      <div className="space-y-5">
        {template && <p className="text-sm text-slate-500 dark:text-slate-400">{template.description}</p>}

        {!template && (
          <>
            <div>
              <label htmlFor="c-title" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Title
              </label>
              <input
                id="c-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. No Sugar November"
                className="focus-ring w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="grid grid-cols-[1fr,90px] gap-3">
              <div>
                <label htmlFor="c-desc" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Description
                </label>
                <input
                  id="c-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you committing to?"
                  className="focus-ring w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="c-emoji" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Icon
                </label>
                <input
                  id="c-emoji"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
                  className="focus-ring w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-center text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
            <div>
              <label htmlFor="c-duration" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Duration (days)
              </label>
              <input
                id="c-duration"
                type="number"
                min={1}
                max={365}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="focus-ring w-32 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </>
        )}

        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">Which habit(s) count toward this?</p>
          <div className="max-h-48 space-y-1.5 overflow-y-auto scrollbar-thin">
            {activeHabits.map((h) => (
              <label
                key={h.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <input
                  type="checkbox"
                  checked={selectedHabitIds.includes(h.id)}
                  onChange={() => toggleHabit(h.id)}
                  className="focus-ring h-4 w-4 rounded border-slate-300 text-brand-600"
                />
                <span aria-hidden="true">{h.emoji}</span>
                <span className="text-slate-700 dark:text-slate-200">{h.name}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Start Challenge</Button>
        </div>
      </div>
    </Modal>
  );
}
