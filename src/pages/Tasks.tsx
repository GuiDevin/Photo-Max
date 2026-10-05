// PhotoMax — Tasks page with side-drag Kanban (fully responsive)
import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanSquare, Plus, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/layout/Layout';
import {
  Button,
  EmptyState,
  Input,
  Modal,
  Textarea,
  Select,
} from '@/components/ui/primitives';
import { useAppStore, type TaskInput } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { KanbanColumn } from '@/components/tasks/KanbanColumn';
import { TaskCard } from '@/components/tasks/TaskCard';
import {
  TASK_STATUSES,
  PRIORITY_LABELS,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/types';

const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  em_andamento: 'Em andamento',
  revisao: 'Em revisão',
  concluida: 'Concluídas',
};

const emptyForm: TaskInput & { status: TaskStatus } = {
  title: '',
  description: '',
  status: 'backlog',
  priority: 'media',
  dueDate: '',
  contractId: '',
  assignee: '',
  tags: [],
};

export function Tasks() {
  const tasks = useAppStore((s) => s.data.tasks);
  const contracts = useAppStore((s) => s.data.contracts);
  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const removeTask = useAppStore((s) => s.removeTask);
  const moveTask = useAppStore((s) => s.moveTask);
  const { push } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [tagsInput, setTagsInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const tasksByStatus = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const s of TASK_STATUSES) map.set(s, []);
    for (const t of tasks) {
      map.get(t.status)?.push(t);
    }
    for (const [k, list] of map) {
      map.set(k, list.sort((a, b) => a.order - b.order));
    }
    return map;
  }, [tasks]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setTagsInput('');
    setErrors({});
    setOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description ?? '',
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '',
      contractId: t.contractId ?? '',
      assignee: t.assignee ?? '',
      tags: t.tags,
    });
    setTagsInput(t.tags.join(', '));
    setErrors({});
    setOpen(true);
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Informe um título';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const payload: TaskInput = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      contractId: form.contractId || undefined,
      assignee: form.assignee || undefined,
      tags: form.tags,
    };
    if (editing) {
      updateTask(editing.id, payload);
      push({ title: 'Tarefa atualizada', variant: 'success' });
    } else {
      const created = addTask(payload);
      push({ title: 'Tarefa criada', variant: 'success' });
      if (payload.status && created.status !== payload.status) {
        moveTask(created.id, payload.status, 0);
      }
    }
    setOpen(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    const found = tasks.find((t) => t.id === id);
    setActiveTask(found ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);
    const overType = over.data.current?.type as string | undefined;
    const activeId = String(active.id);

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    if (overType === 'column') {
      const status = over.data.current?.status as TaskStatus;
      if (status !== activeTask.status) {
        const list = tasksByStatus.get(status) ?? [];
        moveTask(activeId, status, list.length);
      }
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      if (overTask.status !== activeTask.status) {
        const list = tasksByStatus.get(overTask.status) ?? [];
        const overIndex = list.findIndex((t) => t.id === overId);
        moveTask(activeId, overTask.status, Math.max(0, overIndex));
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;
    const overType = over.data.current?.type as string | undefined;

    if (overType === 'column') {
      const status = over.data.current?.status as TaskStatus;
      const list = tasksByStatus.get(status) ?? [];
      moveTask(activeId, status, list.length);
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      const list = tasksByStatus.get(overTask.status) ?? [];
      const overIndex = list.findIndex((t) => t.id === overId);
      moveTask(activeId, overTask.status, overIndex);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Tarefas"
        subtitle="Arraste os cards lateralmente para mudar o status"
        icon={<KanbanSquare className="h-5 w-5 sm:h-6 sm:w-6" />}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openNew}>
            Nova tarefa
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-200/80 bg-white/60 px-3 py-2 text-xs text-ink-600 backdrop-blur dark:border-ink-800 dark:bg-ink-900/40 dark:text-ink-300">
        <Sparkles className="h-3.5 w-3.5 text-brand-500" />
        <span>
          <strong className="font-semibold">Dica:</strong> clique e segure o lado esquerdo do card,
          então arraste-o lateralmente para a coluna desejada.
        </span>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<KanbanSquare className="h-6 w-6" />}
          title="Nenhuma tarefa ainda"
          description="Crie sua primeira tarefa e arraste para os lados para mudar o status."
          action={
            <Button onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>
              Criar tarefa
            </Button>
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveTask(null)}
        >
          {/* Mobile: horizontal snap-scroll; desktop: 4-col grid */}
          <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4">
            {TASK_STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus.get(status) ?? []}
              >
                {(tasksByStatus.get(status) ?? []).map((t) => (
                  <TaskCard key={t.id} task={t} onEdit={openEdit} onDelete={setConfirmDelete} />
                ))}
              </KanbanColumn>
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <div className="rotate-1">
                <TaskCard
                  task={activeTask}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isOverlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar tarefa' : 'Nova tarefa'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit}>{editing ? 'Salvar' : 'Criar tarefa'}</Button>
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
          <div className="sm:col-span-2">
            <Textarea
              label="Descrição"
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={2000}
            />
          </div>
          <Select
            label="Status inicial"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
            options={TASK_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          />
          <Select
            label="Prioridade"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
            options={(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => ({
              value: p,
              label: PRIORITY_LABELS[p],
            }))}
          />
          <Input
            label="Vencimento"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          <Input
            label="Responsável"
            placeholder="Você"
            value={form.assignee}
            onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            maxLength={60}
          />
          <div className="sm:col-span-2">
            <Select
              label="Contrato vinculado"
              value={form.contractId ?? ''}
              onChange={(e) => setForm({ ...form, contractId: e.target.value })}
              options={[
                { value: '', label: 'Sem contrato' },
                ...contracts.map((c) => ({ value: c.id, label: `${c.code} — ${c.title}` })),
              ]}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Tags (separadas por vírgula)"
              placeholder="edicao, estudio, briefing"
              value={tagsInput}
              onChange={(e) => {
                setTagsInput(e.target.value);
                setForm({
                  ...form,
                  tags: e.target.value
                    .split(',')
                    .map((t) => t.trim().toLowerCase())
                    .filter(Boolean),
                });
              }}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remover tarefa"
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
                  removeTask(confirmDelete.id);
                  setConfirmDelete(null);
                  push({ title: 'Tarefa removida', variant: 'info' });
                }
              }}
            >
              Remover
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-700 dark:text-ink-200">
          Remover a tarefa <strong>{confirmDelete?.title}</strong>?
        </p>
      </Modal>
    </div>
  );
}