import { Card } from '@/components/ui/Card';
import { useApp } from '@/context/AppProvider';

const MOCK_PEERS = [
  { name: 'Priya N.', emoji: '🦋', xp: 2140 },
  { name: 'Marcus T.', emoji: '🐢', xp: 1580 },
  { name: 'Sasha K.', emoji: '🦉', xp: 960 },
  { name: 'Devon R.', emoji: '🐨', xp: 410 },
];

export function Leaderboard() {
  const { state } = useApp();

  const entries = [...MOCK_PEERS, { name: `${state.user.name} (You)`, emoji: state.user.avatarEmoji, xp: state.user.xp }].sort(
    (a, b) => b.xp - a.xp
  );

  return (
    <Card className="p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">Community Leaderboard</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400 dark:bg-slate-800">
          Preview
        </span>
      </div>
      <p className="mb-4 text-xs text-slate-400">Illustrative demo data — friend rankings are a future feature.</p>
      <div className="space-y-2">
        {entries.map((e, i) => {
          const isYou = e.name.includes('(You)');
          return (
            <div
              key={e.name}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                isYou ? 'bg-brand-50 dark:bg-brand-500/10' : 'bg-slate-50 dark:bg-slate-800/50'
              }`}
            >
              <span className="w-5 text-center text-xs font-bold text-slate-400">{i + 1}</span>
              <span aria-hidden="true">{e.emoji}</span>
              <span className={`flex-1 truncate text-sm font-semibold ${isYou ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-200'}`}>
                {e.name}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{e.xp} XP</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
