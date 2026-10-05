// PhotoMax — Sidebar navigation (desktop)
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FileSignature,
  Users as UsersIcon,
  Wallet,
  KanbanSquare,
  Settings,
  Camera,
} from 'lucide-react';
import { cn } from '@/utils/classnames';
import { useAppStore } from '@/store/useAppStore';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: () => number;
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pendingPayments = useAppStore((s) =>
    s.data.contracts.reduce(
      (acc, c) =>
        acc +
        c.payments.filter((p) => p.status === 'pendente' || p.status === 'atrasado').length,
      0
    )
  );
  const openTasks = useAppStore((s) => s.data.tasks.filter((t) => t.status !== 'concluida').length);
  const activeContracts = useAppStore(
    (s) =>
      s.data.contracts.filter(
        (c) => c.status === 'assinado' || c.status === 'em_andamento'
      ).length
  );

  const items: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/servicos', label: 'Serviços', icon: Briefcase },
    { to: '/contratos', label: 'Contratos', icon: FileSignature, badge: () => activeContracts },
    { to: '/clientes', label: 'Clientes', icon: UsersIcon },
    { to: '/financeiro', label: 'Financeiro', icon: Wallet, badge: () => pendingPayments },
    { to: '/tarefas', label: 'Tarefas', icon: KanbanSquare, badge: () => openTasks },
    { to: '/configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="flex h-full w-72 flex-col border-r border-ink-200/70 bg-white/80 backdrop-blur-2xl dark:border-ink-800 dark:bg-ink-950/80">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-brand-500 via-fuchsia-500 to-accent-500 text-white shadow-glow">
            <Camera className="h-5 w-5" />
          </div>
          <span
            aria-hidden
            className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-gold-400 dark:border-ink-950"
          />
        </div>
        <div className="leading-tight">
          <p className="text-base font-bold tracking-tight text-ink-900 dark:text-ink-50">
            Photo<span className="pm-grad-text">Max</span>
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500 dark:text-ink-400">
            Studio Suite
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const badge = item.badge ? item.badge() : 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'border-brand-300/60 bg-gradient-to-r from-brand-500/10 via-fuchsia-500/10 to-accent-500/10 text-brand-700 shadow-soft dark:border-brand-700/60 dark:text-brand-200'
                    : 'border-transparent text-ink-600 hover:border-ink-200 hover:bg-ink-50 hover:text-ink-900 dark:text-ink-300 dark:hover:border-ink-800 dark:hover:bg-ink-900/60 dark:hover:text-ink-50'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg border transition-all duration-200',
                      isActive
                        ? 'border-white/20 bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow'
                        : 'border-ink-200 bg-white text-ink-500 group-hover:border-ink-300 group-hover:text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400 dark:group-hover:border-ink-600 dark:group-hover:text-ink-200'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums',
                        isActive
                          ? 'border-white/30 bg-white/20 text-white'
                          : 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-400/30 dark:bg-brand-400/10 dark:text-brand-200'
                      )}
                    >
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-500/10 via-fuchsia-500/10 to-accent-500/10 p-4 dark:border-brand-700/50">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
          Dica Pro
        </p>
        <p className="mt-1 text-sm font-semibold text-ink-800 dark:text-ink-100">
          Arraste tarefas para mudar o status
        </p>
        <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
          Segure e deslize o card lateralmente para mover entre as colunas do Kanban.
        </p>
      </div>
    </aside>
  );
}