/**
 * Batch scheduler (SPEC V2 §5.4, Phase 3).
 *
 * Drives the pure batchReducer with a concurrency-limited worker pool. The
 * runner is injected so the engine stays DOM-free and testable.
 *
 * Guarantees (§5.4):
 * - Per-file isolation: a thrown/rejected runner only fails that one item;
 *   siblings continue.
 * - Concurrency cap (default 2, conservative) to avoid browser memory exhaustion.
 * - Cancel: aborting the signal stops dispatching new items and best-effort
 *   interrupts running ones (the runner should respect the signal). Remaining
 *   queued items are marked cancelled.
 */
import { batchReducer, type BatchItem } from "./state";

export interface RunBatchOptions<T, R> {
  /** Max items processed at once. Default 2 (§5.4 conservative). */
  concurrency?: number;
  /** Abort to cancel pending/running work. */
  signal?: AbortSignal;
  /** Called after every state change (for progress UI). */
  onUpdate?: (items: BatchItem<T, R>[]) => void;
}

/**
 * Process all `queued` items in `items` with the given runner. Returns the
 * final item states. Items already completed/failed/cancelled are untouched.
 */
export async function runBatch<T, R>(
  items: BatchItem<T, R>[],
  run: (item: BatchItem<T, R>, signal: AbortSignal) => Promise<R>,
  opts: RunBatchOptions<T, R> = {},
): Promise<BatchItem<T, R>[]> {
  const concurrency = Math.max(1, opts.concurrency ?? 2);
  const signal = opts.signal ?? new AbortController().signal;
  let state = [...items];

  const queuedIds = items.filter((it) => it.status === "queued").map((it) => it.id);
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (!signal.aborted) {
      const myIndex = nextIndex++;
      if (myIndex >= queuedIds.length) return;
      const id = queuedIds[myIndex];
      if (signal.aborted) return;

      state = batchReducer(state, { type: "start", id });
      opts.onUpdate?.(state);
      try {
        const current = state.find((it) => it.id === id);
        if (!current) continue;
        const result = await run(current, signal);
        state = batchReducer(state, { type: "success", id, result });
      } catch (e) {
        const aborted =
          signal.aborted || (e instanceof Error && e.name === "AbortError");
        state = batchReducer(
          state,
          aborted
            ? { type: "cancel", id }
            : { type: "fail", id, error: e instanceof Error ? e.message : String(e) },
        );
      }
      opts.onUpdate?.(state);
    }
  };

  const workerCount = Math.min(concurrency, queuedIds.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  // Anything still queued (not dispatched before abort) → cancelled.
  if (signal.aborted) {
    state = batchReducer(state, { type: "cancel-all" });
  }
  return state;
}

export interface BatchHandle<T, R> {
  /** Resolves to the final item states when the batch finishes or is cancelled. */
  done: Promise<BatchItem<T, R>[]>;
  /** Abort pending + running work (best-effort). */
  cancel: () => void;
}

/** Start a batch and return a handle for cancellation. */
export function startBatch<T, R>(
  items: BatchItem<T, R>[],
  run: (item: BatchItem<T, R>, signal: AbortSignal) => Promise<R>,
  opts: Omit<RunBatchOptions<T, R>, "signal"> = {},
): BatchHandle<T, R> {
  const controller = new AbortController();
  const done = runBatch(items, run, { ...opts, signal: controller.signal });
  return { done, cancel: () => controller.abort() };
}
