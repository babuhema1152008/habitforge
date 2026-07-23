import { useApp } from '@/context/AppProvider';

const CONFIG = {
  idle: { label: 'Synced', dot: 'bg-emerald-500' },
  syncing: { label: 'Syncing…', dot: 'bg-brand-500 animate-pulse' },
  offline: { label: 'Offline — will sync', dot: 'bg-slate-400' },
  error: { label: 'Sync issue — retrying', dot: 'bg-rose-500' },
} as const;

export function SyncStatusBadge({ className = '' }: { className?: string }) {
  const { syncStatus } = useApp();
  const cfg = CONFIG[syncStatus];

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}
