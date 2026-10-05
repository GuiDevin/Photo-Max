// PhotoMax — Clients page (CRM)
import { useMemo, useState } from 'react';
import {
  Users as UsersIcon,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building2,
  Tag,
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
  Textarea,
} from '@/components/ui/primitives';
import { useAppStore, type ClientInput } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { formatDate, initials, truncate } from '@/utils/format';
import { sanitizeTags } from '@/utils/security';
import type { Client } from '@/types';

const emptyForm: ClientInput = {
  name: '',
  email: '',
  phone: '',
  company: '',
  notes: '',
  tags: [],
};

export function Clients() {
  const clients = useAppStore((s) => s.data.clients);
  const contracts = useAppStore((s) => s.data.contracts);
  const addClient = useAppStore((s) => s.addClient);
  const updateClient = useAppStore((s) => s.updateClient);
  const removeClient = useAppStore((s) => s.removeClient);
  const { push } = useToast();
  const { lower } = useGlobalSearch();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientInput>(emptyForm);
  const [tagsInput, setTagsInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Client | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    if (!lower) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.email.toLowerCase().includes(lower) ||
        c.phone.toLowerCase().includes(lower) ||
        (c.company ?? '').toLowerCase().includes(lower) ||
        c.tags.some((t) => t.includes(lower))
    );
  }, [clients, lower]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setTagsInput('');
    setErrors({});
    setOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email,
      phone: c.phone,
      company: c.company,
      notes: c.notes,
      tags: c.tags,
    });
    setTagsInput(c.tags.join(', '));
    setErrors({});
    setOpen(true);
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Informe o nome';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = 'E-mail inválido';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload: ClientInput = {
      ...form,
      tags: sanitizeTags(
        tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      ),
    };
    if (editing) {
      updateClient(editing.id, payload);
      push({ title: 'Cliente atualizado', variant: 'success' });
    } else {
      addClient(payload);
      push({ title: 'Cliente criado', variant: 'success' });
    }
    setOpen(false);
  };

  const handleDelete = (c: Client) => {
    removeClient(c.id);
    setConfirmDelete(null);
    push({ title: 'Cliente removido', variant: 'info' });
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Clientes"
        subtitle="Sua base de contatos e histórico"
        icon={<UsersIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>
            Novo cliente
          </Button>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="h-6 w-6" />}
          title="Sem clientes ainda"
          description="Adicione seus primeiros clientes para usar em contratos e tarefas."
          action={
            <Button onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>
              Novo cliente
            </Button>
          }
        />
      ) : (
        <div className="pm-stagger grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const clientContracts = contracts.filter((ct) => ct.clientId === c.id);
            return (
              <motion.div
                key={c.id}
                layout
                whileHover={{ y: -2 }}
                transition={{ duration: 0.25 }}
                className="pm-card pm-card-hover p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-semibold text-white shadow-glow">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">
                        {c.name}
                      </h3>
                      {c.company && (
                        <p className="flex items-center gap-1 truncate text-xs text-ink-500 dark:text-ink-400">
                          <Building2 className="h-3 w-3" />
                          {c.company}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconButton label="Editar" size="sm" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </IconButton>
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

                <div className="mt-4 space-y-1.5 text-sm">
                  <p className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                    <span className="truncate">{c.email || '—'}</span>
                  </p>
                  <p className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                    <span className="truncate">{c.phone || '—'}</span>
                  </p>
                </div>

                {c.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {c.tags.slice(0, 4).map((t) => (
                      <Badge key={t} variant="brand">
                        <Tag className="h-2.5 w-2.5" />
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}

                {c.notes && (
                  <p className="mt-3 line-clamp-2 text-xs italic text-ink-500 dark:text-ink-400">
                    “{truncate(c.notes, 120)}”
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-ink-200/70 pt-3 text-xs dark:border-ink-800">
                  <span className="text-ink-500 dark:text-ink-400">
                    {clientContracts.length} contrato{clientContracts.length === 1 ? '' : 's'}
                  </span>
                  <span className="text-ink-500 dark:text-ink-400">
                    Desde {formatDate(c.createdAt)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar cliente' : 'Novo cliente'}
        description="Mantenha o cadastro atualizado para usar em contratos."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>{editing ? 'Salvar alterações' : 'Criar cliente'}</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Nome completo"
              placeholder="Ex.: Marina Albuquerque"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              maxLength={100}
            />
          </div>
          <Input
            label="E-mail"
            type="email"
            placeholder="email@dominio.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
            maxLength={254}
          />
          <Input
            label="Telefone"
            placeholder="+55 11 99887-1122"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            maxLength={32}
          />
          <div className="sm:col-span-2">
            <Input
              label="Empresa / contexto"
              placeholder="Ex.: Casamento, Lumiar Joias, Construtora Horizonte"
              value={form.company ?? ''}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              maxLength={100}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Tags (separadas por vírgula)"
              placeholder="vip, corporativo, recorrente"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              hint="Use letras, números e hífen. Ex.: vip, ansiao, corporativo"
              maxLength={300}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Notas internas"
              placeholder="Preferências, histórico, observações…"
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              maxLength={2000}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remover cliente"
        description="Esta ação não pode ser desfeita."
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
          Tem certeza que deseja remover <strong>{confirmDelete?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
}