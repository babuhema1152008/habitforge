import { useEffect, useState } from 'react';
import type { DayOfWeek, Habit, HabitCategory } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CATEGORIES, CATEGORY_ORDER, HABIT_EMOJI_PRESETS } from '@/lib/categories';
import { WEEKDAY_LABELS_SHORT } from '@/lib/date';
import { useApp } from '@/context/AppProvider';

interface HabitFormModalProps {
  open: boolean;
  onClose: () => void;
  habit?: Habit | null;
}

const ALL_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

export function HabitFormModal({ open, onClose, habit }: HabitFormModalProps) {
  const { addHabit, updateHabit, deleteHabit, archiveHabit } = useApp();
  const isEdit = Boolean(habit);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(HABIT_EMOJI_PRESETS[0]);
  const [category, setCategory] = useState<HabitCategory>('health');
  const [targetDays, setTargetDays] = useState<DayOfWeek[]>(ALL_DAYS);
  const [reminderTime, setReminderTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (habit) {
      setName(habit.name);
      setEmoji(habit.emoji);
      setCategory(habit.category);
      setTargetDays(habit.targetDays);
      setReminderTime(habit.reminderTime ?? '');
      setNotes(habit.notes ?? '');
    } else {
      setName('');
      setEmoji(HABIT_EMOJI_PRESETS[0]);
      setCategory('health');
      setTargetDays(ALL_DAYS);
      setReminderTime('');
      setNotes('');
    }
    setError('');
  }, [open, habit]);

  function toggleDay(day: DayOfWeek) {
    setTargetDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  function handleSubmit() {
    if (!name.trim()) {
      setError('Give your habit a name.');
      return;
    }
    if (targetDays.length === 0) {
      setError('Pick at least one day.');
      return;
    }
    const color = CATEGORIES[category].color;

    if (isEdit && habit) {
      updateHabit({ ...habit, name: name.trim(), emoji, category, color, targetDays, reminderTime: reminderTime || undefined, notes: notes || undefined });
    } else {
      addHabit({ name: name.trim(), emoji, category, color, targetDays, reminderTime: reminderTime || undefined, notes: notes || undefined });
    }
    onClose();
  }

  function handleDelete() {
    if (!habit) return;
    if (window.confirm(`Delete "${habit.name}"? This removes all of its history.`)) {
      deleteHabit(habit.id);
      onClose();
    }
  }

  function handleArchiveToggle() {
    if (!habit) return;
    archiveHabit(habit.id, !habit.archived);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Habit' : 'New Habit'}>
      <div className="space-y-5">
        <div>
          <label htmlFor="habit-name" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Habit name
          </label>
          <input
            id="habit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Drink Water"
            className="focus-ring w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">Icon</p>
          <div className="grid grid-cols-10 gap-1.5">
            {HABIT_EMOJI_PRESETS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                aria-label={`Choose icon ${e}`}
                aria-pressed={emoji === e}
                className={`focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-base transition-colors ${
                  emoji === e ? 'bg-brand-600' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_ORDER.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={`focus-ring rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  category === c ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {CATEGORIES[c].emoji} {CATEGORIES[c].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">Repeat on</p>
          <div className="flex gap-1.5">
            {WEEKDAY_LABELS_SHORT.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i as DayOfWeek)}
                aria-pressed={targetDays.includes(i as DayOfWeek)}
                aria-label={label}
                className={`focus-ring flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  targetDays.includes(i as DayOfWeek)
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="habit-reminder" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Reminder (optional)
            </label>
            <input
              id="habit-reminder"
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="focus-ring w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="habit-notes" className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Notes (optional)
          </label>
          <textarea
            id="habit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any reminders or context for yourself..."
            className="focus-ring w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          {isEdit ? (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleArchiveToggle}>
                {habit?.archived ? 'Unarchive' : 'Archive'}
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{isEdit ? 'Save Changes' : 'Add Habit'}</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
