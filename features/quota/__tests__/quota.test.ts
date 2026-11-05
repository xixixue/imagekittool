import { describe, expect, it } from "vitest";
import { canReserve } from "../quota";

describe("canReserve", () => {
  it("allows when total fits within quota", () => {
    expect(canReserve(100, 50, 30, 200)).toBe(true);
  });

  it("allows when total exactly equals quota", () => {
    expect(canReserve(100, 50, 50, 200)).toBe(true);
  });

  it("rejects when total exceeds quota", () => {
    expect(canReserve(100, 50, 51, 200)).toBe(false);
  });

  it("rejects negative inputs", () => {
    expect(canReserve(-1, 0, 0, 100)).toBe(false);
    expect(canReserve(0, -1, 0, 100)).toBe(false);
    expect(canReserve(0, 0, -1, 100)).toBe(false);
    expect(canReserve(0, 0, 0, -1)).toBe(false);
  });

  it("treats zero required as allowed when under quota", () => {
    expect(canReserve(50, 0, 0, 100)).toBe(true);
  });

  it("rejects non-safe-integer totals", () => {
    expect(canReserve(Number.MAX_SAFE_INTEGER, 1, 1, Number.MAX_SAFE_INTEGER + 10)).toBe(false);
  });
});
