// PhotoMax — Storage layer (typed wrapper around localStorage)
import { canWrite, safeJsonParse, storageBytes, MAX_STORAGE, validateAppData } from './security';
import type { AppData } from '@/types';
import { CURRENT_SCHEMA_VERSION } from '@/types';

const KEY = 'photomax:v1';

export function loadData(): AppData | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  const parsed = safeJsonParse<unknown>(raw, null);
  if (!parsed || typeof parsed !== 'object') return null;
  const result = validateAppData(parsed);
  return result.ok ? result.data : null;
}

export function saveData(data: AppData): { ok: true } | { ok: false; reason: string } {
  if (typeof window === 'undefined') return { ok: false, reason: 'no-window' };
  if (!canWrite()) return { ok: false, reason: 'rate-limited' };
  try {
    const json = JSON.stringify({ ...data, schemaVersion: CURRENT_SCHEMA_VERSION });
    const bytes = storageBytes(json);
    if (bytes > MAX_STORAGE) {
      return { ok: false, reason: 'storage-full' };
    }
    window.localStorage.setItem(KEY, json);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return { ok: false, reason: msg };
  }
}

export function clearData(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}

export function exportData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importData(text: string): AppData | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: 'JSON inválido.' };
  }
  const result = validateAppData(parsed);
  if (!result.ok) return { error: result.error };
  return result.data;
}