/**
 * Configurable safety limits for local image processing (SPEC §5).
 * All limits are conservative defaults and can be tuned after testing.
 */
export const LIMITS = {
  /** Single file max size: 25 MB. */
  maxFileSizeBytes: 25 * 1024 * 1024,
  /** Max files per batch: 20. */
  maxBatchFiles: 20,
  /** Max pixels per image: ~40 MP. */
  maxPixels: 40_000_000,
  /** Batch processing concurrency. */
  maxConcurrency: 3,
} as const;

export interface CheckResult {
  ok: boolean;
  error?: string;
  /** Stable i18n code for UI translation (English `error` kept as fallback). */
  code?: string;
  /** Parameters for the i18n message (e.g. { limit }, { pixels }). */
  params?: Record<string, string | number>;
}

export function validateFileSize(bytes: number, limit = LIMITS.maxFileSizeBytes): CheckResult {
  if (!Number.isFinite(bytes) || bytes <= 0)
    return { ok: false, error: "File is empty.", code: "fileEmpty" };
  if (bytes > limit)
    return {
      ok: false,
      error: `File exceeds the ${formatBytes(limit)} limit.`,
      code: "fileTooLarge",
      params: { limit: formatBytes(limit) },
    };
  return { ok: true };
}

export function validateBatchCount(count: number, limit = LIMITS.maxBatchFiles): CheckResult {
  if (count <= 0) return { ok: false, error: "No files selected.", code: "noFiles" };
  if (count > limit)
    return {
      ok: false,
      error: `You can process at most ${limit} files at once.`,
      code: "tooManyFiles",
      params: { limit },
    };
  return { ok: true };
}

export function validatePixels(
  width: number,
  height: number,
  limit = LIMITS.maxPixels,
): CheckResult {
  const px = width * height;
  if (!Number.isFinite(px) || px <= 0)
    return { ok: false, error: "Invalid image dimensions.", code: "invalidDimensions" };
  if (px > limit) {
    return {
      ok: false,
      error: `Image is too large (${formatPixels(px)}). Limit is ${formatPixels(limit)}.`,
      code: "imageTooLarge",
      params: { pixels: formatPixels(px), limit: formatPixels(limit) },
    };
  }
  return { ok: true };
}

/** Human-readable byte size, e.g. 245 KB. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  if (i === 0) return `${value.toFixed(0)} B`;
  const rounded = value >= 100 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, "");
  return `${rounded} ${units[i]}`;
}

/** Human-readable pixel count, e.g. 12.3 MP. */
export function formatPixels(pixels: number): string {
  if (pixels >= 1_000_000) return `${(pixels / 1_000_000).toFixed(1)} MP`;
  if (pixels >= 1000) return `${(pixels / 1000).toFixed(0)} K`;
  return `${pixels} px`;
}
