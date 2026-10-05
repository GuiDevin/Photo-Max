// PhotoMax — Topbar with search, theme toggle, save status (fully responsive)
import { useEffect, useState } from 'react';
import { Menu, Moon, Search, Sun, Monitor, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { Input, IconButton } from '@/components/ui/primitives';
import { cn } from '@/utils/classnames';

export function Topbar({
  onOpenSidebar,
  query,
  onQueryChange,
}: {
  onOpenSidebar: () => void;
  query: string;
  onQueryChange: (v: string) => void;
}) {
  useTheme();
  const theme = useAppStore((s) => s.data.settings.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const saveError = useAppStore((s) => s.saveError);
  const studioName = useAppStore((s) => s.data.settings.studioName);
  const ownerName = useAppStore((s) => s.data.settings.ownerName);

  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 600);
    return () => window.clearTimeout(t);
  }, [saveError]);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-ink-200/70 bg-white/70 px-3 py-2.5 backdrop-blur-2xl dark:border-ink-800 dark:bg-ink-950/70 sm:gap-3 sm:px-4 sm:py-3 lg:px-6">
      <IconButton
        label="Abrir menu"
        onClick={onOpenSidebar}
        className="border-ink-200 bg-white text-ink-700 shadow-soft hover:shadow-glow dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200 lg:hidden"
        size="sm"
      >
        <Menu className="h-4 w-4" />
      </IconButton>

      <div className="hidden flex-col leading-tight md:flex">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500 dark:text-ink-400">
          {studioName}
        </span>
        <span className="text-sm font-semibold text-ink-900 dark:text-ink-50">
          Olá, {ownerName.split(' ')[0]} <span aria-hidden>👋</span>
        </span>
      </div>

      <div className="ml-auto flex flex-1 items-center justify-end gap-2">
        <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-md">
          <Input
            placeholder="Buscar…"
            leftIcon={<Search className="h-4 w-4" />}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label="Busca global"
            className="text-sm"
          />
        </div>

        <div
          className={cn(
            'hidden items-center gap-1.5 rounded-full border border-ink-200 bg-white px-2.5 py-1 text-xs text-ink-600 transition dark:border-ink-800 dark:bg-ink-900 dark:text-ink-300 sm:flex',
            pulse && 'ring-2 ring-brand-300/40'
          )}
          aria-live="polite"
        >
          {saveError ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-accent-500" />
              <span className="text-accent-600 dark:text-accent-300" title={saveError}>
                Erro
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden lg:inline">Sincronizado</span>
            </>
          )}
        </div>

        <div
          role="radiogroup"
          aria-label="Tema"
          className="flex items-center gap-0.5 rounded-xl border border-ink-200 bg-white p-0.5 shadow-soft dark:border-ink-800 dark:bg-ink-900"
        >
          {(
            [
              { v: 'light', Icon: Sun, label: 'Tema claro' },
              { v: 'system', Icon: Monitor, label: 'Tema do sistema' },
              { v: 'dark', Icon: Moon, label: 'Tema escuro' },
            ] as const
          ).map(({ v, Icon, label }) => (
            <button
              key={v}
              onClick={() => setTheme(v)}
              aria-label={label}
              aria-pressed={theme === v}
              role="radio"
              aria-checked={theme === v}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 active:scale-95',
                theme === v
                  ? 'border-white/20 bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow'
                  : 'border-transparent text-ink-500 hover:border-ink-200 hover:bg-ink-50 hover:text-ink-700 dark:text-ink-400 dark:hover:border-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-100'
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}