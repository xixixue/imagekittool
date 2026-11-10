import { describe, expect, it } from "vitest";
import { runBatch, startBatch } from "../scheduler";
import type { BatchItem } from "../state";

function queued(ids: string[]): BatchItem[] {
  return ids.map((id) => ({ id, input: id, status: "queued" as const }));
}

describe("runBatch", () => {
  it("processes all items and respects the concurrency cap", async () => {
    const ids = ["a", "b", "c", "d", "e"];
    let active = 0;
    let maxActive = 0;
    const run = async (item: BatchItem) => {
      active++;
      maxActive = Math.max(maxActive, active);
      // yield a few microtasks so the worker pool can race
      await Promise.resolve();
      await Promise.resolve();
      active--;
      return `out:${item.id}`;
    };
    const result = await runBatch(queued(ids), run, { concurrency: 2 });
    expect(maxActive).toBeLessThanOrEqual(2);
    expect(result.every((it) => it.status === "completed")).toBe(true);
    expect(result.map((it) => it.result)).toEqual(
      ids.map((id) => `out:${id}`),
    );
  });

  it("isolates failures: one throw fails only that item", async () => {
    const run = async (item: BatchItem) => {
      if (item.id === "b") throw new Error("nope");
      await Promise.resolve();
      return `ok:${item.id}`;
    };
    const result = await runBatch(queued(["a", "b", "c"]), run, {
      concurrency: 3,
    });
    const byId = Object.fromEntries(result.map((it) => [it.id, it]));
    expect(byId.a.status).toBe("completed");
    expect(byId.b).toMatchObject({ status: "failed", error: "nope" });
    expect(byId.c.status).toBe("completed");
  });

  it("leaves already-completed items untouched", async () => {
    const items: BatchItem[] = [
      { id: "a", input: "a", status: "completed", result: "done" },
      { id: "b", input: "b", status: "queued" },
    ];
    const run = async (item: BatchItem) => `ok:${item.id}`;
    const result = await runBatch(items, run, { concurrency: 1 });
    expect(result[0]).toMatchObject({ status: "completed", result: "done" });
    expect(result[1]).toMatchObject({ status: "completed", result: "ok:b" });
  });

  it("cancel marks remaining queued items as cancelled", async () => {
    // Runner that blocks until aborted (respects the signal).
    const run = async (_item: BatchItem, signal: AbortSignal) =>
      new Promise<string>((_resolve, reject) => {
        if (signal.aborted) return reject(abortError());
        signal.addEventListener("abort", () => reject(abortError()));
      });
    const handle = startBatch(queued(["a", "b", "c"]), run, { concurrency: 1 });
    // Let the first worker pick up item "a".
    await new Promise((r) => setTimeout(r, 5));
    handle.cancel();
    const result = await handle.done;
    expect(result.every((it) => it.status === "cancelled")).toBe(true);
  });
});

function abortError(): Error {
  const e = new Error("aborted");
  e.name = "AbortError";
  return e;
}
