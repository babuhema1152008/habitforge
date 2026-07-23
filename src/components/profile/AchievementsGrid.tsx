import { Card } from '@/components/ui/Card';
import { ACHIEVEMENT_DEFS } from '@/lib/gamification';
import { useApp } from '@/context/AppProvider';

export function AchievementsGrid() {
  const { state } = useApp();
  const unlockedIds = new Set(state.achievements.map((a) => a.id));

  return (
    <Card className="p-5">
      <h3 className="mb-4 font-bold text-slate-800 dark:text-slate-100">
        Achievements ({state.achievements.length}/{ACHIEVEMENT_DEFS.length})
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ACHIEVEMENT_DEFS.map((def) => {
          const unlocked = unlockedIds.has(def.id);
          return (
            <div
              key={def.id}
              className={`flex flex-col items-center rounded-xl border p-3 text-center transition-opacity ${
                unlocked
                  ? 'border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/[0.06]'
                  : 'border-slate-200 bg-slate-50 opacity-50 dark:border-slate-800 dark:bg-slate-900/40'
              }`}
            >
              <span className="text-2xl" aria-hidden="true">{unlocked ? def.emoji : '🔒'}</span>
              <p className="mt-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">{def.title}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">{def.description}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
