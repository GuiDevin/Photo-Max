// PhotoMax — Dashboard stat card with refined animations
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/classnames';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: number; // percentage
  icon: ReactNode;
  accent?: 'brand' | 'success' | 'warning' | 'danger' | 'info';
}

const accentMap = {
  brand: {
    icon: 'from-brand-500/15 to-fuchsia-500/15 text-brand-600 dark:text-brand-300',
    blob: 'from-brand-500/30 to-fuchsia-500/30',
  },
  success: {
    icon: 'from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-300',
    blob: 'from-emerald-500/30 to-teal-500/30',
  },
  warning: {
    icon: 'from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-amber-300',
    blob: 'from-amber-500/30 to-orange-500/30',
  },
  danger: {
    icon: 'from-accent-500/15 to-rose-500/15 text-accent-600 dark:text-accent-300',
    blob: 'from-accent-500/30 to-rose-500/30',
  },
  info: {
    icon: 'from-sky-500/15 to-cyan-500/15 text-sky-600 dark:text-sky-300',
    blob: 'from-sky-500/30 to-cyan-500/30',
  },
} as const;

export function StatCard({ label, value, hint, trend, icon, accent = 'brand' }: StatCardProps) {
  const trendPositive = trend !== undefined && trend >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="pm-card pm-card-hover overflow-hidden p-4 sm:p-5"
    >
      <div
        className={cn(
          'absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-90',
          accentMap[accent].blob
        )}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400 sm:text-xs">
            {label}
          </p>
          <p className="mt-1.5 text-xl font-bold tracking-tight text-ink-900 dark:text-ink-50 sm:text-2xl">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/40 bg-gradient-to-br shadow-soft dark:border-white/10',
            accentMap[accent].icon
          )}
        >
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div className="relative mt-3 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold tabular-nums',
              trendPositive
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'border border-accent-200 bg-accent-50 text-accent-700 dark:border-accent-700/60 dark:bg-accent-900/40 dark:text-accent-300'
            )}
          >
            {trendPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-ink-500 dark:text-ink-400">vs. mês anterior</span>
        </div>
      )}
    </motion.div>
  );
}