// PhotoMax — Task card with side-drag strip
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CSSProperties, memo } from 'react';
import { Calendar, GripVertical, Trash2, Pencil, Tag } from 'lucide-react';
import type { Task, TaskPriority } from '@/types';
import { PRIORITY_LABELS } from '@/types';
import { formatDate, truncate } from '@/utils/format';
import { cn } from '@/utils/classnames';
import { useAppStore } from '@/store/useAppStore';

const priorityClasses: Record<TaskPriority, string> = {
  baixa: 'bg-emerald-500',
  media: 'bg-sky-500',
  alta: 'bg-amber-500',
  urgente: 'bg-accent-500 shadow-[0_0_12px_2px_rgba(244,63,94,0.4)]',
};

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  isOverlay?: boolean;
}

function TaskCardImpl({ task, onEdit, onDelete, isOverlay }: Props) {
  const sortable = useSortable({
    id: task.id,
    data: { type: 'task', task },
    transition: null,
  });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const contracts = useAppStore((s) => s.data.contracts);
  const linkedContract = task.contractId
    ? contracts.find((c) => c.id === task.contractId)
    : null;

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-stretch overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-soft transition-all duration-200 dark:border-ink-800 dark:bg-ink-900/70',
        isOverlay && 'shadow-glow ring-2 ring-brand-400/60 rotate-1',
        !isOverlay && 'hover:-translate-y-0.5 hover:shadow-glow hover:border-brand-300/60 dark:hover:border-brand-700/60'
      )}
      data-testid={`task-${task.id}`}
    >
      {/* Drag handle — the strip on the LEFT side; pressing and sliding moves the card */}
      <button
        type="button"
        aria-label="Arraste para o lado para mudar o status"
        className={cn(
          'flex w-7 shrink-0 cursor-grab touch-none select-none flex-col items-center justify-center gap-0.5 border-r border-ink-200/80 bg-gradient-to-b from-ink-100 to-ink-200/40 text-ink-500 transition-all duration-200',
          'hover:from-brand-500 hover:to-accent-500 hover:text-white hover:border-transparent',
          'dark:border-ink-800 dark:from-ink-800 dark:to-ink-900 dark:text-ink-400 dark:hover:from-brand-500 dark:hover:to-accent-500',
          isDragging && 'cursor-grabbing'
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className={cn('h-1.5 w-1.5 shrink-0 rounded-full', priorityClasses[task.priority])}
                aria-label={`Prioridade ${PRIORITY_LABELS[task.priority]}`}
              />
              <h4 className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">
                {task.title}
              </h4>
            </div>
            {task.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-ink-500 dark:text-ink-400">
                {truncate(task.description, 120)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
              onClick={() => onEdit(task)}
              aria-label="Editar tarefa"
              className="rounded-md border border-transparent p-1.5 text-ink-400 transition-all hover:border-ink-300 hover:bg-ink-100 hover:text-ink-800 dark:hover:border-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-100"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(task)}
              aria-label="Remover tarefa"
              className="rounded-md border border-transparent p-1.5 text-ink-400 transition-all hover:border-accent-300 hover:bg-accent-50 hover:text-accent-600 dark:hover:border-accent-700/60 dark:hover:bg-accent-900/30 dark:hover:text-accent-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {task.dueDate && (
            <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 text-[10px] font-medium text-ink-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300">
              <Calendar className="h-2.5 w-2.5" />
              {formatDate(task.dueDate)}
            </span>
          )}
          {linkedContract && (
            <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700 dark:border-brand-700/60 dark:bg-brand-900/40 dark:text-brand-200">
              {linkedContract.code}
            </span>
          )}
          {task.assignee && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/40 dark:text-emerald-200">
              {task.assignee}
            </span>
          )}
          {task.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 text-[10px] font-medium text-ink-600 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300"
            >
              <Tag className="h-2.5 w-2.5" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export const TaskCard = memo(TaskCardImpl);