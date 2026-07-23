import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/components/layout/navItems';
import { Avatar } from '@/components/ui/Avatar';
import { useApp } from '@/context/AppProvider';

export function Sidebar() {
  const { state, levelProgress, signOut } = useApp();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200/70 bg-white px-4 py-6 dark:border-slate-800 dark:bg-surface-darkCard md:flex">
      <div className="mb-8 flex items-center gap-2 px-2 text-lg font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
        <span className="text-xl" aria-hidden="true">🔥</span>
        HabitForge
      </div>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-6 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60">
          <Avatar emoji={state.user.avatarEmoji} color={state.user.avatarColor} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{state.user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Level {levelProgress.level}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="focus-ring w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
