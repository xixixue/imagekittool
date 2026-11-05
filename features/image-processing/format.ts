import type { ImageFormat } from "./types";

export const FORMAT_MIME: Record<ImageFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const FORMAT_EXT: Record<ImageFormat, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
};

const MIME_TO_FORMAT: Record<string, ImageFormat> = {
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};

const EXT_TO_FORMAT: Record<string, ImageFormat> = {
  jpg: "jpeg",
  jpeg: "jpeg",
  png: "png",
  webp: "webp",
};

export const SUPPORTED_FORMATS: ImageFormat[] = ["jpeg", "png", "webp"];

export function formatToMime(format: ImageFormat): string {
  return FORMAT_MIME[format];
}

export function formatToExt(format: ImageFormat): string {
  return FORMAT_EXT[format];
}

export function mimeToFormat(mime: string | undefined | null): ImageFormat | null {
  if (!mime) return null;
  const normalized = mime.toLowerCase().split(";")[0]?.trim() ?? "";
  return MIME_TO_FORMAT[normalized] ?? null;
}

export function extToFormat(filename: string | undefined | null): ImageFormat | null {
  if (!filename) return null;
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  return EXT_TO_FORMAT[ext] ?? null;
}

/**
 * Detect image format from the first bytes (magic numbers).
 * Returns null for unknown or unsupported formats so disguised files are rejected.
 */
export function detectFormat(bytes: Uint8Array): ImageFormat | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

/**
 * Build an output filename whose extension matches the real output format.
 * The original extension is stripped and replaced with the correct one so the
 * extension always agrees with the actual MIME type.
 */
export function buildOutputFilename(originalName: string, format: ImageFormat): string {
  const base = (originalName.replace(/\.[^./\\]+$/, "") || "image").trim();
  const safe = base.replace(/[\\/:*?"<>|]/g, "_").slice(0, 120) || "image";
  return `${safe}.${formatToExt(format)}`;
}
