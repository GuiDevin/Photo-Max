// PhotoMax — Security utilities
// - DOMPurify-free input sanitization (we never insert raw HTML; React JSX escapes by default).
// - Storage integrity: versioned schema + JSON.parse guard + size cap + write rate limit.
// - ID generation: collision-resistant, URL-safe.
// - Number parsing: bounded, no NaN leaks.
// - Email / phone normalization.

const MAX_STORAGE_BYTES = 4 * 1024 * 1024; // 4 MB hard cap per localStorage key
const MAX_TEXT = 500;
const MAX_MULTILINE = 4000;
const MAX_TAG = 32;
const MAX_TAGS = 16;
const MAX_PHONE = 32;
const MAX_EMAIL = 254;
const MAX_URL = 2048;
const MAX_ID_COMPACT = 16;
const MAX_PRICE_CENTS = 100_000_000; // R$ 1.000.000

/**
 * Generate a short, URL-safe, collision-resistant ID.
 * Uses crypto.randomUUID when available (modern browsers), falls back to a
 * CSPRNG fallback built on getRandomValues + base36 timestamp.
 */
export function newId(prefix = ''): string {
  let core: string;
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      core = crypto.randomUUID().replace(/-/g, '').slice(0, MAX_ID_COMPACT);
    } else {
      const buf = new Uint8Array(16);
      crypto.getRandomValues(buf);
      core = Array.from(buf, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, MAX_ID_COMPACT);
    }
  } catch {
    core = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
  const ts = Date.now().toString(36);
  return `${prefix}${ts}${core}`;
}

/** Strip control chars; collapse inner whitespace; safe for any text field. */
export function sanitizeText(input: unknown, maxLength = MAX_TEXT): string {
  if (typeof input !== 'string') return '';
  const cleaned = input
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, maxLength);
}

/** Richer text — preserves newlines, used for descriptions/notes. */
export function sanitizeMultiline(input: unknown, maxLength = MAX_MULTILINE): string {
  if (typeof input !== 'string') return '';
  const cleaned = input
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '')
    .trim();
  return cleaned.slice(0, maxLength);
}

/** Sanitize a URL — only http(s) and mailto allowed. Returns '' if invalid. */
export function sanitizeUrl(input: unknown): string {
  if (typeof input !== 'string') return '';
  try {
    const u = new URL(input);
    if (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:') {
      return u.toString().slice(0, MAX_URL);
    }
    return '';
  } catch {
    return '';
  }
}

/** Sanitize email — basic RFC 5322-ish check; lowercased. */
export function sanitizeEmail(input: unknown): string {
  if (typeof input !== 'string') return '';
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length > MAX_EMAIL) return '';
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
  return ok ? trimmed : '';
}

/** Sanitize phone — keeps digits, spaces, + ( ) - . */
export function sanitizePhone(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^\d+\s().-]/g, '').trim().slice(0, MAX_PHONE);
}

/** Parse a number from user input — falls back to 0. Bound check optional. */
export function toSafeNumber(
  input: unknown,
  fallback = 0,
  opts: { min?: number; max?: number } = {}
): number {
  let n = typeof input === 'number' ? input : Number(input);
  if (!Number.isFinite(n)) n = fallback;
  if (typeof opts.min === 'number' && n < opts.min) n = opts.min;
  if (typeof opts.max === 'number' && n > opts.max) n = opts.max;
  return n;
}

/** Parse an integer safely. */
export function toSafeInt(
  input: unknown,
  fallback = 0,
  opts: { min?: number; max?: number } = {}
): number {
  const n = toSafeNumber(input, fallback, opts);
  return Math.trunc(n);
}

/** Sanitize an array of tags — dedupe, lowercase, alphanumeric+dash, max 16 tags. */
export function sanitizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of input) {
    if (typeof t !== 'string') continue;
    const tag = t
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, MAX_TAG);
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      out.push(tag);
      if (out.length >= MAX_TAGS) break;
    }
  }
  return out;
}

/** Generate a human-friendly contract code, e.g. CT-2026-0007 */
export function newContractCode(year: number, sequence: number): string {
  const seq = String(sequence).padStart(4, '0');
  return `CT-${year}-${seq}`;
}

/** Throttle helper for search/save bursts. */
export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let h: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (h) clearTimeout(h);
    h = setTimeout(() => fn(...args), ms);
  }) as T;
}

/**
 * Try to safely JSON.parse a value coming from storage. Returns fallback on any failure.
 * Never throws to caller.
 */
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (raw == null || raw === '') return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Validate storage byte usage to prevent QuotaExceededError crash loops.
 * Returns byte length of the given string (UTF-16 in localStorage).
 */
export function storageBytes(str: string): number {
  return str.length * 2;
}

export const MAX_STORAGE = MAX_STORAGE_BYTES;

// ── Rate-limited persistence ───────────────────────────
// Prevents malicious or runaway code from spamming writes (denial-of-storage).

interface RateState {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 1000; // 1s sliding window
const MAX_WRITES_PER_WINDOW = 8;
const storageRate: RateState = { count: 0, windowStart: Date.now() };

/**
 * Returns true if a write is allowed under the current rate limit.
 * Use this *before* calling localStorage.setItem so we can throttle.
 */
export function canWrite(): boolean {
  const now = Date.now();
  if (now - storageRate.windowStart >= WINDOW_MS) {
    storageRate.windowStart = now;
    storageRate.count = 0;
  }
  if (storageRate.count >= MAX_WRITES_PER_WINDOW) return false;
  storageRate.count++;
  return true;
}

// ── Schema validation ───────────────────────────────────
// Lightweight runtime validation for untrusted JSON. We don't depend on a
// runtime type lib — we check the shape of the AppData object defensively.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isISODate(v: unknown): v is string {
  return typeof v === 'string' && !Number.isNaN(new Date(v).getTime());
}

export function validateAppData(input: unknown):
  | { ok: true; data: import('@/types').AppData }
  | { ok: false; error: string } {
  if (!isObject(input)) return { ok: false, error: 'Raiz inválida (não é objeto).' };

  const required: (keyof import('@/types').AppData)[] = [
    'services',
    'clients',
    'contracts',
    'tasks',
    'expenses',
    'settings',
  ];
  for (const k of required) {
    if (!(k in input)) return { ok: false, error: `Campo obrigatório ausente: ${String(k)}` };
  }

  // services
  if (!Array.isArray(input.services)) return { ok: false, error: 'services deve ser array' };
  for (const s of input.services) {
    if (!isObject(s)) return { ok: false, error: 'service inválido' };
    if (typeof s.id !== 'string' || typeof s.name !== 'string') {
      return { ok: false, error: 'service.id/name inválidos' };
    }
    if (typeof s.price !== 'number' || s.price < 0 || s.price > MAX_PRICE_CENTS) {
      return { ok: false, error: 'service.price fora do range' };
    }
    if (!isISODate(s.createdAt) || !isISODate(s.updatedAt)) {
      return { ok: false, error: 'service.createdAt/updatedAt inválidos' };
    }
  }

  // contracts — quick shape check
  if (!Array.isArray(input.contracts)) return { ok: false, error: 'contracts deve ser array' };
  for (const c of input.contracts) {
    if (!isObject(c)) return { ok: false, error: 'contract inválido' };
    if (typeof c.id !== 'string' || typeof c.title !== 'string' || typeof c.code !== 'string') {
      return { ok: false, error: 'contract.id/title/codigo inválidos' };
    }
    if (typeof c.totalValue !== 'number' || c.totalValue < 0 || c.totalValue > MAX_PRICE_CENTS) {
      return { ok: false, error: 'contract.totalValue fora do range' };
    }
    if (!isISODate(c.startDate) || !isISODate(c.endDate) || !isISODate(c.createdAt) || !isISODate(c.updatedAt)) {
      return { ok: false, error: 'contract datas inválidas' };
    }
    if (!Array.isArray(c.payments)) return { ok: false, error: 'contract.payments deve ser array' };
    for (const p of c.payments) {
      if (!isObject(p)) return { ok: false, error: 'payment inválido' };
      if (typeof p.amount !== 'number' || p.amount < 0 || p.amount > MAX_PRICE_CENTS) {
        return { ok: false, error: 'payment.amount fora do range' };
      }
      if (!isISODate(p.dueDate)) return { ok: false, error: 'payment.dueDate inválido' };
    }
  }

  return { ok: true, data: input as unknown as import('@/types').AppData };
}