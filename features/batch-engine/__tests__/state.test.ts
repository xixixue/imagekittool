import { describe, expect, it } from "vitest";
import {
  batchReducer,
  countsByStatus,
  isBatchDone,
  type BatchItem,
} from "../state";

function item(id: string, status: BatchItem["status"] = "queued"): BatchItem {
  return { id, input: null, status };
}

const TWO = [item("a"), item("b")];

describe("batchReducer", () => {
  it("starts a queued item → processing", () => {
    const next = batchReducer(TWO, { type: "start", id: "a" });
    expect(next[0].status).toBe("processing");
    expect(next[1].status).toBe("queued");
  });

  it("marks success → completed with result", () => {
    const started = batchReducer(TWO, { type: "start", id: "a" });
    const next = batchReducer(started, { type: "success", id: "a", result: "out" });
    expect(next[0]).toMatchObject({ status: "completed", result: "out" });
  });

  it("marks failure → failed with error, sibling untouched", () => {
    const started = batchReducer(TWO, { type: "start", id: "a" });
    const next = batchReducer(started, { type: "fail", id: "a", error: "boom" });
    expect(next[0]).toMatchObject({ status: "failed", error: "boom" });
    expect(next[1].status).toBe("queued"); // isolation: sibling unaffected
  });

  it("cancels a queued item", () => {
    const next = batchReducer(TWO, { type: "cancel", id: "b" });
    expect(next[1].status).toBe("cancelled");
    expect(next[0].status).toBe("queued");
  });

  it("cancel-all cancels queued + processing but leaves completed/failed", () => {
    const state: BatchItem[] = [
      item("a", "queued"),
      item("b", "processing"),
      item("c", "completed"),
      item("d", "failed"),
    ];
    const next = batchReducer(state, { type: "cancel-all" });
    expect(next.map((i) => i.status)).toEqual([
      "cancelled",
      "cancelled",
      "completed",
      "failed",
    ]);
  });

  it("ignores stale actions (success after cancel)", () => {
    const cancelled = batchReducer(TWO, { type: "cancel", id: "a" });
    const next = batchReducer(cancelled, { type: "success", id: "a", result: "x" });
    expect(next[0].status).toBe("cancelled"); // cancel wins; success ignored
    expect(next[0].result).toBeUndefined();
  });

  it("start on a non-queued item is a no-op", () => {
    const completed = batchReducer(
      [item("a", "completed")],
      { type: "start", id: "a" },
    );
    expect(completed[0].status).toBe("completed");
  });
});

describe("countsByStatus + isBatchDone", () => {
  it("counts each status", () => {
    const state: BatchItem[] = [
      item("a", "queued"),
      item("b", "processing"),
      item("c", "completed"),
      item("d", "failed"),
      item("e", "cancelled"),
    ];
    expect(countsByStatus(state)).toEqual({
      queued: 1,
      processing: 1,
      completed: 1,
      failed: 1,
      cancelled: 1,
    });
  });

  it("isBatchDone is false while any item is queued/processing", () => {
    expect(isBatchDone([item("a", "completed"), item("b", "queued")])).toBe(false);
    expect(isBatchDone([item("a", "completed"), item("b", "failed")])).toBe(true);
    expect(isBatchDone([])).toBe(true);
  });
});
