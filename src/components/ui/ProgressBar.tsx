import { motion } from 'framer-motion';

interface ProgressBarProps {
  percent: number;
  colorClassName?: string;
  trackClassName?: string;
  height?: number;
  label?: string;
}

export function ProgressBar({
  percent,
  colorClassName = 'bg-brand-600',
  trackClassName = 'bg-slate-200 dark:bg-slate-700',
  height = 8,
  label,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>{label}</span>
          <span>{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className={`w-full overflow-hidden rounded-full ${trackClassName}`}
        style={{ height }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className={`h-full rounded-full ${colorClassName}`}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
