import { describe, it, expect } from "vitest";
import {
  buildOutputFilename,
  detectFormat,
  extToFormat,
  formatToExt,
  formatToMime,
  mimeToFormat,
} from "../format";

function bytes(arr: number[]): Uint8Array {
  return new Uint8Array(arr);
}

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d];
const WEBP = [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];
const UNKNOWN = [0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b];

describe("detectFormat (magic bytes)", () => {
  it("detects JPEG", () => {
    expect(detectFormat(bytes(JPEG))).toBe("jpeg");
  });
  it("detects PNG", () => {
    expect(detectFormat(bytes(PNG))).toBe("png");
  });
  it("detects WebP", () => {
    expect(detectFormat(bytes(WEBP))).toBe("webp");
  });
  it("returns null for unknown content", () => {
    expect(detectFormat(bytes(UNKNOWN))).toBeNull();
  });
  it("returns null for too-short input", () => {
    expect(detectFormat(bytes([0xff, 0xd8]))).toBeNull();
  });
});

describe("mime/format/ext mapping", () => {
  it("maps formats to mime and back", () => {
    expect(formatToMime("jpeg")).toBe("image/jpeg");
    expect(formatToMime("png")).toBe("image/png");
    expect(formatToMime("webp")).toBe("image/webp");
    expect(mimeToFormat("image/jpeg")).toBe("jpeg");
    expect(mimeToFormat("image/jpg")).toBe("jpeg");
    expect(mimeToFormat("image/png")).toBe("png");
    expect(mimeToFormat("image/webp")).toBe("webp");
    expect(mimeToFormat("image/gif")).toBeNull();
    expect(mimeToFormat(undefined)).toBeNull();
  });

  it("maps extensions to formats", () => {
    expect(extToFormat("photo.jpg")).toBe("jpeg");
    expect(extToFormat("photo.JPEG")).toBe("jpeg");
    expect(extToFormat("a.b.png")).toBe("png");
    expect(extToFormat("x.webp")).toBe("webp");
    expect(extToFormat("noext")).toBeNull();
    expect(extToFormat(null)).toBeNull();
  });

  it("maps formats to extensions", () => {
    expect(formatToExt("jpeg")).toBe("jpg");
    expect(formatToExt("png")).toBe("png");
    expect(formatToExt("webp")).toBe("webp");
  });
});

describe("buildOutputFilename", () => {
  it("replaces the extension to match the real format", () => {
    expect(buildOutputFilename("photo.png", "jpeg")).toBe("photo.jpg");
    expect(buildOutputFilename("IMG_2024.jpg", "png")).toBe("IMG_2024.png");
    expect(buildOutputFilename("a/b\\c:d*.webp", "jpeg")).toBe("a_b_c_d_.jpg");
  });

  it("handles names without an extension", () => {
    expect(buildOutputFilename("image", "webp")).toBe("image.webp");
  });

  it("keeps the basename within a sane length", () => {
    const long = "x".repeat(300);
    const out = buildOutputFilename(`${long}.png`, "jpeg");
    expect(out.endsWith(".jpg")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(124);
  });
});
