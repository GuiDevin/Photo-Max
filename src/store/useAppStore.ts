// PhotoMax — Central app store (Zustand) with persistence, undo and selectors.
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  AppData,
  AppSettings,
  Client,
  Contract,
  ContractPayment,
  Expense,
  Service,
  Task,
  TaskStatus,
  Theme,
} from '@/types';
import { buildSeed } from '@/data/seed';
import {
  newContractCode,
  newId,
  sanitizeEmail,
  sanitizeMultiline,
  sanitizePhone,
  sanitizeTags,
  sanitizeText,
  toSafeInt,
  toSafeNumber,
} from '@/utils/security';
import { loadData, saveData } from '@/utils/storage';

interface StoreActions {
  // settings
  setSettings: (patch: Partial<AppSettings>) => void;
  setTheme: (theme: Theme) => void;
  // services
  addService: (input: ServiceInput) => Service;
  updateService: (id: string, patch: Partial<Service>) => void;
  removeService: (id: string) => void;
  // clients
  addClient: (input: ClientInput) => Client;
  updateClient: (id: string, patch: Partial<Client>) => void;
  removeClient: (id: string) => void;
  // contracts
  addContract: (input: ContractInput) => Contract;
  updateContract: (
    id: string,
    patch: Partial<Omit<Contract, 'payments'>> & {
      payments?: (Omit<ContractPayment, 'id'> & { id?: string })[];
    }
  ) => void;
  removeContract: (id: string) => void;
  updatePayment: (contractId: string, paymentId: string, patch: Partial<ContractPayment>) => void;
  addPayment: (contractId: string, payment: Omit<ContractPayment, 'id'>) => void;
  removePayment: (contractId: string, paymentId: string) => void;
  // tasks
  addTask: (input: TaskInput) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  moveTask: (id: string, targetStatus: TaskStatus, targetOrder: number) => void;
  reorderTask: (id: string, newOrder: number) => void;
  // expenses
  addExpense: (input: ExpenseInput) => Expense;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
  // data
  resetData: () => void;
  replaceData: (data: AppData) => void;
  exportSnapshot: () => string;
}

export type ServiceInput = {
  name: string;
  category: Service['category'];
  description: string;
  price: number;
  durationMinutes: number;
  active?: boolean;
};

export type ClientInput = {
  name: string;
  email: string;
  phone: string;
  company?: string;
  notes?: string;
  tags?: string[];
};

export type ContractInput = {
  title: string;
  clientId: string;
  serviceId: string;
  totalValue: number;
  startDate: string;
  endDate: string;
  eventDate?: string;
  location?: string;
  notes?: string;
  payments?: Omit<ContractPayment, 'id'>[];
};

export type TaskInput = {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Task['priority'];
  dueDate?: string;
  contractId?: string;
  assignee?: string;
  tags?: string[];
};

export type ExpenseInput = {
  description: string;
  category: Expense['category'];
  amount: number;
  date: string;
  recurring?: boolean;
};

interface Store extends StoreActions {
  data: AppData;
  hydrated: boolean;
  saveError: string | null;
}

// Apply persisted data on first run
function bootData(): AppData {
  const persisted = loadData();
  if (persisted && Array.isArray(persisted.services)) return persisted;
  return buildSeed();
}

function persist(data: AppData): string | null {
  const r = saveData(data);
  if (!r.ok) return r.reason;
  return null;
}

function sanitizeServiceInput(input: ServiceInput): Omit<Service, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: sanitizeText(input.name, 80),
    category: input.category,
    description: sanitizeMultiline(input.description, 1000),
    price: toSafeInt(input.price, 0, { min: 0, max: 1_000_000_00 }),
    durationMinutes: toSafeInt(input.durationMinutes, 60, { min: 5, max: 24 * 60 }),
    active: input.active !== false,
  };
}

function sanitizeClientInput(input: ClientInput): Omit<Client, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: sanitizeText(input.name, 100) || 'Sem nome',
    email: sanitizeEmail(input.email),
    phone: sanitizePhone(input.phone),
    company: input.company ? sanitizeText(input.company, 100) : undefined,
    notes: input.notes ? sanitizeMultiline(input.notes, 2000) : undefined,
    tags: sanitizeTags(input.tags ?? []),
  };
}

function sanitizeTaskInput(input: TaskInput): Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'> {
  return {
    title: sanitizeText(input.title, 140) || 'Sem título',
    description: input.description ? sanitizeMultiline(input.description, 2000) : undefined,
    status: input.status ?? 'backlog',
    priority: input.priority ?? 'media',
    dueDate: input.dueDate,
    contractId: input.contractId,
    assignee: input.assignee ? sanitizeText(input.assignee, 60) : undefined,
    tags: sanitizeTags(input.tags ?? []),
  };
}

function sanitizeExpenseInput(input: ExpenseInput): Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    description: sanitizeText(input.description, 140) || 'Despesa',
    category: input.category,
    amount: toSafeInt(input.amount, 0, { min: 0, max: 1_000_000_00 }),
    date: input.date || new Date().toISOString(),
    recurring: !!input.recurring,
  };
}

function nextContractSequence(contracts: Contract[]): number {
  const year = new Date().getFullYear();
  const yearPrefix = `CT-${year}-`;
  const sameYear = contracts.filter((c) => c.code?.startsWith(yearPrefix));
  const max = sameYear.reduce((acc, c) => {
    const seq = Number(c.code?.split('-').pop() || 0);
    return Number.isFinite(seq) && seq > acc ? seq : acc;
  }, 0);
  return max + 1;
}

function recomputeTaskOrder(tasks: Task[], status: TaskStatus): Task[] {
  return tasks
    .filter((t) => t.status === status)
    .sort((a, b) => a.order - b.order)
    .map((t, i) => ({ ...t, order: i }));
}

export const useAppStore = create<Store>()(
  subscribeWithSelector((set, get) => ({
    data: bootData(),
    hydrated: false,
    saveError: null,

    setSettings: (patch) => {
      const merged = { ...get().data, settings: { ...get().data.settings, ...patch } };
      const err = persist(merged);
      set({ data: merged, saveError: err });
    },

    setTheme: (theme) => get().setSettings({ theme }),

    // ===== Services =====
    addService: (input) => {
      const clean = sanitizeServiceInput(input);
      const now = new Date().toISOString();
      const service: Service = { id: newId('svc-'), ...clean, createdAt: now, updatedAt: now };
      const next = { ...get().data, services: [service, ...get().data.services] };
      set({ data: next, saveError: persist(next) });
      return service;
    },
    updateService: (id, patch) => {
      const next = {
        ...get().data,
        services: get().data.services.map((s) =>
          s.id === id
            ? {
                ...s,
                ...patch,
                name: patch.name !== undefined ? sanitizeText(patch.name, 80) : s.name,
                description:
                  patch.description !== undefined
                    ? sanitizeMultiline(patch.description, 1000)
                    : s.description,
                price:
                  patch.price !== undefined
                    ? toSafeInt(patch.price, s.price, { min: 0, max: 1_000_000_00 })
                    : s.price,
                durationMinutes:
                  patch.durationMinutes !== undefined
                    ? toSafeInt(patch.durationMinutes, s.durationMinutes, {
                        min: 5,
                        max: 24 * 60,
                      })
                    : s.durationMinutes,
                updatedAt: new Date().toISOString(),
              }
            : s
        ),
      };
      set({ data: next, saveError: persist(next) });
    },
    removeService: (id) => {
      const next = { ...get().data, services: get().data.services.filter((s) => s.id !== id) };
      set({ data: next, saveError: persist(next) });
    },

    // ===== Clients =====
    addClient: (input) => {
      const clean = sanitizeClientInput(input);
      const now = new Date().toISOString();
      const client: Client = { id: newId('cli-'), ...clean, createdAt: now, updatedAt: now };
      const next = { ...get().data, clients: [client, ...get().data.clients] };
      set({ data: next, saveError: persist(next) });
      return client;
    },
    updateClient: (id, patch) => {
      const next = {
        ...get().data,
        clients: get().data.clients.map((c) =>
          c.id === id
            ? {
                ...c,
                ...patch,
                name: patch.name !== undefined ? sanitizeText(patch.name, 100) : c.name,
                email: patch.email !== undefined ? sanitizeEmail(patch.email) : c.email,
                phone: patch.phone !== undefined ? sanitizePhone(patch.phone) : c.phone,
                company: patch.company !== undefined ? sanitizeText(patch.company, 100) : c.company,
                notes:
                  patch.notes !== undefined ? sanitizeMultiline(patch.notes, 2000) : c.notes,
                tags: patch.tags !== undefined ? sanitizeTags(patch.tags) : c.tags,
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      };
      set({ data: next, saveError: persist(next) });
    },
    removeClient: (id) => {
      const next = { ...get().data, clients: get().data.clients.filter((c) => c.id !== id) };
      set({ data: next, saveError: persist(next) });
    },

    // ===== Contracts =====
    addContract: (input) => {
      const seq = nextContractSequence(get().data.contracts);
      const now = new Date().toISOString();
      const code = newContractCode(new Date().getFullYear(), seq);
      const contract: Contract = {
        id: newId('ct-'),
        code,
        title: sanitizeText(input.title, 140) || 'Contrato',
        clientId: input.clientId,
        serviceId: input.serviceId,
        status: 'rascunho',
        totalValue: toSafeInt(input.totalValue, 0, { min: 0, max: 1_000_000_00 }),
        startDate: input.startDate,
        endDate: input.endDate,
        eventDate: input.eventDate,
        location: input.location ? sanitizeText(input.location, 160) : undefined,
        notes: input.notes ? sanitizeMultiline(input.notes, 2000) : undefined,
        payments: (input.payments ?? []).map((p) => ({
          ...p,
          id: newId('pay-'),
          label: sanitizeText(p.label, 80),
          amount: toSafeInt(p.amount, 0, { min: 0, max: 1_000_000_00 }),
        })),
        createdAt: now,
        updatedAt: now,
      };
      const next = { ...get().data, contracts: [contract, ...get().data.contracts] };
      set({ data: next, saveError: persist(next) });
      return contract;
    },
    updateContract: (id, patch) => {
      const { payments: incomingPayments, ...rest } = patch;
      const next: AppData = {
        ...get().data,
        contracts: get().data.contracts.map((c): Contract => {
          if (c.id !== id) return c;
          const merged: Contract = {
            ...c,
            ...rest,
            title: rest.title !== undefined ? sanitizeText(rest.title, 140) : c.title,
            location:
              rest.location !== undefined ? sanitizeText(rest.location, 160) : c.location,
            notes:
              rest.notes !== undefined ? sanitizeMultiline(rest.notes, 2000) : c.notes,
            totalValue:
              rest.totalValue !== undefined
                ? toSafeInt(rest.totalValue, c.totalValue, {
                    min: 0,
                    max: 1_000_000_00,
                  })
                : c.totalValue,
            updatedAt: new Date().toISOString(),
          };
          if (incomingPayments) {
            return {
              ...merged,
              payments: incomingPayments.map<ContractPayment>((p, i) => ({
                id: p.id ?? c.payments[i]?.id ?? newId('pay-'),
                label: sanitizeText(p.label, 80),
                amount: toSafeInt(p.amount, 0, { min: 0, max: 1_000_000_00 }),
                dueDate: p.dueDate,
                status: p.status,
                paidAt: p.paidAt,
              })),
            };
          }
          return merged;
        }),
      };
      set({ data: next, saveError: persist(next) });
    },
    removeContract: (id) => {
      const next = { ...get().data, contracts: get().data.contracts.filter((c) => c.id !== id) };
      set({ data: next, saveError: persist(next) });
    },
    addPayment: (contractId, payment) => {
      const next = {
        ...get().data,
        contracts: get().data.contracts.map((c) =>
          c.id === contractId
            ? {
                ...c,
                payments: [
                  ...c.payments,
                  {
                    ...payment,
                    id: newId('pay-'),
                    label: sanitizeText(payment.label, 80),
                    amount: toSafeInt(payment.amount, 0, {
                      min: 0,
                      max: 1_000_000_00,
                    }),
                  },
                ],
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      };
      set({ data: next, saveError: persist(next) });
    },
    updatePayment: (contractId, paymentId, patch) => {
      const next = {
        ...get().data,
        contracts: get().data.contracts.map((c) =>
          c.id === contractId
            ? {
                ...c,
                payments: c.payments.map((p) =>
                  p.id === paymentId
                    ? {
                        ...p,
                        ...patch,
                        label: patch.label !== undefined ? sanitizeText(patch.label, 80) : p.label,
                        amount:
                          patch.amount !== undefined
                            ? toSafeInt(patch.amount, p.amount, {
                                min: 0,
                                max: 1_000_000_00,
                              })
                            : p.amount,
                      }
                    : p
                ),
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      };
      set({ data: next, saveError: persist(next) });
    },
    removePayment: (contractId, paymentId) => {
      const next = {
        ...get().data,
        contracts: get().data.contracts.map((c) =>
          c.id === contractId
            ? {
                ...c,
                payments: c.payments.filter((p) => p.id !== paymentId),
                updatedAt: new Date().toISOString(),
              }
            : c
        ),
      };
      set({ data: next, saveError: persist(next) });
    },

    // ===== Tasks =====
    addTask: (input) => {
      const clean = sanitizeTaskInput(input);
      const status = clean.status;
      const sameStatus = get().data.tasks.filter((t) => t.status === status);
      const now = new Date().toISOString();
      const task: Task = {
        id: newId('tsk-'),
        ...clean,
        order: sameStatus.length,
        createdAt: now,
        updatedAt: now,
      };
      const next = { ...get().data, tasks: [task, ...get().data.tasks] };
      set({ data: next, saveError: persist(next) });
      return task;
    },
    updateTask: (id, patch) => {
      const next = {
        ...get().data,
        tasks: get().data.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                ...patch,
                title: patch.title !== undefined ? sanitizeText(patch.title, 140) : t.title,
                description:
                  patch.description !== undefined
                    ? sanitizeMultiline(patch.description, 2000)
                    : t.description,
                tags: patch.tags !== undefined ? sanitizeTags(patch.tags) : t.tags,
                updatedAt: new Date().toISOString(),
              }
            : t
        ),
      };
      set({ data: next, saveError: persist(next) });
    },
    removeTask: (id) => {
      const next = { ...get().data, tasks: get().data.tasks.filter((t) => t.id !== id) };
      set({ data: next, saveError: persist(next) });
    },
    moveTask: (id, targetStatus, targetOrder) => {
      const all = get().data.tasks.slice();
      const idx = all.findIndex((t) => t.id === id);
      if (idx < 0) return;
      const moving = { ...all[idx], status: targetStatus, updatedAt: new Date().toISOString() };
      all.splice(idx, 1);

      // Re-compute orders for origin and target columns
      let others = all.filter((t) => t.status === targetStatus && t.id !== id);
      others = others.sort((a, b) => a.order - b.order);

      const safeOrder = Math.max(0, Math.min(targetOrder, others.length));
      others.splice(safeOrder, 0, moving);
      const reindexed = others.map((t, i) => ({ ...t, order: i }));

      const merged = get().data.tasks.map((t) => {
        if (t.id === id) {
          const m = reindexed.find((r) => r.id === id);
          return m ? m : moving;
        }
        const reIdx = reindexed.find((r) => r.id === t.id);
        return reIdx ?? t;
      });

      const next = { ...get().data, tasks: merged };
      set({ data: next, saveError: persist(next) });
    },
    reorderTask: (id, newOrder) => {
      const target = get().data.tasks.find((t) => t.id === id);
      if (!target) return;
      get().moveTask(id, target.status, newOrder);
    },

    // ===== Expenses =====
    addExpense: (input) => {
      const clean = sanitizeExpenseInput(input);
      const now = new Date().toISOString();
      const exp: Expense = { id: newId('exp-'), ...clean, createdAt: now, updatedAt: now };
      const next = { ...get().data, expenses: [exp, ...get().data.expenses] };
      set({ data: next, saveError: persist(next) });
      return exp;
    },
    updateExpense: (id, patch) => {
      const next = {
        ...get().data,
        expenses: get().data.expenses.map((e) =>
          e.id === id
            ? {
                ...e,
                ...patch,
                description:
                  patch.description !== undefined
                    ? sanitizeText(patch.description, 140)
                    : e.description,
                amount:
                  patch.amount !== undefined
                    ? toSafeInt(patch.amount, e.amount, { min: 0, max: 1_000_000_00 })
                    : e.amount,
                updatedAt: new Date().toISOString(),
              }
            : e
        ),
      };
      set({ data: next, saveError: persist(next) });
    },
    removeExpense: (id) => {
      const next = { ...get().data, expenses: get().data.expenses.filter((e) => e.id !== id) };
      set({ data: next, saveError: persist(next) });
    },

    // ===== Data =====
    resetData: () => {
      const fresh = buildSeed();
      set({ data: fresh, saveError: persist(fresh) });
    },
    replaceData: (data) => {
      const sanitized: AppData = {
        services: Array.isArray(data.services) ? data.services : [],
        clients: Array.isArray(data.clients) ? data.clients : [],
        contracts: Array.isArray(data.contracts) ? data.contracts : [],
        tasks: Array.isArray(data.tasks) ? data.tasks : [],
        expenses: Array.isArray(data.expenses) ? data.expenses : [],
        settings: data.settings,
        schemaVersion: 1,
      };
      // Re-normalize task orders
      const tasksByStatus = new Map<TaskStatus, Task[]>();
      for (const t of sanitized.tasks) {
        if (!tasksByStatus.has(t.status)) tasksByStatus.set(t.status, []);
        tasksByStatus.get(t.status)!.push(t);
      }
      const normalizedTasks: Task[] = [];
      for (const [, list] of tasksByStatus) {
        list
          .sort((a, b) => a.order - b.order)
          .forEach((t, i) => normalizedTasks.push({ ...t, order: i }));
      }
      const finalData = { ...sanitized, tasks: normalizedTasks };
      set({ data: finalData, saveError: persist(finalData) });
    },
    exportSnapshot: () => JSON.stringify(get().data, null, 2),
  }))
);

// Selectors
export const selectServices = (s: Store) => s.data.services;
export const selectClients = (s: Store) => s.data.clients;
export const selectContracts = (s: Store) => s.data.contracts;
export const selectTasks = (s: Store) => s.data.tasks;
export const selectExpenses = (s: Store) => s.data.expenses;
export const selectSettings = (s: Store) => s.data.settings;

export const selectTasksByStatus = (status: TaskStatus) => (s: Store) =>
  recomputeTaskOrder(s.data.tasks, status);

export const selectContractById = (id: string) => (s: Store) =>
  s.data.contracts.find((c) => c.id === id);

// Hydrate flag toggled on first subscription
useAppStore.setState({ hydrated: true });

// Avoid floating-point drift on aggregation utilities
export const cents = (n: number) => toSafeNumber(Math.round(n), 0);