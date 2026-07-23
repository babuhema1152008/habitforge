import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileTabBar } from '@/components/layout/MobileTabBar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Avatar } from '@/components/ui/Avatar';
import { SyncStatusBadge } from '@/components/ui/SyncStatusBadge';
import { CoachWidget } from '@/components/coach/CoachWidget';
import { useApp } from '@/context/AppProvider';

export interface AppShellContext {
  openCoachPanel: () => void;
}

export function AppShell() {
  const { state } = useApp();
  const [coachOpen, setCoachOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-subtle dark:bg-surface-dark">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-surface-dark/80 md:hidden">
          <div>
            <div className="flex items-center gap-2 text-base font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              <span aria-hidden="true">🔥</span>
              HabitForge
            </div>
            <SyncStatusBadge className="mt-0.5" />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Avatar emoji={state.user.avatarEmoji} color={state.user.avatarColor} size={32} />
          </div>
        </header>
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-8 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet context={{ openCoachPanel: () => setCoachOpen(true) } satisfies AppShellContext} />
          </div>
        </main>
      </div>
      <MobileTabBar />
      <CoachWidget open={coachOpen} onOpenChange={setCoachOpen} />
    </div>
  );
}
