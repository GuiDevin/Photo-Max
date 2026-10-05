// PhotoMax — Domain Types
// Strict, sanitizable shapes. No `any`. No `unknown` leaks to UI.

export type ID = string;
export type ISODate = string; // ISO 8601 string e.g. "2026-01-15T13:00:00.000Z"

export type Currency = 'BRL' | 'USD' | 'EUR';

export type Theme = 'light' | 'dark' | 'system';

export type ServiceCategory =
  | 'ensaio'
  | 'casamento'
  | 'evento'
  | 'corporativo'
  | 'produto'
  | 'retrato'
  | 'outro';

export type ContractStatus =
  | 'rascunho'
  | 'enviado'
  | 'assinado'
  | 'em_andamento'
  | 'concluido'
  | 'cancelado';

export type PaymentStatus =
  | 'pendente'
  | 'parcial'
  | 'pago'
  | 'atrasado'
  | 'cancelado';

export type TaskStatus = 'backlog' | 'em_andamento' | 'revisao' | 'concluida';
export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export interface Service {
  id: ID;
  name: string;
  category: ServiceCategory;
  description: string;
  price: number; // in cents to avoid float errors
  durationMinutes: number;
  active: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Client {
  id: ID;
  name: string;
  email: string;
  phone: string;
  company?: string;
  notes?: string;
  tags: string[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface ContractPayment {
  id: ID;
  label: string; // e.g. "Sinal", "Parcela 1/3"
  amount: number; // cents
  dueDate: ISODate;
  status: PaymentStatus;
  paidAt?: ISODate;
}

export interface Contract {
  id: ID;
  code: string; // e.g. "CT-2026-0001"
  title: string;
  clientId: ID;
  serviceId: ID;
  status: ContractStatus;
  totalValue: number; // cents
  startDate: ISODate;
  endDate: ISODate;
  eventDate?: ISODate;
  location?: string;
  notes?: string;
  payments: ContractPayment[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Task {
  id: ID;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: ISODate;
  contractId?: ID;
  assignee?: string;
  tags: string[];
  order: number; // for in-column ordering
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Expense {
  id: ID;
  description: string;
  category: 'equipamento' | 'transporte' | 'alimentacao' | 'marketing' | 'software' | 'outro';
  amount: number; // cents
  date: ISODate;
  recurring: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface AppSettings {
  studioName: string;
  ownerName: string;
  currency: Currency;
  theme: Theme;
  locale: 'pt-BR' | 'en-US';
  taxRate: number; // 0..1, e.g. 0.06 = 6%
}

export interface AppData {
  services: Service[];
  clients: Client[];
  contracts: Contract[];
  tasks: Task[];
  expenses: Expense[];
  settings: AppSettings;
  schemaVersion: number;
}

// Helpers for column ids in Kanban
export const TASK_STATUSES: TaskStatus[] = [
  'backlog',
  'em_andamento',
  'revisao',
  'concluida',
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  em_andamento: 'Em andamento',
  revisao: 'Em revisão',
  concluida: 'Concluídas',
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  assinado: 'Assinado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pendente: 'Pendente',
  parcial: 'Parcial',
  pago: 'Pago',
  atrasado: 'Atrasado',
  cancelado: 'Cancelado',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  ensaio: 'Ensaio',
  casamento: 'Casamento',
  evento: 'Evento',
  corporativo: 'Corporativo',
  produto: 'Produto',
  retrato: 'Retrato',
  outro: 'Outro',
};

export const CURRENT_SCHEMA_VERSION = 1;