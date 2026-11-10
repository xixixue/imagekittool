import { sizeBucket } from "@/lib/analytics/events";
import type { HistoryInput, HistoryMeta } from "./types";

export interface BuildInput {
  toolType: string;
  inputs: { format?: string; sizeBytes: number }[];
  outputs: { format?: string; sizeBytes: number }[];
  parameters: Record<string, unknown>;
}

function uniq<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function metaFrom(items: { format?: string; sizeBytes: number }[]): HistoryMeta {
  return {
    count: items.length,
    formats: uniq(items.map((it) => it.format ?? "unknown")),
    sizeBuckets: uniq(items.map((it) => sizeBucket(it.sizeBytes))),
  };
}

/** Max JSON length (chars) for sanitized parameters — defends against bloat. */
const MAX_PARAMETERS_JSON = 4096;

/**
 * Reduce tool options to a serializable, size-capped JSON object. Tool options
 * are plain params (quality, dimensions, format, watermark text) — never file
 * content or EXIF — but we clone + cap defensively so a runaway option object
 * cannot bloat history storage or leak unexpected nested data.
 */
function sanitizeParameters(params: Record<string, unknown>): Record<string, unknown> {
  try {
    const json = JSON.stringify(params);
    if (json.length <= MAX_PARAMETERS_JSON) {
      return JSON.parse(json) as Record<string, unknown>;
    }
    return { truncated: true };
  } catch {
    return { nonSerializable: true };
  }
}

/**
 * Build a privacy-safe history payload from a completed processing run. Pure —
 * no id/createdAt (the local/cloud layer assigns those). Reuses the analytics
 * size buckets so history and analytics describe sizes consistently.
 */
export function buildHistoryInput(input: BuildInput): HistoryInput {
  return {
    toolType: input.toolType,
    inputMeta: metaFrom(input.inputs),
    outputMeta: metaFrom(input.outputs),
    parameters: sanitizeParameters(input.parameters),
  };
}
