// PhotoMax — Dashboard page
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  FileSignature,
  CalendarClock,
  Sparkles,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Briefcase,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/layout/Layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ServiceBreakdownChart } from '@/components/dashboard/ServiceBreakdownChart';
import { Button, Badge, EmptyState, SectionHeader } from '@/components/ui/primitives';
import { useAppStore } from '@/store/useAppStore';
import { formatDate, formatMoney, initials } from '@/utils/format';
import { SERVICE_CATEGORY_LABELS } from '@/types';
import type { Contract, ServiceCategory } from '@/types';

function last6Months(): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  for (let i = 5; i >= 0; i--) {
    const ref = new Date(d);
    ref.setMonth(ref.getMonth() - i);
    out.push({
      key: `${ref.getFullYear()}-${ref.getMonth()}`,
      label: ref.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
    });
  }
  return out;
}

function getMonthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function aggregateByMonth(
  contracts: Contract[],
  expenses: { amount: number; date: string }[],
  months: { key: string; label: string }[]
) {
  return months.map((m) => {
    const receita = contracts.reduce((acc, c) => {
      const total = c.payments
        .filter((p) => p.status === 'pago' && p.paidAt && getMonthKey(p.paidAt) === m.key)
        .reduce((s, p) => s + p.amount, 0);
      return acc + total;
    }, 0);
    const despesa = expenses.reduce((acc, e) => {
      return acc + (getMonthKey(e.date) === m.key ? e.amount : 0);
    }, 0);
    return { month: m.label, receita, despesa };
  });
}

export function Dashboard() {
  const { data } = useAppStore();
  const settings = data.settings;
  const { contracts, expenses, services, clients, tasks } = data;

  const stats = useMemo(() => {
    const monthKey = (iso: string) => {
      const d = new Date(iso);
      return `${d.getFullYear()}-${d.getMonth()}`;
    };
    const now = new Date();
    const thisKey = `${now.getFullYear()}-${now.getMonth()}`;
    const last = new Date(now);
    last.setMonth(last.getMonth() - 1);
    const lastKey = `${last.getFullYear()}-${last.getMonth()}`;

    let monthRevenue = 0;
    let lastRevenue = 0;
    let totalReceived = 0;
    let totalReceivable = 0;

    for (const c of contracts) {
      for (const p of c.payments) {
        if (p.status === 'pago' && p.paidAt) {
          totalReceived += p.amount;
          const k = monthKey(p.paidAt);
          if (k === thisKey) monthRevenue += p.amount;
          if (k === lastKey) lastRevenue += p.amount;
        } else if (p.status === 'pendente' || p.status === 'parcial') {
          totalReceivable += p.amount;
        }
      }
    }

    const trend =
      lastRevenue === 0
        ? monthRevenue > 0
          ? 100
          : 0
        : ((monthRevenue - lastRevenue) / lastRevenue) * 100;

    const pendingTasks = tasks.filter((t) => t.status !== 'concluida').length;
    const activeContracts = contracts.filter(
      (c) => c.status === 'assinado' || c.status === 'em_andamento'
    ).length;

    return {
      monthRevenue,
      trend,
      totalReceived,
      totalReceivable,
      pendingTasks,
      activeContracts,
      monthExpenses: expenses
        .filter((e) => monthKey(e.date) === thisKey)
        .reduce((acc, e) => acc + e.amount, 0),
    };
  }, [contracts, expenses, tasks]);

  const months = useMemo(last6Months, []);
  const chartData = useMemo(
    () => aggregateByMonth(contracts, expenses, months),
    [contracts, expenses, months]
  );

  const breakdownData = useMemo(() => {
    const map = new Map<ServiceCategory, number>();
    for (const c of contracts) {
      if (c.status === 'cancelado') continue;
      const svc = services.find((s) => s.id === c.serviceId);
      const cat = svc?.category ?? 'outro';
      map.set(cat, (map.get(cat) ?? 0) + c.totalValue);
    }
    return Array.from(map.entries()).map(([category, value]) => ({
      name: SERVICE_CATEGORY_LABELS[category],
      value,
    }));
  }, [contracts, services]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return contracts
      .filter((c) => c.eventDate && new Date(c.eventDate).getTime() >= now - 86400000)
      .sort((a, b) => new Date(a.eventDate!).getTime() - new Date(b.eventDate!).getTime())
      .slice(0, 4);
  }, [contracts]);

  const overdue = useMemo(() => {
    return contracts.flatMap((c) =>
      c.payments
        .filter((p) => p.status === 'pendente' || p.status === 'atrasado')
        .map((p) => ({ ...p, contract: c, client: clients.find((cl) => cl.id === c.clientId) }))
    );
  }, [contracts, clients]);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'concluida' && t.dueDate)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);
  }, [tasks]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do seu estúdio em tempo real"
        icon={<Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />}
        actions={
          <>
            <Link to="/tarefas" className="hidden sm:inline-flex">
              <Button variant="secondary" leftIcon={<Briefcase className="h-4 w-4" />}>
                Tarefas
              </Button>
            </Link>
            <Link to="/contratos">
              <Button leftIcon={<FileSignature className="h-4 w-4" />}>Novo contrato</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Receita do mês"
          value={formatMoney(stats.monthRevenue, settings.currency)}
          hint={`${contracts.length} contratos no total`}
          trend={stats.trend}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="brand"
        />
        <StatCard
          label="A receber"
          value={formatMoney(stats.totalReceivable, settings.currency)}
          hint={`${overdue.length} pagamentos pendentes`}
          icon={<Wallet className="h-5 w-5" />}
          accent="info"
        />
        <StatCard
          label="Total recebido"
          value={formatMoney(stats.totalReceived, settings.currency)}
          hint="Histórico acumulado"
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="success"
        />
        <StatCard
          label="Despesas do mês"
          value={formatMoney(stats.monthExpenses, settings.currency)}
          hint={`${expenses.length} despesas no total`}
          icon={<Clock className="h-5 w-5" />}
          accent="warning"
        />
      </div>

      <div className="grid gap-5 xl:gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="pm-card p-4 sm:p-6 xl:col-span-2"
        >
          <SectionHeader
            title="Receita vs. Despesa"
            description="Últimos 6 meses"
            actions={<Badge variant="brand"><TrendingUp className="h-3 w-3" />Tendência</Badge>}
          />
          <div className="mt-4">
            <RevenueChart data={chartData} currency={settings.currency} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="pm-card p-4 sm:p-6"
        >
          <SectionHeader
            title="Mix de serviços"
            description="Por categoria"
          />
          <div className="mt-4">
            {breakdownData.length === 0 ? (
              <EmptyState
                title="Sem dados ainda"
                description="Crie contratos para ver o mix de serviços."
              />
            ) : (
              <ServiceBreakdownChart data={breakdownData} currency={settings.currency} />
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-5 xl:gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="pm-card p-4 sm:p-6 xl:col-span-2"
        >
          <SectionHeader
            title="Próximos eventos"
            description="Agenda das próximas sessões e coberturas"
            actions={
              <Link
                to="/contratos"
                className="text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-300"
              >
                Ver todos →
              </Link>
            }
          />
          <div className="mt-3">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={<CalendarClock className="h-6 w-6" />}
                title="Nenhum evento agendado"
                description="Adicione datas de evento aos contratos para vê-los aqui."
              />
            ) : (
              <ul className="pm-stagger divide-y divide-ink-200/70 dark:divide-ink-800">
                {upcoming.map((c) => {
                  const client = clients.find((cl) => cl.id === c.clientId);
                  const svc = services.find((s) => s.id === c.serviceId);
                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-gradient-to-br from-brand-500/15 to-accent-500/15 text-sm font-semibold text-brand-700 dark:border-brand-700/60 dark:text-brand-300">
                          {initials(client?.name ?? 'C')}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">
                            {c.title}
                          </p>
                          <p className="truncate text-xs text-ink-500 dark:text-ink-400">
                            {client?.name} · {svc?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={c.status === 'em_andamento' ? 'warning' : 'brand'}>
                          {c.status === 'em_andamento' ? 'Em andamento' : 'Assinado'}
                        </Badge>
                        <div className="hidden text-right text-xs sm:block">
                          <p className="font-medium text-ink-700 dark:text-ink-200">
                            {formatDate(c.eventDate)}
                          </p>
                          <p className="text-ink-500 dark:text-ink-400">
                            {formatMoney(c.totalValue, settings.currency)}
                          </p>
                        </div>
                        <Link
                          to="/contratos"
                          className="rounded-lg border border-transparent p-1 text-ink-400 transition hover:border-brand-300 hover:text-brand-500 dark:hover:text-brand-300"
                          aria-label="Abrir contrato"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="pm-card p-4 sm:p-6"
        >
          <SectionHeader
            title="Pagamentos pendentes"
            description="O que ainda não entrou"
            actions={<AlertCircle className="h-4 w-4 text-accent-500" />}
          />
          <div className="mt-3">
            {overdue.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="h-6 w-6" />}
                title="Tudo em dia!"
                description="Não há pagamentos pendentes no momento."
              />
            ) : (
              <ul className="pm-stagger space-y-2">
                {overdue.slice(0, 6).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-ink-200/80 bg-white/70 px-3 py-2 transition hover:border-ink-300 hover:shadow-soft dark:border-ink-800 dark:bg-ink-900/60 dark:hover:border-ink-700"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">
                        {p.contract.title}
                      </p>
                      <p className="truncate text-xs text-ink-500 dark:text-ink-400">
                        {p.label} · {p.client?.name ?? '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-ink-900 dark:text-ink-50">
                        {formatMoney(p.amount, settings.currency)}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-500">
                        {formatDate(p.dueDate)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="pm-card p-4 sm:p-6"
      >
        <SectionHeader
          title="Próximas tarefas"
          description="Foco da sua semana"
          actions={
            <Link
              to="/tarefas"
              className="text-xs font-semibold text-brand-600 transition hover:text-brand-700 dark:text-brand-300"
            >
              Ver Kanban →
            </Link>
          }
        />
        <div className="mt-3">
          {upcomingTasks.length === 0 ? (
            <EmptyState icon={<Briefcase className="h-6 w-6" />} title="Sem tarefas pendentes" />
          ) : (
            <div className="pm-stagger grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {upcomingTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-ink-200/80 bg-white/70 p-3 transition hover:border-ink-300 hover:shadow-soft dark:border-ink-800 dark:bg-ink-900/60 dark:hover:border-ink-700"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={
                        t.priority === 'urgente'
                          ? 'h-2 w-2 shrink-0 rounded-full bg-accent-500 shadow-[0_0_10px_2px_rgba(244,63,94,0.5)]'
                          : t.priority === 'alta'
                          ? 'h-2 w-2 shrink-0 rounded-full bg-amber-500'
                          : 'h-2 w-2 shrink-0 rounded-full bg-emerald-500'
                      }
                      aria-label={`Prioridade ${t.priority}`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">
                        {t.title}
                      </p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">
                        Vence {formatDate(t.dueDate)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      t.status === 'em_andamento'
                        ? 'warning'
                        : t.status === 'revisao'
                        ? 'info'
                        : 'neutral'
                    }
                  >
                    {t.status === 'em_andamento'
                      ? 'Em andamento'
                      : t.status === 'revisao'
                      ? 'Revisão'
                      : 'Backlog'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="pm-card p-4 sm:p-6"
      >
        <SectionHeader
          title="Resumo do estúdio"
          description="Tudo em um só lugar"
          actions={<Users className="h-4 w-4 text-brand-500" />}
        />
        <div className="pm-stagger mt-3 grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          <SummaryMini label="Serviços ativos" value={services.filter((s) => s.active).length} />
          <SummaryMini label="Clientes" value={clients.length} />
          <SummaryMini label="Contratos" value={contracts.length} />
          <SummaryMini label="Tarefas abertas" value={stats.pendingTasks} />
        </div>
      </motion.div>
    </div>
  );
}

function SummaryMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-ink-200/80 bg-gradient-to-br from-white/85 to-white/50 p-3 sm:p-4 dark:border-ink-800 dark:from-ink-900/85 dark:to-ink-900/40">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-ink-900 dark:text-ink-50 sm:text-2xl">
        {value}
      </p>
    </div>
  );
}