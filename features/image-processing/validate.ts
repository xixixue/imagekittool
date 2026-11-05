import { detectFormat, extToFormat, mimeToFormat } from "./format";
import { validateFileSize } from "./limits";
import type { ImageFormat } from "./types";

export interface ValidationResult {
  ok: boolean;
  error?: string;
  format?: ImageFormat;
}

/** Bytes needed to identify every supported format by magic numbers. */
export const MAGIC_BYTES_LENGTH = 12;

/**
 * Pure validation core (no File/Browser APIs): checks size, detects format from
 * magic bytes, and rejects files whose declared MIME/extension disagrees with the
 * actual content (disguised files, per SPEC §5 / §18).
 */
export function validateImageMetadata(
  size: number,
  bytes: Uint8Array,
  declaredMime: string | undefined | null,
  declaredExt: ImageFormat | null,
): ValidationResult {
  const sizeCheck = validateFileSize(size);
  if (!sizeCheck.ok) return { ok: false, error: sizeCheck.error };

  const format = detectFormat(bytes);
  if (!format) {
    return {
      ok: false,
      error: "Unsupported or unrecognized format. Only JPG, PNG, and WebP are accepted.",
    };
  }

  const mimeFormat = mimeToFormat(declaredMime);
  if (mimeFormat && mimeFormat !== format) {
    return { ok: false, error: "File content does not match its declared type." };
  }
  if (declaredExt && declaredExt !== format) {
    return { ok: false, error: "File content does not match its extension." };
  }

  return { ok: true, format };
}

/** Browser wrapper: reads the first bytes of a File and validates it. */
export async function validateImageFile(file: File): Promise<ValidationResult> {
  const declaredExt = extToFormat(file.name);
  const head = file.slice(0, MAGIC_BYTES_LENGTH);
  const bytes = new Uint8Array(await head.arrayBuffer());
  return validateImageMetadata(file.size, bytes, file.type, declaredExt);
}
