// PhotoMax — Finance page
import { useMemo, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Pencil,
  Trash2,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/layout/Layout';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  Badge,
  Button,
  EmptyState,
  IconButton,
  Input,
  Modal,
  SectionHeader,
  Select,
} from '@/components/ui/primitives';
import { useAppStore, type ExpenseInput } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { formatDate, formatMoney } from '@/utils/format';
import type { Expense } from '@/types';

const CATEGORIES: { value: Expense['category']; label: string }[] = [
  { value: 'equipamento', label: 'Equipamento' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'software', label: 'Software' },
  { value: 'outro', label: 'Outro' },
];

const emptyForm: ExpenseInput = {
  description: '',
  category: 'outro',
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  recurring: false,
};

export function Finance() {
  const { data, addExpense, removeExpense } = useAppStore();
  const settings = data.settings;
  const { push } = useToast();
  const { lower } = useGlobalSearch();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseInput>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Expense | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const kpis = useMemo(() => {
    const totalReceived = data.contracts.reduce(
      (acc, c) =>
        acc + c.payments.filter((p) => p.status === 'pago').reduce((s, p) => s + p.amount, 0),
      0
    );
    const totalReceivable = data.contracts.reduce(
      (acc, c) =>
        acc +
        c.payments
          .filter((p) => p.status === 'pendente' || p.status === 'parcial' || p.status === 'atrasado')
          .reduce((s, p) => s + p.amount, 0),
      0
    );
    const totalExpenses = data.expenses.reduce((acc, e) => acc + e.amount, 0);
    const taxRate = settings.taxRate;
    const estimatedTax = Math.round(totalReceived * taxRate);
    const net = totalReceived - totalExpenses - estimatedTax;
    return { totalReceived, totalReceivable, totalExpenses, estimatedTax, net };
  }, [data, settings]);

  const serviceBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; receita: number }>();
    for (const c of data.contracts) {
      if (c.status === 'cancelado') continue;
      const svc = data.services.find((s) => s.id === c.serviceId);
      const name = svc?.name ?? '—';
      const received = c.payments
        .filter((p) => p.status === 'pago')
        .reduce((s, p) => s + p.amount, 0);
      map.set(name, {
        name,
        receita: (map.get(name)?.receita ?? 0) + received,
      });
    }
    return Array.from(map.values()).sort((a, b) => b.receita - a.receita);
  }, [data]);

  const expensesFiltered = useMemo(() => {
    if (!lower) return data.expenses;
    return data.expenses.filter(
      (e) =>
        e.description.toLowerCase().includes(lower) ||
        e.category.toLowerCase().includes(lower)
    );
  }, [data.expenses, lower]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  };
  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({
      description: e.description,
      category: e.category,
      amount: e.amount,
      date: e.date.slice(0, 10),
      recurring: e.recurring,
    });
    setErrors({});
    setOpen(true);
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (!form.description.trim()) next.description = 'Informe a descrição';
    if (!Number.isFinite(form.amount) || form.amount < 0) next.amount = 'Valor inválido';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    if (editing) {
      useAppStore.getState().updateExpense(editing.id, form);
      push({ title: 'Despesa atualizada', variant: 'success' });
    } else {
      addExpense(form);
      push({ title: 'Despesa registrada', variant: 'success' });
    }
    setOpen(false);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Financeiro"
        subtitle="Visão consolidada de receita, despesas e impostos"
        icon={<Wallet className="h-5 w-5 sm:h-6 sm:w-6" />}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>
            Nova despesa
          </Button>
        }
      />

      <div className="pm-stagger grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total recebido"
          value={formatMoney(kpis.totalReceived, settings.currency)}
          hint="Soma de todos os pagamentos confirmados"
          icon={<ArrowDownRight className="h-5 w-5" />}
          accent="success"
        />
        <StatCard
          label="A receber"
          value={formatMoney(kpis.totalReceivable, settings.currency)}
          hint="Pagamentos pendentes e em atraso"
          icon={<ArrowUpRight className="h-5 w-5" />}
          accent="info"
        />
        <StatCard
          label="Despesas"
          value={formatMoney(kpis.totalExpenses, settings.currency)}
          hint="Total acumulado registrado"
          icon={<Receipt className="h-5 w-5" />}
          accent="warning"
        />
        <StatCard
          label="Lucro líquido"
          value={formatMoney(kpis.net, settings.currency)}
          hint={`Impostos estimados: ${formatMoney(kpis.estimatedTax, settings.currency)}`}
          icon={kpis.net >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          accent={kpis.net >= 0 ? 'brand' : 'danger'}
        />
      </div>

      <div className="grid gap-5 xl:gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="pm-card p-4 sm:p-6 xl:col-span-2"
        >
          <SectionHeader
            title="Receita por serviço"
            description="Apenas pagamentos confirmados"
            actions={<Badge variant="brand">Performance</Badge>}
          />
          <div className="mt-4">
            {serviceBreakdown.length === 0 ? (
              <EmptyState
                icon={<TrendingUp className="h-6 w-6" />}
                title="Sem receita registrada"
                description="Marque pagamentos como pagos para vê-los aqui."
              />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceBreakdown} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" stroke="rgba(148,163,184,0.18)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(148,163,184,0.7)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      stroke="rgba(148,163,184,0.7)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={70}
                      tickFormatter={(v) =>
                        `R$${(Number(v) / 100).toLocaleString('pt-BR', { notation: 'compact' })}`
                      }
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(124,58,237,0.06)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        const p = payload[0];
                        return (
                          <div className="rounded-xl border border-ink-200 bg-white/95 p-3 text-xs shadow-card backdrop-blur dark:border-ink-800 dark:bg-ink-900/95">
                            <p className="mb-1 font-semibold text-ink-700 dark:text-ink-200">
                              {String(p.payload.name)}
                            </p>
                            <p className="font-semibold text-ink-900 dark:text-ink-50">
                              {formatMoney(Number(p.value ?? 0), settings.currency)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="receita" radius={[8, 8, 0, 0]} fill="url(#bar-grad)">
                      {serviceBreakdown.map((_, i) => (
                        <Cell key={i} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="pm-card p-4 sm:p-6"
        >
          <SectionHeader title="Resumo do estúdio" />
          <div className="space-y-3 pt-4 text-sm">
            <Row
              label="Contratos ativos"
              value={
                data.contracts.filter(
                  (c) => c.status === 'em_andamento' || c.status === 'assinado'
                ).length.toString()
              }
            />
            <Row
              label="Ticket médio"
              value={formatMoney(
                data.contracts.length === 0
                  ? 0
                  : Math.round(
                      data.contracts.reduce((acc, c) => acc + c.totalValue, 0) /
                        data.contracts.length
                    ),
                settings.currency
              )}
            />
            <Row label="Impostos" value={`${(settings.taxRate * 100).toFixed(1)}%`} />
            <Row label="Alíquota efetiva" value={formatMoney(kpis.estimatedTax, settings.currency)} />
          </div>
          <div className="pm-divider my-4" />
          <div className="rounded-xl border border-brand-200/60 bg-gradient-to-br from-brand-500/10 via-fuchsia-500/10 to-accent-500/10 p-4 text-xs text-ink-600 dark:border-brand-700/50 dark:text-ink-300">
            Configure a alíquota em <strong>Configurações</strong> para cálculos mais precisos.
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="pm-card p-4 sm:p-6"
      >
        <SectionHeader
          title="Despesas"
          description="Custos que impactam diretamente o seu lucro"
          actions={
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>
              Adicionar despesa
            </Button>
          }
        />

        <div className="mt-4">
          {expensesFiltered.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-6 w-6" />}
              title="Nenhuma despesa cadastrada"
              description="Registre custos de equipamento, transporte, software etc."
              action={
                <Button onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>
                  Adicionar
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-ink-200/80 dark:border-ink-800">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-ink-200/70 bg-ink-50/60 text-[10px] uppercase tracking-[0.14em] text-ink-500 dark:border-ink-800 dark:bg-ink-900/60">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Descrição</th>
                    <th className="px-3 py-2.5 font-semibold">Categoria</th>
                    <th className="px-3 py-2.5 font-semibold">Data</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Valor</th>
                    <th className="px-3 py-2.5 font-semibold">Recorrente</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {expensesFiltered.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-ink-200/40 last:border-0 transition hover:bg-ink-50/60 dark:border-ink-800/60 dark:hover:bg-ink-900/40"
                    >
                      <td className="px-3 py-3 font-medium text-ink-900 dark:text-ink-50">
                        {e.description}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="neutral">
                          {CATEGORIES.find((c) => c.value === e.category)?.label ?? e.category}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-ink-500 dark:text-ink-400">{formatDate(e.date)}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums text-accent-600 dark:text-accent-300">
                        {formatMoney(e.amount, settings.currency)}
                      </td>
                      <td className="px-3 py-3 text-ink-500 dark:text-ink-400">
                        {e.recurring ? 'Sim' : 'Não'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <IconButton label="Editar" size="sm" onClick={() => openEdit(e)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </IconButton>
                          <IconButton
                            label="Remover"
                            size="sm"
                            tone="danger"
                            onClick={() => setConfirmDelete(e)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar despesa' : 'Nova despesa'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>{editing ? 'Salvar' : 'Registrar'}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Descrição"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              error={errors.description}
              maxLength={140}
            />
          </div>
          <Select
            label="Categoria"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as Expense['category'] })}
            options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          />
          <Input
            label="Data"
            type="date"
            value={form.date.slice(0, 10)}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Input
            label="Valor (centavos)"
            type="number"
            min={0}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            error={errors.amount}
            hint={formatMoney(form.amount || 0, settings.currency)}
          />
          <label className="sm:col-span-2 flex cursor-pointer items-center gap-3 rounded-xl border border-ink-200 bg-white/60 p-3 transition hover:border-ink-300 dark:border-ink-800 dark:bg-ink-900/60">
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400"
            />
            <span className="text-sm text-ink-700 dark:text-ink-200">
              Despesa recorrente (mensal/anual)
            </span>
          </label>
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remover despesa"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirmDelete) {
                  removeExpense(confirmDelete.id);
                  setConfirmDelete(null);
                  push({ title: 'Despesa removida', variant: 'info' });
                }
              }}
            >
              Remover
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-700 dark:text-ink-200">
          Remover <strong>{confirmDelete?.description}</strong>?
        </p>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-500 dark:text-ink-400">{label}</span>
      <span className="font-bold tabular-nums text-ink-900 dark:text-ink-50">{value}</span>
    </div>
  );
}