/**
 * Batch Workspace state machine (SPEC V2 §5.4, Phase 3).
 *
 * A pure reducer over batch-item states. This is the testable core of the batch
 * engine: the scheduler (concurrency + cancellation) drives this reducer via
 * actions, so all state transitions are deterministic and unit-testable with no
 * DOM, no timers, no concurrency.
 *
 * Per-file isolation (§5.4): one item failing never affects another — the
 * reducer only ever mutates the single item addressed by an action.
 */

export type BatchItemStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface BatchItem<T = unknown, R = unknown> {
  /** Stable id (used as React key + action target). */
  id: string;
  /** The caller's input payload (File, bytes, etc.) — typed by the caller. */
  input: T;
  status: BatchItemStatus;
  /** Output on success (blob/url/bytes — caller-defined). */
  result?: R;
  /** Error message on failure. */
  error?: string;
  startedAt?: number;
  finishedAt?: number;
}

export type BatchAction<R = unknown> =
  | { type: "start"; id: string }
  | { type: "success"; id: string; result: R }
  | { type: "fail"; id: string; error: string }
  | { type: "cancel"; id: string }
  | { type: "cancel-all" };

/**
 * Reduce a list of batch items by one action. Returns a new list (immutable).
 * Transitions are guarded by the *current* status so stale/duplicate actions
 * are no-ops (e.g. a "success" arriving after "cancel" is ignored).
 */
export function batchReducer<T, R>(
  items: BatchItem<T, R>[],
  action: BatchAction<R>,
): BatchItem<T, R>[] {
  const now = Date.now();
  switch (action.type) {
    case "start":
      return mapOne(items, action.id, (it) =>
        it.status === "queued" ? { ...it, status: "processing", startedAt: now } : it,
      );
    case "success":
      return mapOne(items, action.id, (it) =>
        it.status === "processing"
          ? { ...it, status: "completed", result: action.result, finishedAt: now }
          : it,
      );
    case "fail":
      return mapOne(items, action.id, (it) =>
        it.status === "processing"
          ? { ...it, status: "failed", error: action.error, finishedAt: now }
          : it,
      );
    case "cancel":
      return mapOne(items, action.id, (it) =>
        isCancellable(it.status) ? { ...it, status: "cancelled", finishedAt: now } : it,
      );
    case "cancel-all":
      return items.map((it) =>
        isCancellable(it.status) ? { ...it, status: "cancelled", finishedAt: now } : it,
      );
    default:
      return items;
  }
}

function mapOne<T, R>(
  items: BatchItem<T, R>[],
  id: string,
  fn: (it: BatchItem<T, R>) => BatchItem<T, R>,
): BatchItem<T, R>[] {
  return items.map((it) => (it.id === id ? fn(it) : it));
}

function isCancellable(status: BatchItemStatus): boolean {
  return status === "queued" || status === "processing";
}

/** Count items by status — for progress UI + analytics. */
export function countsByStatus<T, R>(
  items: BatchItem<T, R>[],
): Record<BatchItemStatus, number> {
  const counts: Record<BatchItemStatus, number> = {
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  };
  for (const it of items) counts[it.status]++;
  return counts;
}

/** True when no item is still queued or processing (batch finished or idle). */
export function isBatchDone<T, R>(items: BatchItem<T, R>[]): boolean {
  return items.every((it) => it.status !== "queued" && it.status !== "processing");
}
