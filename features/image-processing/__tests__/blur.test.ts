import { describe, it, expect } from "vitest";
import { clampRegions } from "../blur";

describe("clampRegions", () => {
  it("keeps valid regions unchanged", () => {
    expect(clampRegions([{ x: 10, y: 10, width: 100, height: 80 }], 1000, 800)).toEqual([
      { x: 10, y: 10, width: 100, height: 80 },
    ]);
  });

  it("clamps out-of-bounds regions to the image", () => {
    const r = clampRegions([{ x: -10, y: -10, width: 2000, height: 2000 }], 100, 100)[0];
    expect(r).toEqual({ x: 0, y: 0, width: 100, height: 100 });
  });

  it("enforces a 1px minimum size", () => {
    const r = clampRegions([{ x: 50, y: 50, width: 0, height: 0 }], 100, 100)[0];
    expect(r.width).toBe(1);
    expect(r.height).toBe(1);
  });

  it("returns an empty list unchanged", () => {
    expect(clampRegions([], 100, 100)).toEqual([]);
  });
});
