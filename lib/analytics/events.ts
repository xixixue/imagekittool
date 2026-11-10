/**
 * Analytics event vocabulary and privacy-safe attribute builders (SPEC V2 §13).
 *
 * Events are high-level product events pushed to GA4 via lib/analytics/track.
 * The builders normalize raw values into coarse buckets so no individual file
 * size, count, or timing is transmitted verbatim, and they NEVER include image
 * content, file names, EXIF/GPS, or other personal data (V2 §13.2).
 */

/**
 * Canonical event names (SPEC V2 §13.1). `subscription_started` is reserved for
 * when payment goes live and is intentionally absent until then.
 */
export const AnalyticsEvent = {
  toolView: "tool_view",
  fileSelected: "file_selected",
  processingStarted: "processing_started",
  processingCompleted: "processing_completed",
  processingFailed: "processing_failed",
  downloadClicked: "download_clicked",
  batchStarted: "batch_started",
  batchCompleted: "batch_completed",
  workflowStarted: "workflow_started",
  workflowCompleted: "workflow_completed",
  signupCompleted: "signup_completed",
  cloudSaveStarted: "cloud_save_started",
  cloudSaveCompleted: "cloud_save_completed",
  proUpgradeViewed: "pro_upgrade_viewed",
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

/** Bucket a file count into a coarse range label (no exact counts transmitted). */
export function fileCountBucket(count: number): string {
  if (count <= 0) return "0";
  if (count === 1) return "1";
  if (count <= 5) return "2-5";
  if (count <= 10) return "6-10";
  if (count <= 20) return "11-20";
  return "21+";
}

/** Bucket a byte size into a coarse range label (no exact sizes transmitted). */
export function sizeBucket(bytes: number): string {
  if (bytes <= 0) return "0";
  const kb = bytes / 1024;
  if (kb < 100) return "<100KB";
  if (kb < 500) return "100-500KB";
  if (kb < 1024) return "500KB-1MB";
  const mb = kb / 1024;
  if (mb < 5) return "1-5MB";
  if (mb < 10) return "5-10MB";
  return "10MB+";
}

/** Bucket a millisecond duration into a coarse range label. */
export function durationBucket(ms: number): string {
  if (ms < 0) return "0";
  if (ms < 500) return "<0.5s";
  if (ms < 2000) return "0.5-2s";
  if (ms < 5000) return "2-5s";
  if (ms < 10000) return "5-10s";
  return "10s+";
}

/** Reduce an error to a short, safe code (no message text, no stack, no PII). */
export function sanitizeError(error: unknown): string {
  if (error == null) return "unknown";
  if (error instanceof Error) {
    const name = error.name && error.name !== "Error" ? error.name : "error";
    return name.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 40) || "error";
  }
  return "error";
}
