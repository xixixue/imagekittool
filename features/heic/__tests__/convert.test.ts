import { describe, expect, it } from "vitest";
import { qualityForFormat } from "../convert";

describe("qualityForFormat", () => {
  it("returns undefined for PNG (lossless)", () => {
    expect(qualityForFormat("png", 0.8)).toBeUndefined();
  });
  it("returns the quality for JPG", () => {
    expect(qualityForFormat("jpeg", 0.8)).toBe(0.8);
  });
  it("returns the quality for WebP", () => {
    expect(qualityForFormat("webp", 0.72)).toBe(0.72);
  });
});
