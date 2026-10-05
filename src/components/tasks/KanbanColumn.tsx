// PhotoMax — Kanban column with horizontal "drop side" affordance.
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { Task, TaskStatus } from '@/types';
import { TASK_STATUS_LABELS } from '@/types';
import { cn } from '@/utils/classnames';

interface Props {
  status: TaskStatus;
  tasks: Task[];
  children: ReactNode;
}

const accent: Record<TaskStatus, string> = {
  backlog: 'from-slate-500/15 to-slate-500/5',
  em_andamento: 'from-amber-500/20 to-amber-500/5',
  revisao: 'from-sky-500/20 to-sky-500/5',
  concluida: 'from-emerald-500/20 to-emerald-500/5',
};

const dot: Record<TaskStatus, string> = {
  backlog: 'bg-ink-400',
  em_andamento: 'bg-amber-500',
  revisao: 'bg-sky-500',
  concluida: 'bg-emerald-500',
};

export function KanbanColumn({ status, tasks, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: 'column', status },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full min-h-[480px] w-full flex-col gap-3 rounded-2xl border border-ink-200/70 bg-white/40 p-3 backdrop-blur dark:border-ink-800 dark:bg-ink-950/40',
        'transition-all duration-200',
        isOver && 'pm-drag-over border-brand-400 bg-brand-50/40 dark:bg-brand-900/10'
      )}
      data-testid={`column-${status}`}
    >
      <div
        className={cn(
          'flex items-center justify-between rounded-xl bg-gradient-to-br p-3',
          accent[status]
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', dot[status])} aria-hidden />
          <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
            {TASK_STATUS_LABELS[status]}
          </h3>
        </div>
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold text-ink-700 shadow-soft dark:bg-ink-900/70 dark:text-ink-200">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <motion.div
          layout
          className="flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1"
        >
          {tasks.length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-ink-300/70 p-4 text-center text-xs text-ink-500 dark:border-ink-700">
              <p>
                {isOver
                  ? 'Solte aqui'
                  : 'Arraste tarefas para esta coluna'}
              </p>
            </div>
          )}
          {children}
        </motion.div>
      </SortableContext>
    </div>
  );
}