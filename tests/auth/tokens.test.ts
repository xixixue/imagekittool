import { describe, expect, it } from "vitest";
import { generateSessionToken, generateToken, hashToken } from "@/lib/auth/tokens";

describe("tokens", () => {
  it("generateSessionToken returns a non-empty URL-safe string", () => {
    const t = generateSessionToken();
    expect(t.length).toBeGreaterThan(20);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generateToken returns a non-empty URL-safe string", () => {
    const t = generateToken();
    expect(t.length).toBeGreaterThan(20);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("hashToken is deterministic and returns 64 hex chars", () => {
    const h1 = hashToken("abc");
    const h2 = hashToken("abc");
    expect(h1).toBe(h2);
    expect(h1).toHaveLength(64);
    expect(h1).toMatch(/^[0-9a-f]+$/);
  });

  it("hashToken differs for different inputs", () => {
    expect(hashToken("a")).not.toBe(hashToken("b"));
  });

  it("generated tokens are unique across many calls", () => {
    const set = new Set(Array.from({ length: 20 }, () => generateToken()));
    expect(set.size).toBe(20);
  });
});
