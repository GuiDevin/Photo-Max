// PhotoMax — Toast / notification system
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/utils/classnames';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  push: (t: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = idRef.current++;
    setItems((cur) => [...cur, { ...t, id }]);
    window.setTimeout(() => {
      setItems((cur) => cur.filter((x) => x.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 shadow-card backdrop-blur-xl',
                t.variant === 'success' &&
                  'border-emerald-300/40 bg-emerald-50/90 text-emerald-900 dark:border-emerald-700/40 dark:bg-emerald-900/40 dark:text-emerald-100',
                t.variant === 'error' &&
                  'border-accent-300/50 bg-accent-50/90 text-accent-700 dark:border-accent-700/40 dark:bg-accent-900/30 dark:text-accent-100',
                t.variant === 'info' &&
                  'border-brand-300/40 bg-brand-50/90 text-brand-800 dark:border-brand-700/40 dark:bg-brand-900/30 dark:text-brand-100'
              )}
              role="status"
              aria-live="polite"
            >
              <div className="mt-0.5 shrink-0">
                {t.variant === 'success' && <CheckCircle2 className="h-5 w-5" />}
                {t.variant === 'error' && <AlertTriangle className="h-5 w-5" />}
                {t.variant === 'info' && <Info className="h-5 w-5" />}
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs opacity-80">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => setItems((c) => c.filter((x) => x.id !== t.id))}
                className="rounded-md p-1 opacity-60 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                aria-label="Fechar notificação"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}