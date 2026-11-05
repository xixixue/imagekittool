import { describe, it, expect } from "vitest";
import {
  LIMITS,
  formatBytes,
  formatPixels,
  validateBatchCount,
  validateFileSize,
  validatePixels,
} from "../limits";

describe("validateFileSize", () => {
  it("accepts bytes within the limit", () => {
    expect(validateFileSize(1024).ok).toBe(true);
  });
  it("rejects zero or negative", () => {
    expect(validateFileSize(0).ok).toBe(false);
    expect(validateFileSize(-1).ok).toBe(false);
  });
  it("rejects over the limit", () => {
    expect(validateFileSize(LIMITS.maxFileSizeBytes + 1).ok).toBe(false);
  });
});

describe("validateBatchCount", () => {
  it("accepts a valid count", () => {
    expect(validateBatchCount(5).ok).toBe(true);
    expect(validateBatchCount(LIMITS.maxBatchFiles).ok).toBe(true);
  });
  it("rejects zero", () => {
    expect(validateBatchCount(0).ok).toBe(false);
  });
  it("rejects over the limit", () => {
    expect(validateBatchCount(LIMITS.maxBatchFiles + 1).ok).toBe(false);
  });
});

describe("validatePixels", () => {
  it("accepts within the pixel limit", () => {
    expect(validatePixels(4000, 3000).ok).toBe(true);
  });
  it("rejects over the pixel limit", () => {
    expect(validatePixels(7000, 7000).ok).toBe(false);
  });
  it("rejects invalid dimensions", () => {
    expect(validatePixels(0, 100).ok).toBe(false);
  });
});

describe("formatBytes", () => {
  it("formats human-readable sizes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(245_678)).toBe("240 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
  });
});

describe("formatPixels", () => {
  it("formats megapixels", () => {
    expect(formatPixels(12_000_000)).toBe("12.0 MP");
  });
  it("formats thousands", () => {
    expect(formatPixels(4000)).toBe("4 K");
  });
});
