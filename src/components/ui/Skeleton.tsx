export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} aria-hidden="true" />;
}

export function HabitCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl2 border border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-surface-darkCard">
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
    </div>
  );
}
