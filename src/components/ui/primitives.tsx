// PhotoMax — UI primitives
// All primitives share consistent border + focus styles, support touch
// targets (44px on coarse pointers) and respect reduced motion.
import { forwardRef } from 'react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/utils/classnames';

export { Modal } from './Modal';

/* ====================== Button ====================== */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
      variant = 'primary',
      size = 'md',
      leftIcon,
      rightIcon,
      fullWidth,
      loading,
      className,
      children,
      disabled,
      ...rest
    },
  ref
) {
  const variants: Record<ButtonVariant, string> = {
    primary: 'pm-btn-primary',
    secondary: 'pm-btn-secondary',
    ghost: 'pm-btn-ghost',
    danger: 'pm-btn-danger',
    outline: 'pm-btn-secondary', // alias kept for back-compat
  };
  const sizes: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1.5 text-xs gap-1',
    sm: 'px-3 py-2 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  };
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      className={cn(
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      aria-disabled={isDisabled || undefined}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
        />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

/* ====================== Input ====================== */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, rightSlot, className, id, ...rest },
  ref
) {
  const inputId = id || rest.name || `inp-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="pm-label">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'pm-input',
            leftIcon && 'pl-10',
            rightSlot && 'pr-10',
            error &&
              'border-accent-400 focus:border-accent-400 focus:ring-accent-300/40 dark:focus:ring-accent-400/30',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
          {...rest}
        />
        {rightSlot && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-err`} className="mt-1 text-xs font-medium text-accent-500">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

/* ====================== Textarea ====================== */

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, ...rest },
  ref
) {
  const tid = id || rest.name || `txt-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={tid} className="pm-label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={tid}
        className={cn(
          'pm-input min-h-[88px] resize-y',
          error &&
            'border-accent-400 focus:border-accent-400 focus:ring-accent-300/40',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        {...rest}
      />
      {error ? (
        <p className="mt-1 text-xs font-medium text-accent-500">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
});

/* ====================== Select ====================== */

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, id, className, ...rest },
  ref
) {
  const sid = id || rest.name || `sel-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={sid} className="pm-label">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'pm-input appearance-none pr-9',
            error && 'border-accent-400 focus:border-accent-400 focus:ring-accent-300/40',
            className
          )}
          id={sid}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {error ? (
        <p className="mt-1 text-xs font-medium text-accent-500">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
});

/* ====================== Badge ====================== */

interface BadgeProps {
  children: ReactNode;
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
    neutral:
      'bg-ink-100/80 text-ink-700 border-ink-200 dark:bg-ink-800/80 dark:text-ink-200 dark:border-ink-700',
    brand:
      'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/40 dark:text-brand-200 dark:border-brand-700/60',
    success:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/60',
    warning:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700/60',
    danger:
      'bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/30 dark:text-accent-200 dark:border-accent-700/60',
    info:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-700/60',
    gold:
      'bg-gold-400/10 text-gold-600 border-gold-400/40 dark:bg-gold-400/10 dark:text-gold-400 dark:border-gold-400/40',
  };
  return <span className={cn('pm-chip', variants[variant], className)}>{children}</span>;
}

/* ====================== IconButton ====================== */

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // required for a11y
  size?: 'sm' | 'md';
  tone?: 'default' | 'danger';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', tone = 'default', className, children, ...rest },
  ref
) {
  const dims = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const toneClass =
    tone === 'danger'
      ? 'border-ink-200 text-ink-500 hover:text-accent-600 hover:bg-accent-50 hover:border-accent-300 dark:border-ink-700 dark:hover:bg-accent-900/30 dark:hover:text-accent-300 dark:hover:border-accent-700/60'
      : 'border-ink-200 text-ink-500 hover:text-ink-800 hover:bg-ink-50 hover:border-ink-300 dark:border-ink-700 dark:hover:bg-ink-800/60 dark:hover:text-ink-100';
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg border bg-transparent transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-ink-950',
        'active:scale-95',
        dims,
        toneClass,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

/* ====================== EmptyState ====================== */

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="pm-fade-up flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300/80 bg-white/50 px-6 py-12 text-center backdrop-blur dark:border-ink-700 dark:bg-ink-900/40">
      {icon && (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-brand-600 shadow-soft dark:border-brand-700/60 dark:bg-brand-900/40 dark:text-brand-300">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink-900 dark:text-ink-50">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ====================== SectionHeader ====================== */

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, actions, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-ink-200/70 pb-4 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div>
        <h2 className="text-base font-semibold tracking-tight text-ink-900 dark:text-ink-50">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}