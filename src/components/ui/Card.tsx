import type { HTMLAttributes } from 'react';

export function Card({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl2 border border-slate-200/70 bg-white shadow-soft dark:border-slate-800 dark:bg-surface-darkCard ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
