import { describe, expect, it } from "vitest";
import { computeFit, type FitRect } from "../fit";

describe("computeFit — contain", () => {
  it("fits a square into a square (no letterbox)", () => {
    const r = computeFit(1000, 1000, 1080, 1080, "contain");
    expect(r).toEqual<FitRect>({ drawW: 1080, drawH: 1080, drawX: 0, drawY: 0 });
  });

  it("letterboxes a wide image into a square (horizontal bars)", () => {
    const r = computeFit(2000, 1000, 1080, 1080, "contain");
    // src wider → width fills, height = 1080/2 = 540, centered vertically.
    expect(r.drawW).toBe(1080);
    expect(r.drawH).toBeCloseTo(540);
    expect(r.drawX).toBe(0);
    expect(r.drawY).toBeCloseTo(270);
  });

  it("letterboxes a tall image into a square (vertical bars)", () => {
    const r = computeFit(1000, 2000, 1080, 1080, "contain");
    expect(r.drawH).toBe(1080);
    expect(r.drawW).toBeCloseTo(540);
    expect(r.drawY).toBe(0);
    expect(r.drawX).toBeCloseTo(270);
  });
});

describe("computeFit — cover", () => {
  it("covers a square with a square (exact fill)", () => {
    const r = computeFit(1000, 1000, 1080, 1080, "cover");
    expect(r).toEqual<FitRect>({ drawW: 1080, drawH: 1080, drawX: 0, drawY: 0 });
  });

  it("covers a square with a wide image (overflow left/right)", () => {
    const r = computeFit(2000, 1000, 1080, 1080, "cover");
    // height fills, width = 2160 → centered, x negative (cropped by canvas).
    expect(r.drawH).toBe(1080);
    expect(r.drawW).toBe(2160);
    expect(r.drawY).toBe(0);
    expect(r.drawX).toBe(-540);
  });

  it("covers a 9:16 target with a 1:2 image (overflow top/bottom)", () => {
    const r = computeFit(1000, 2000, 1080, 1920, "cover");
    // srcRatio 0.5 < targetRatio 0.5625 → width fills, height overflows.
    expect(r.drawW).toBe(1080);
    expect(r.drawH).toBe(2160);
    expect(r.drawX).toBe(0);
    expect(r.drawY).toBe(-120);
  });
});

describe("computeFit — aspect preservation", () => {
  it("contain preserves source aspect ratio", () => {
    const r = computeFit(4000, 1000, 1080, 1080, "contain");
    expect(r.drawW / r.drawH).toBeCloseTo(4);
  });
  it("cover preserves source aspect ratio", () => {
    const r = computeFit(4000, 1000, 1080, 1080, "cover");
    expect(r.drawW / r.drawH).toBeCloseTo(4);
  });
});
