/**
 * Processing history types (SPEC V2 §12).
 *
 * History entries are metadata-only: coarse format + size-bucket + count, plus
 * the sanitized tool parameters. No image content, original filename, EXIF, or
 * GPS is ever stored (V2 §12/§13.2). Local history lives in the browser
 * (localStorage) and may be lost when the user clears browser data; cloud
 * history exists only when the user explicitly saves an entry.
 */

/** Privacy-safe input/output summary for one processing run. */
export interface HistoryMeta {
  /** Number of files in this side of the run. */
  count: number;
  /** Distinct image formats involved (e.g. ["jpg","png"]). */
  formats: string[];
  /** Distinct coarse size buckets (e.g. ["1-5MB"]). */
  sizeBuckets: string[];
}

/** A local (browser, localStorage) history entry. */
export interface HistoryEntry {
  id: string;
  toolType: string;
  inputMeta: HistoryMeta;
  outputMeta: HistoryMeta;
  parameters: Record<string, unknown>;
  /** ISO timestamp. */
  createdAt: string;
}

/** A cloud history entry (same shape, plus the server-generated id). */
export interface CloudHistoryEntry extends HistoryEntry {
  cloudId: string;
}

/** Payload accepted by POST /api/history (no id/createdAt — server assigns). */
export interface HistoryInput {
  toolType: string;
  inputMeta: HistoryMeta;
  outputMeta: HistoryMeta;
  parameters: Record<string, unknown>;
}
