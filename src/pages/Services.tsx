// PhotoMax â€” Services page
import { useMemo, useState } from 'react';
import { Briefcase, Plus, Pencil, Trash2, Tag, Clock, DollarSign, ToggleLeft } from 'lucide-react';
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
import { useAppStore, type ServiceInput } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { formatMoney, formatDuration } from '@/utils/format';
import { SERVICE_CATEGORY_LABELS, type Service, type ServiceCategory } from '@/types';
import { cn } from '@/utils/classnames';

const CATEGORIES: { value: ServiceCategory; label: string }[] = (
  Object.entries(SERVICE_CATEGORY_LABELS) as [ServiceCategory, string][]
).map(([value, label]) => ({ value, label }));

const emptyForm: ServiceInput = {
  name: '',
  category: 'ensaio',
  description: '',
  price: 0,
  durationMinutes: 60,
  active: true,
};

export function Services() {
  const services = useAppStore((s) => s.data.services);
  const addService = useAppStore((s) => s.addService);
  const updateService = useAppStore((s) => s.updateService);
  const removeService = useAppStore((s) => s.removeService);
  const settings = useAppStore((s) => s.data.settings);
  const { lower } = useGlobalSearch();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceInput>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    if (!lower) return services;
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        s.description.toLowerCase().includes(lower) ||
        SERVICE_CATEGORY_LABELS[s.category].toLowerCase().includes(lower)
    );
  }, [services, lower]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      name: s.name,
      category: s.category,
      description: s.description,
      price: s.price,
      durationMinutes: s.durationMinutes,
      active: s.active,
    });
    setErrors({});
    setOpen(true);
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Informe um nome';
    if (!Number.isFinite(form.price) || form.price < 0) next.price = 'Valor invÃ¡lido';
    if (!Number.isFinite(form.durationMinutes) || form.durationMinutes <= 0)
      next.durationMinutes = 'DuraÃ§Ã£o invÃ¡lida';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (editing) {
      updateService(editing.id, form);
      toast.push({ title: 'ServiÃ§o atualizado', variant: 'success' });
    } else {
      addService(form);
      toast.push({ title: 'ServiÃ§o criado', variant: 'success' });
    }
    setOpen(false);
  };

  const handleDelete = (s: Service) => {
    removeService(s.id);
    setConfirmDelete(null);
    toast.push({ title: 'ServiÃ§o removido', variant: 'info' });
  };

  const toggleActive = (s: Service) => {
    updateService(s.id, { active: !s.active });
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="ServiÃ§os"
        subtitle="CatÃ¡logo de pacotes e preÃ§os do seu estÃºdio"
        icon={<Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>
            Novo serviÃ§o
          </Button>
        }
      />

      <div className="pm-stagger grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="xl:col-span-3">
            <EmptyState
              icon={<Briefcase className="h-6 w-6" />}
              title="Nenhum serviÃ§o encontrado"
              description="Crie pacotes de sessÃµes, eventos ou ensaios para comeÃ§ar."
              action={
                <Button onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>
                  Criar serviÃ§o
                </Button>
              }
            />
          </div>
        ) : (
          filtered.map((s) => (
            <motion.div
              key={s.id}
              layout
              whileHover={{ y: -2 }}
              transition={{ duration: 0.25 }}
              className="pm-card pm-card-hover group p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={s.active ? 'brand' : 'neutral'}>
                    <ToggleLeft className="h-2.5 w-2.5" />
                    {s.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge variant="info">
                    <Tag className="h-3 w-3" />
                    {SERVICE_CATEGORY_LABELS[s.category]}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <IconButton
                    label={s.active ? 'Desativar' : 'Ativar'}
                    size="sm"
                    onClick={() => toggleActive(s)}
                    className={
                      s.active
                        ? 'text-ink-500 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-900/30'
                        : 'text-ink-500 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-900/30'
                    }
                  >
                    <ToggleLeft className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton label="Editar" size="sm" onClick={() => openEdit(s)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </IconButton>
                  <IconButton
                    label="Remover"
                    size="sm"
                    tone="danger"
                    onClick={() => setConfirmDelete(s)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              </div>

              <h3 className="mt-3 text-lg font-semibold tracking-tight text-ink-900 dark:text-ink-50">
                {s.name}
              </h3>
              <p className="mt-1 line-clamp-3 text-sm text-ink-600 dark:text-ink-300">
                {s.description}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-ink-200/70 pt-3 dark:border-ink-800">
                <div className="flex items-center gap-1 text-sm font-bold tabular-nums text-ink-900 dark:text-ink-50">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  {formatMoney(s.price, settings.currency)}
                </div>
                <div className="flex items-center gap-1 text-xs text-ink-500 dark:text-ink-400">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(s.durationMinutes)}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar serviÃ§o' : 'Novo serviÃ§o'}
        description="Defina um pacote que poderÃ¡ ser usado em contratos."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>{editing ? 'Salvar alteraÃ§Ãµes' : 'Criar serviÃ§o'}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Nome"
              placeholder="Ex.: Ensaio externo 2h"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              maxLength={80}
            />
          </div>
          <Select
            label="Categoria"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as ServiceCategory })}
            options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          />
          <Input
            label="PreÃ§o (em centavos)"
            type="number"
            min={0}
            step={1}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            error={errors.price}
            hint={`â‰ˆ ${formatMoney(form.price || 0, settings.currency)}`}
          />
          <div className="sm:col-span-2">
            <Input
              label="DuraÃ§Ã£o (minutos)"
              type="number"
              min={5}
              max={24 * 60}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
              error={errors.durationMinutes}
              hint={formatDuration(form.durationMinutes)}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="DescriÃ§Ã£o"
              placeholder="O que estÃ¡ incluso? Prazos? Entregas?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={1000}
            />
          </div>
          <label
            className={cn(
              'sm:col-span-2 flex cursor-pointer items-center gap-3 rounded-xl border bg-white/60 p-3 transition dark:bg-ink-900/60',
              form.active
                ? 'border-brand-300 bg-brand-50/60 dark:border-brand-700/60 dark:bg-brand-900/20'
                : 'border-ink-200 dark:border-ink-800'
            )}
          >
            <input
              type="checkbox"
              checked={form.active !== false}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400"
            />
            <span className="text-sm text-ink-700 dark:text-ink-200">
              ServiÃ§o ativo (visÃ­vel para novos contratos)
            </span>
          </label>
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remover serviÃ§o"
        description="Esta aÃ§Ã£o nÃ£o pode ser desfeita."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              Sim, remover
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-700 dark:text-ink-200">
          Tem certeza que deseja remover o serviÃ§o{' '}
          <strong className="font-semibold">{confirmDelete?.name}</strong>? Contratos jÃ¡
          existentes continuarÃ£o exibindo este serviÃ§o.
        </p>
      </Modal>
    </div>
  );
}
