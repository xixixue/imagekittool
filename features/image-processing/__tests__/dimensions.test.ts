import { describe, it, expect } from "vitest";
import {
  CROP_ASPECT_RATIOS,
  RESIZE_PRESETS,
  clampCropRect,
  computeResizeDimensions,
} from "../dimensions";

describe("computeResizeDimensions", () => {
  it("scales by percent", () => {
    expect(
      computeResizeDimensions({ srcWidth: 1000, srcHeight: 800, lockAspect: true, percent: 50 }),
    ).toEqual({
      width: 500,
      height: 400,
    });
  });

  it("derives height from width with aspect lock", () => {
    expect(
      computeResizeDimensions({
        srcWidth: 1000,
        srcHeight: 800,
        targetWidth: 200,
        lockAspect: true,
      }),
    ).toEqual({ width: 200, height: 160 });
  });

  it("derives width from height with aspect lock", () => {
    expect(
      computeResizeDimensions({
        srcWidth: 1000,
        srcHeight: 800,
        targetHeight: 160,
        lockAspect: true,
      }),
    ).toEqual({ width: 200, height: 160 });
  });

  it("contain-fits inside a box with aspect lock", () => {
    // 1000x800 into 200x200 box -> r = min(0.2, 0.25) = 0.2 -> 200x160
    expect(
      computeResizeDimensions({
        srcWidth: 1000,
        srcHeight: 800,
        targetWidth: 200,
        targetHeight: 200,
        lockAspect: true,
      }),
    ).toEqual({ width: 200, height: 160 });
  });

  it("uses exact dims when aspect lock is off", () => {
    expect(
      computeResizeDimensions({
        srcWidth: 1000,
        srcHeight: 800,
        targetWidth: 300,
        targetHeight: 300,
        lockAspect: false,
      }),
    ).toEqual({ width: 300, height: 300 });
  });

  it("returns identity when nothing is provided", () => {
    expect(computeResizeDimensions({ srcWidth: 1000, srcHeight: 800, lockAspect: true })).toEqual({
      width: 1000,
      height: 800,
    });
  });

  it("contain-fits a landscape image into a square preset", () => {
    // 1920x1080 into 500x500 -> r = min(500/1920, 500/1080) ~= 0.2604 -> 500x281
    const r = computeResizeDimensions({
      srcWidth: 1920,
      srcHeight: 1080,
      targetWidth: 500,
      targetHeight: 500,
      lockAspect: true,
    });
    expect(r.width).toBe(500);
    expect(r.height).toBe(281);
  });
});

describe("clampCropRect", () => {
  it("keeps a valid rect unchanged (rounded)", () => {
    expect(clampCropRect({ x: 10, y: 20, width: 100, height: 80 }, 1000, 800)).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 80,
    });
  });

  it("clamps to source bounds", () => {
    const r = clampCropRect({ x: -10, y: -10, width: 2000, height: 2000 }, 100, 100);
    expect(r.x).toBe(0);
    expect(r.y).toBe(0);
    expect(r.width).toBe(100);
    expect(r.height).toBe(100);
  });

  it("enforces a minimum size of 1px", () => {
    const r = clampCropRect({ x: 50, y: 50, width: 0, height: 0 }, 100, 100);
    expect(r.width).toBe(1);
    expect(r.height).toBe(1);
  });
});

describe("preset data", () => {
  it("exposes resize presets and crop aspect ratios", () => {
    expect(RESIZE_PRESETS.length).toBeGreaterThan(0);
    expect(CROP_ASPECT_RATIOS.map((a) => a.label)).toContain("1:1");
    expect(CROP_ASPECT_RATIOS.map((a) => a.label)).toContain("Free");
  });
});
