import { describe, it, expect } from "vitest";
import { validateImageMetadata } from "../validate";

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
const UNKNOWN = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b];

function u8(arr: number[]): Uint8Array {
  return new Uint8Array(arr);
}

describe("validateImageMetadata", () => {
  it("accepts a well-formed JPEG with matching declared type", () => {
    const r = validateImageMetadata(1024, u8(JPEG), "image/jpeg", "jpeg");
    expect(r.ok).toBe(true);
    expect(r.format).toBe("jpeg");
  });

  it("accepts a well-formed PNG", () => {
    const r = validateImageMetadata(2048, u8(PNG), "image/png", "png");
    expect(r.ok).toBe(true);
    expect(r.format).toBe("png");
  });

  it("rejects a disguised file (jpeg content declared as png)", () => {
    const r = validateImageMetadata(1024, u8(JPEG), "image/png", "png");
    expect(r.ok).toBe(false);
  });

  it("rejects when extension disagrees with content", () => {
    const r = validateImageMetadata(1024, u8(JPEG), "image/jpeg", "png");
    expect(r.ok).toBe(false);
  });

  it("rejects unknown content", () => {
    const r = validateImageMetadata(1024, u8(UNKNOWN), undefined, null);
    expect(r.ok).toBe(false);
  });

  it("rejects a file that exceeds the size limit", () => {
    const over = 26 * 1024 * 1024;
    const r = validateImageMetadata(over, u8(JPEG), "image/jpeg", "jpeg");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/exceeds/i);
  });

  it("rejects an empty file", () => {
    const r = validateImageMetadata(0, u8(JPEG), "image/jpeg", "jpeg");
    expect(r.ok).toBe(false);
  });
});
