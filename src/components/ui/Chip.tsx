import type { ReactNode } from 'react';

interface ChipProps {
  children: ReactNode;
  color?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ children, color, active, onClick, className = '' }: ChipProps) {
  const interactive = typeof onClick === 'function';
  return (
    <span
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={`focus-ring inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
        interactive ? 'cursor-pointer' : ''
      } ${
        active
          ? 'bg-brand-600 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      } ${className}`}
      style={!active && color ? { backgroundColor: `${color}1a`, color } : undefined}
    >
      {children}
    </span>
  );
}
