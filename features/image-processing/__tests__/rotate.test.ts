import { describe, it, expect } from "vitest";
import { rotatedSize } from "../rotate";

describe("rotatedSize", () => {
  it("swaps dimensions for 90 and 270", () => {
    expect(rotatedSize(1000, 800, 90)).toEqual({ width: 800, height: 1000 });
    expect(rotatedSize(1000, 800, 270)).toEqual({ width: 800, height: 1000 });
  });

  it("keeps dimensions for 0 and 180", () => {
    expect(rotatedSize(1000, 800, 0)).toEqual({ width: 1000, height: 800 });
    expect(rotatedSize(1000, 800, 180)).toEqual({ width: 1000, height: 800 });
  });
});
