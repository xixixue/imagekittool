import { describe, it, expect } from "vitest";
import { buildFilterString } from "../adjust";

describe("buildFilterString", () => {
  it("emits normalized adjustments at 100", () => {
    expect(buildFilterString(100, 100, 100, "none")).toBe(
      "brightness(1) contrast(1) saturate(1)",
    );
  });

  it("scales adjustments as percentages of 100", () => {
    expect(buildFilterString(150, 80, 200, "none")).toBe(
      "brightness(1.5) contrast(0.8) saturate(2)",
    );
  });

  it("appends the grayscale preset", () => {
    expect(buildFilterString(100, 100, 100, "grayscale")).toBe(
      "brightness(1) contrast(1) saturate(1) grayscale(1)",
    );
  });

  it("appends the vintage preset tokens", () => {
    const s = buildFilterString(100, 100, 100, "vintage");
    expect(s).toContain("sepia(0.5)");
    expect(s).toContain("contrast(1.1)");
    expect(s).toContain("brightness(1.05)");
    expect(s).toContain("saturate(1.2)");
  });

  it("inverts with the invert preset", () => {
    expect(buildFilterString(100, 100, 100, "invert")).toContain("invert(1)");
  });
});
