import type { HistoryEntry, HistoryInput } from "./types";

/**
 * Browser-local processing history (SPEC V2 §12). Stored in localStorage so it
 * survives reloads but is lost when the user clears browser data (the UI notes
 * this). All functions are SSR-safe (no-op/return-empty when window is absent).
 */

const KEY = "ikt:processing-history";
export const LOCAL_HISTORY_LIMIT = 50;

function guardedWindow(): Window | null {
  return typeof window !== "undefined" ? window : null;
}

function makeLocalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

/** Read all local history entries (newest first). Returns [] on SSR/error. */
export function loadLocalHistory(): HistoryEntry[] {
  const w = guardedWindow();
  if (!w) return [];
  try {
    const raw = w.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function persist(entries: HistoryEntry[]): void {
  const w = guardedWindow();
  if (!w) return;
  try {
    w.localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Quota exceeded or storage disabled — history is best-effort; silently drop.
  }
}

/**
 * Prepend a new entry built from a history payload, cap at LOCAL_HISTORY_LIMIT,
 * and return the stored entry (or null when not in a browser).
 */
export function addLocalHistory(input: HistoryInput): HistoryEntry | null {
  const w = guardedWindow();
  if (!w) return null;
  const entry: HistoryEntry = {
    id: makeLocalId(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  const next = [entry, ...loadLocalHistory()].slice(0, LOCAL_HISTORY_LIMIT);
  persist(next);
  return entry;
}

/** Remove one local entry by id. */
export function removeLocalHistory(id: string): void {
  persist(loadLocalHistory().filter((e) => e.id !== id));
}

/** Clear all local history. */
export function clearLocalHistory(): void {
  const w = guardedWindow();
  if (!w) return;
  try {
    w.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
