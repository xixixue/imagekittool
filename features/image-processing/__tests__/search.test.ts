import { describe, it, expect } from "vitest";
import { findQualityForTargetSize } from "../search";

/**
 * Mock encoder: bytes increase with quality (lower quality => smaller bytes),
 * matching the monotonic assumption the search relies on.
 * bytes(q) = round(100000 * (0.1 + 0.9*q))
 *   q=0.05 -> 14500, q=0.444 -> ~50000, q=0.95 -> 95500
 */
function mockEncode(quality: number): Promise<{ bytes: number }> {
  const bytes = Math.round(100_000 * (0.1 + 0.9 * quality));
  return Promise.resolve({ bytes });
}

describe("findQualityForTargetSize", () => {
  it("finds the highest quality at or under the target", async () => {
    const r = await findQualityForTargetSize(mockEncode, { targetBytes: 50_000 });
    expect(r.met).toBe(true);
    expect(r.bytes).toBeLessThanOrEqual(50_000);
    expect(r.quality).toBeGreaterThan(0.3);
    expect(r.quality).toBeLessThanOrEqual(0.5);
    expect(r.iterations).toBeGreaterThanOrEqual(1);
  });

  it("reports met=true when the target is above the largest possible size", async () => {
    const r = await findQualityForTargetSize(mockEncode, { targetBytes: 200_000 });
    expect(r.met).toBe(true);
    expect(r.quality).toBeGreaterThanOrEqual(0.9);
  });

  it("reports met=false and returns the closest result when the target is unreachable", async () => {
    // Even the smallest encode (q=0.05 -> 14500) exceeds 1000.
    const r = await findQualityForTargetSize(mockEncode, { targetBytes: 1000 });
    expect(r.met).toBe(false);
    expect(r.bytes).toBeLessThanOrEqual(16_000); // close to the minimum
    expect(r.quality).toBeLessThan(0.15);
  });

  it("respects the iteration cap", async () => {
    const r = await findQualityForTargetSize(mockEncode, {
      targetBytes: 50_000,
      maxIterations: 2,
    });
    expect(r.iterations).toBeLessThanOrEqual(2);
  });

  it("respects the time budget", async () => {
    const slowEncode = async (q: number) => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return mockEncode(q);
    };
    const r = await findQualityForTargetSize(slowEncode, {
      targetBytes: 50_000,
      maxIterations: 50,
      timeBudgetMs: 60,
    });
    // Should stop well before the iteration cap due to the time budget.
    expect(r.iterations).toBeLessThan(50);
  });

  it("never exceeds maxIterations even with a large budget", async () => {
    const r = await findQualityForTargetSize(mockEncode, {
      targetBytes: 50_000,
      maxIterations: 5,
      timeBudgetMs: 10_000,
    });
    expect(r.iterations).toBeLessThanOrEqual(5);
  });
});
