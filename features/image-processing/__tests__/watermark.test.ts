import { describe, it, expect } from "vitest";
import { anchorAlign, anchorBaseline, anchorOffset, tilePoints } from "../watermark";

describe("anchorAlign", () => {
  it("maps horizontal half to text align", () => {
    expect(anchorAlign("top-left")).toBe("left");
    expect(anchorAlign("middle-center")).toBe("center");
    expect(anchorAlign("bottom-right")).toBe("right");
  });
});

describe("anchorBaseline", () => {
  it("maps vertical half to baseline", () => {
    expect(anchorBaseline("top-left")).toBe("top");
    expect(anchorBaseline("middle-center")).toBe("middle");
    expect(anchorBaseline("bottom-right")).toBe("bottom");
  });
});

describe("anchorOffset", () => {
  it("places corners with margin and centers at the midpoint", () => {
    expect(anchorOffset("top-left", 1000, 800, 40)).toEqual({ x: 40, y: 40 });
    expect(anchorOffset("bottom-right", 1000, 800, 40)).toEqual({ x: 960, y: 760 });
    expect(anchorOffset("middle-center", 1000, 800, 40)).toEqual({ x: 500, y: 400 });
  });
});

describe("tilePoints", () => {
  it("covers the canvas and offsets alternate rows", () => {
    const pts = tilePoints(400, 200, 20, 100);
    // First point is the top-left margin corner.
    expect(pts[0]).toEqual({ x: 20, y: 20 });
    // Row 1 (y=120) is offset by half a step.
    const row1 = pts.filter((p) => p.y === 120);
    expect(row1[0].x).toBe(70);
    // Points stay within bounds.
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(20);
      expect(p.x).toBeLessThanOrEqual(380);
      expect(p.y).toBeGreaterThanOrEqual(20);
      expect(p.y).toBeLessThanOrEqual(180);
    }
  });

  it("enforces a minimum step", () => {
    const pts = tilePoints(100, 100, 5, 1);
    expect(pts.length).toBeLessThan(400);
  });
});
