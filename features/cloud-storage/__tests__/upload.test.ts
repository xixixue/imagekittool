import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES } from "@/lib/config/quota";
import { validateUploadInput } from "../upload";
import { isExpired } from "../cleanup";

describe("validateUploadInput", () => {
  const ok = {
    fileName: "photo.webp",
    mimeType: "image/webp",
    sizeBytes: 1000,
    category: "PROCESSED",
  };

  it("accepts a valid webp processed file", () => {
    const r = validateUploadInput(ok);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.extension).toBe("webp");
  });

  it("derives jpg extension from jpeg mime when filename lacks one", () => {
    const r = validateUploadInput({ ...ok, fileName: "photo", mimeType: "image/jpeg" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.extension).toBe("jpg");
  });

  it("keeps the filename extension when valid even if it differs from mime", () => {
    const r = validateUploadInput({
      fileName: "image.JPG",
      mimeType: "image/jpeg",
      sizeBytes: 5,
      category: "ORIGINAL",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.extension).toBe("jpg");
  });

  it("rejects oversized files", () => {
    const r = validateUploadInput({ ...ok, sizeBytes: MAX_UPLOAD_BYTES + 1 });
    expect(r.ok).toBe(false);
  });

  it("rejects non-image mime types", () => {
    const r = validateUploadInput({ ...ok, mimeType: "application/pdf" });
    expect(r.ok).toBe(false);
  });

  it("rejects invalid category", () => {
    const r = validateUploadInput({ ...ok, category: "WEIRD" });
    expect(r.ok).toBe(false);
  });

  it("rejects zero/negative size", () => {
    expect(validateUploadInput({ ...ok, sizeBytes: 0 }).ok).toBe(false);
    expect(validateUploadInput({ ...ok, sizeBytes: -5 }).ok).toBe(false);
  });

  it("rejects empty fileName", () => {
    expect(validateUploadInput({ ...ok, fileName: "" }).ok).toBe(false);
  });
});

describe("isExpired", () => {
  it("returns true when expiry is in the past", () => {
    expect(isExpired(1000, 2000)).toBe(true);
  });
  it("returns true at the exact expiry moment", () => {
    expect(isExpired(1000, 1000)).toBe(true);
  });
  it("returns false when expiry is in the future", () => {
    expect(isExpired(2000, 1000)).toBe(false);
  });
});
