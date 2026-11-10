import { describe, expect, it } from "vitest";
import { computePageLayout } from "../build";
import type { ImageToPdfOptions } from "../build";

const opts = (over: Partial<ImageToPdfOptions> = {}): ImageToPdfOptions => ({
  pageSize: "a4",
  orientation: "auto",
  margin: "medium",
  ...over,
});

describe("computePageLayout", () => {
  it("uses a portrait A4 page for a portrait image on auto", () => {
    const l = computePageLayout(1000, 2000, opts());
    // A4 portrait = 595.28 × 841.89; medium margin = 36 → box 523.28 × 769.89.
    expect(l.pageW).toBeCloseTo(595.28, 2);
    expect(l.pageH).toBeCloseTo(841.89, 2);
    // Contain-fit: scale = min(523.28/1000, 769.89/2000) = min(0.523, 0.385) = 0.385.
    expect(l.drawW).toBeCloseTo(385, 0);
    expect(l.drawH).toBeCloseTo(769.89, 1);
    // Centered; height fills the box so y == margin.
    expect(l.y).toBeCloseTo(36, 1);
  });

  it("swaps to a landscape page for a landscape image on auto", () => {
    const l = computePageLayout(2000, 1000, opts());
    expect(l.pageW).toBeCloseTo(841.89, 2); // swapped
    expect(l.pageH).toBeCloseTo(595.28, 2);
    expect(l.drawW).toBeCloseTo(769.89, 1); // width fills the box
    expect(l.x).toBeCloseTo(36, 1); // x == margin
  });

  it("forces portrait orientation even for a landscape image", () => {
    const l = computePageLayout(2000, 1000, opts({ orientation: "portrait" }));
    expect(l.pageW).toBeCloseTo(595.28, 2); // not swapped
    expect(l.pageH).toBeCloseTo(841.89, 2);
  });

  it("uses Letter page size and no margins", () => {
    const l = computePageLayout(612, 792, opts({ pageSize: "letter", margin: "none" }));
    expect(l.pageW).toBe(612);
    expect(l.pageH).toBe(792);
    // No margin → image fills the page exactly (same aspect ratio).
    expect(l.drawW).toBeCloseTo(612, 1);
    expect(l.drawH).toBeCloseTo(792, 1);
    expect(l.x).toBeCloseTo(0, 1);
    expect(l.y).toBeCloseTo(0, 1);
  });

  it("contain-fits without distortion when aspect ratios differ", () => {
    // Wide image (4:1) on a portrait page: width is the constraint, height is small.
    const l = computePageLayout(4000, 1000, opts({ orientation: "portrait" }));
    const boxW = 595.28 - 72; // 523.28
    expect(l.drawW).toBeCloseTo(boxW, 1); // width fills the box
    // Aspect preserved: drawW / drawH == 4.
    expect(l.drawW / l.drawH).toBeCloseTo(4, 2);
  });
});
