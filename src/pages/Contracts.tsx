// PhotoMax — Contracts page (responsive)
import { useMemo, useState } from 'react';
import {
  FileSignature,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  Filter,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/layout/Layout';
import {
  Badge,
  Button,
  EmptyState,
  IconButton,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/components/ui/primitives';
import { useAppStore, type ContractInput } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { formatDate, formatMoney } from '@/utils/format';
import {
  CONTRACT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type Contract,
  type ContractStatus,
  type PaymentStatus,
} from '@/types';
import { cn } from '@/utils/classnames';

const STATUS_ORDER: ContractStatus[] = [
  'rascunho',
  'enviado',
  'assinado',
  'em_andamento',
  'concluido',
  'cancelado',
];

const STATUS_BADGE: Record<
  ContractStatus,
  'neutral' | 'info' | 'brand' | 'warning' | 'success' | 'danger'
> = {
  rascunho: 'neutral',
  enviado: 'info',
  assinado: 'brand',
  em_andamento: 'warning',
  concluido: 'success',
  cancelado: 'danger',
};

const emptyForm: ContractInput = {
  title: '',
  clientId: '',
  serviceId: '',
  totalValue: 0,
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  eventDate: '',
  location: '',
  notes: '',
  payments: [],
};

export function Contracts() {
  const contracts = useAppStore((s) => s.data.contracts);
  const clients = useAppStore((s) => s.data.clients);
  const services = useAppStore((s) => s.data.services);
  const settings = useAppStore((s) => s.data.settings);
  const addContract = useAppStore((s) => s.addContract);
  const updateContract = useAppStore((s) => s.updateContract);
  const removeContract = useAppStore((s) => s.removeContract);
  const updatePayment = useAppStore((s) => s.updatePayment);
  const { push } = useToast();
  const { lower } = useGlobalSearch();

  const [open_, setOpen] = useState(false);
  const [editing, setEditing] = useState<Contract | null>(null);
  const [form, setForm] = useState<ContractInput>(emptyForm);
  const [filter, setFilter] = useState<ContractStatus | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState<Contract | null>(null);
  const [view, setView] = useState<Contract | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    let list = contracts;
    if (filter !== 'all') list = list.filter((c) => c.status === filter);
    if (lower) {
      list = list.filter((c) => {
        const client = clients.find((cl) => cl.id === c.clientId);
        const svc = services.find((s) => s.id === c.serviceId);
        return (
          c.title.toLowerCase().includes(lower) ||
          c.code.toLowerCase().includes(lower) ||
          client?.name.toLowerCase().includes(lower) ||
          svc?.name.toLowerCase().includes(lower)
        );
      });
    }
    return list;
  }, [contracts, clients, services, lower, filter]);

  const openNew = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      clientId: clients[0]?.id ?? '',
      serviceId: services[0]?.id ?? '',
    });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (c: Contract) => {
    setEditing(c);
    setForm({
      title: c.title,
      clientId: c.clientId,
      serviceId: c.serviceId,
      totalValue: c.totalValue,
      startDate: c.startDate.slice(0, 10),
      endDate: c.endDate.slice(0, 10),
      eventDate: c.eventDate ? c.eventDate.slice(0, 10) : '',
      location: c.location ?? '',
      notes: c.notes ?? '',
      payments: c.payments.map((p) => ({
        id: p.id,
        label: p.label,
        amount: p.amount,
        dueDate: p.dueDate,
        status: p.status,
        paidAt: p.paidAt,
      })),
    });
    setErrors({});
    setOpen(true);
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Informe um título';
    if (!form.clientId) next.clientId = 'Selecione um cliente';
    if (!form.serviceId) next.serviceId = 'Selecione um serviço';
    if (!Number.isFinite(form.totalValue) || form.totalValue < 0)
      next.totalValue = 'Valor inválido';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload: ContractInput = {
      ...form,
      payments: (form.payments ?? []).map((p) => ({
        label: p.label,
        amount: p.amount,
        dueDate: p.dueDate,
        status: p.status,
        paidAt: p.paidAt,
      })),
    };

    if (editing) {
      updateContract(editing.id, payload);
      push({ title: 'Contrato atualizado', variant: 'success' });
    } else {
      addContract(payload);
      push({ title: 'Contrato criado', variant: 'success' });
    }
    setOpen(false);
  };

  const handleDelete = (c: Contract) => {
    removeContract(c.id);
    setConfirmDelete(null);
    push({ title: 'Contrato removido', variant: 'info' });
  };

  const setContractStatus = (c: Contract, status: ContractStatus) => {
    updateContract(c.id, { status });
    push({ title: `Status: ${CONTRACT_STATUS_LABELS[status]}`, variant: 'info' });
  };

  const setPaymentStatus = (c: Contract, paymentId: string, status: PaymentStatus) => {
    updatePayment(c.id, paymentId, {
      status,
      paidAt: status === 'pago' ? new Date().toISOString() : undefined,
    });
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Contratos"
        subtitle="Acompanhe propostas, assinaturas e entregas"
        icon={<FileSignature className="h-5 w-5 sm:h-6 sm:w-6" />}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>
            Novo contrato
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-ink-200/80 bg-white/60 p-1 shadow-soft dark:border-ink-800 dark:bg-ink-900/60">
        <Filter className="ml-1.5 h-3.5 w-3.5 text-ink-400" />
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200',
            filter === 'all'
              ? 'border-white/20 bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow'
              : 'border-transparent text-ink-600 hover:border-ink-200 hover:bg-ink-100 dark:text-ink-300 dark:hover:border-ink-700 dark:hover:bg-ink-800'
          )}
        >
          Todos ({contracts.length})
        </button>
        {STATUS_ORDER.map((s) => {
          const count = contracts.filter((c) => c.status === s).length;
          if (count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                filter === s
                  ? 'border-white/20 bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-glow'
                  : 'border-transparent text-ink-600 hover:border-ink-200 hover:bg-ink-100 dark:text-ink-300 dark:hover:border-ink-700 dark:hover:bg-ink-800'
              )}
            >
              {CONTRACT_STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="h-6 w-6" />}
          title="Sem contratos"
          description="Crie seu primeiro contrato para começar a controlar suas entregas."
          action={
            <Button onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>
              Novo contrato
            </Button>
          }
        />
      ) : (
        <div className="pm-stagger space-y-3">
          {filtered.map((c) => {
            const client = clients.find((cl) => cl.id === c.clientId);
            const svc = services.find((s) => s.id === c.serviceId);
            const paid = c.payments
              .filter((p) => p.status === 'pago')
              .reduce((acc, p) => acc + p.amount, 0);
            const pending = c.totalValue - paid;
            return (
              <motion.div
                key={c.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="pm-card pm-card-hover p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="neutral">{c.code}</Badge>
                      <Badge variant={STATUS_BADGE[c.status]}>
                        {CONTRACT_STATUS_LABELS[c.status]}
                      </Badge>
                      <Badge variant="info">{svc?.name ?? '—'}</Badge>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-ink-900 dark:text-ink-50">
                      {c.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
                      Cliente: {client?.name ?? '—'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-ink-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(c.startDate)} → {formatDate(c.endDate)}
                      </span>
                      {c.eventDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-brand-500" />
                          Evento: {formatDate(c.eventDate)}
                        </span>
                      )}
                      {c.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {c.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">
                        Valor
                      </p>
                      <p className="text-lg font-bold tabular-nums text-ink-900 dark:text-ink-50">
                        {formatMoney(c.totalValue, settings.currency)}
                      </p>
                      <p className="text-xs text-emerald-500">
                        Pago: {formatMoney(paid, settings.currency)}
                      </p>
                      {pending > 0 && (
                        <p className="text-xs text-accent-500">
                          Pendente: {formatMoney(pending, settings.currency)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 lg:justify-end">
                      <select
                        aria-label="Alterar status"
                        value={c.status}
                        onChange={(e) => setContractStatus(c, e.target.value as ContractStatus)}
                        className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-700 transition hover:border-ink-300 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200"
                      >
                        {STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {CONTRACT_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                      <Button size="xs" variant="secondary" onClick={() => setView(c)}>
                        Ver
                      </Button>
                      <Button
                        size="xs"
                        variant="secondary"
                        leftIcon={<Pencil className="h-3 w-3" />}
                        onClick={() => openEdit(c)}
                      >
                        Editar
                      </Button>
                      <IconButton
                        label="Remover"
                        size="sm"
                        tone="danger"
                        onClick={() => setConfirmDelete(c)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Modal
        open={open_}
        onClose={() => setOpen(false)}
        title={editing ? `Editar ${editing.code}` : 'Novo contrato'}
        description="Cadastre um contrato com cliente, serviço e cronograma de pagamentos."
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>{editing ? 'Salvar' : 'Criar contrato'}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              error={errors.title}
              maxLength={140}
            />
          </div>
          <Select
            label="Cliente"
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            options={[
              { value: '', label: 'Selecione…' },
              ...clients.map((c) => ({ value: c.id, label: c.name })),
            ]}
            error={errors.clientId}
          />
          <Select
            label="Serviço"
            value={form.serviceId}
            onChange={(e) => {
              const id = e.target.value;
              const svc = services.find((s) => s.id === id);
              setForm({
                ...form,
                serviceId: id,
                totalValue: svc && !editing ? svc.price : form.totalValue,
              });
            }}
            options={[
              { value: '', label: 'Selecione…' },
              ...services
                .filter((s) => s.active)
                .map((s) => ({
                  value: s.id,
                  label: `${s.name} — ${formatMoney(s.price, settings.currency)}`,
                })),
            ]}
            error={errors.serviceId}
          />
          <Input
            label="Valor total (centavos)"
            type="number"
            min={0}
            value={form.totalValue}
            onChange={(e) => setForm({ ...form, totalValue: Number(e.target.value) })}
            error={errors.totalValue}
            hint={formatMoney(form.totalValue || 0, settings.currency)}
          />
          <Input
            label="Local"
            value={form.location ?? ''}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            maxLength={160}
          />
          <Input
            label="Início"
            type="date"
            value={form.startDate.slice(0, 10)}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <Input
            label="Fim"
            type="date"
            value={form.endDate.slice(0, 10)}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
          <div className="sm:col-span-2">
            <Input
              label="Data do evento"
              type="date"
              value={form.eventDate ? form.eventDate.slice(0, 10) : ''}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Observações"
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              maxLength={2000}
            />
          </div>
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!view}
        onClose={() => setView(null)}
        title={view?.title ?? ''}
        description={view?.code}
        size="lg"
        footer={
          <Button onClick={() => setView(null)}>Fechar</Button>
        }
      >
        {view && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Cliente" value={clients.find((c) => c.id === view.clientId)?.name} />
              <Info label="Serviço" value={services.find((s) => s.id === view.serviceId)?.name} />
              <Info label="Status" value={CONTRACT_STATUS_LABELS[view.status]} />
              <Info label="Valor" value={formatMoney(view.totalValue, settings.currency)} />
              <Info label="Início" value={formatDate(view.startDate)} />
              <Info label="Fim" value={formatDate(view.endDate)} />
              {view.eventDate && <Info label="Evento" value={formatDate(view.eventDate)} />}
              {view.location && <Info label="Local" value={view.location} />}
            </div>
            {view.notes && (
              <div className="rounded-xl border border-ink-200/80 bg-white/60 p-3 text-sm dark:border-ink-800 dark:bg-ink-900/60">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                  Observações
                </p>
                <p className="mt-1 text-ink-700 dark:text-ink-200">{view.notes}</p>
              </div>
            )}
            <div>
              <p className="pm-label">Pagamentos</p>
              <div className="space-y-2">
                {view.payments.length === 0 && (
                  <p className="rounded-xl border border-dashed border-ink-300 p-3 text-center text-xs text-ink-500 dark:border-ink-700">
                    Sem pagamentos cadastrados.
                  </p>
                )}
                {view.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-ink-200/80 bg-white/60 p-3 transition hover:border-ink-300 dark:border-ink-800 dark:bg-ink-900/60 dark:hover:border-ink-700"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink-900 dark:text-ink-50">{p.label}</p>
                      <p className="text-xs text-ink-500 dark:text-ink-400">
                        Vencimento: {formatDate(p.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold tabular-nums text-ink-900 dark:text-ink-50">
                        {formatMoney(p.amount, settings.currency)}
                      </p>
                      <select
                        aria-label="Status do pagamento"
                        value={p.status}
                        onChange={(e) =>
                          setPaymentStatus(view, p.id, e.target.value as PaymentStatus)
                        }
                        className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs dark:border-ink-800 dark:bg-ink-900 dark:text-ink-200"
                      >
                        {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {PAYMENT_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remover contrato"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Remover
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-700 dark:text-ink-200">
          Tem certeza que deseja remover o contrato <strong>{confirmDelete?.code}</strong>?
        </p>
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-400">
        {label}
      </p>
      <p className="font-medium text-ink-900 dark:text-ink-50">{value ?? '—'}</p>
    </div>
  );
}