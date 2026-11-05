import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimitStore } from "@/lib/auth/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimitStore());

  it("allows up to the limit within a window then blocks", () => {
    expect(rateLimit("k", 3, 1000, 0).ok).toBe(true);
    expect(rateLimit("k", 3, 1000, 0).ok).toBe(true);
    expect(rateLimit("k", 3, 1000, 0).ok).toBe(true);
    const blocked = rateLimit("k", 3, 1000, 0);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after the window elapses", () => {
    rateLimit("k", 2, 1000, 0);
    rateLimit("k", 2, 1000, 0);
    expect(rateLimit("k", 2, 1000, 0).ok).toBe(false);
    // window started at 0 with 1000ms → resetAt = 1000; t=1001 is a fresh window
    expect(rateLimit("k", 2, 1000, 1001).ok).toBe(true);
  });

  it("tracks keys independently", () => {
    rateLimit("a", 1, 1000, 0);
    expect(rateLimit("a", 1, 1000, 0).ok).toBe(false);
    expect(rateLimit("b", 1, 1000, 0).ok).toBe(true);
  });

  it("reports a decreasing remaining count", () => {
    expect(rateLimit("k", 5, 1000, 0).remaining).toBe(4);
    expect(rateLimit("k", 5, 1000, 0).remaining).toBe(3);
  });
});
