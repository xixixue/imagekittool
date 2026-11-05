/**
 * Cloud storage limits and quotas (SPEC §5, §7.1). All values are configurable
 * here and chosen to be safe defaults for the MVP.
 */

/** Free-tier quota: 1 GB (SPEC §7.1). */
export const DEFAULT_QUOTA_BYTES = 1024 * 1024 * 1024;

/** Max size of a single uploaded file: 25 MB (matches the local-tool limit). */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** How long an upload task (and its reserved quota) stays valid: 1 hour. */
export const UPLOAD_TASK_TTL_MS = 60 * 60 * 1000;

/** Validity of a presigned PUT/GET URL: 15 minutes (short-lived, SPEC §7.3). */
export const PRESIGN_TTL_SECONDS = 15 * 60;

/** MIME types accepted for cloud upload (image only). */
export const ALLOWED_UPLOAD_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** Extensions accepted for cloud upload. */
export const ALLOWED_UPLOAD_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export type AllowedUploadMime = (typeof ALLOWED_UPLOAD_MIME)[number];

/** File categories stored on a StorageFile row (SPEC §10). */
export const FILE_CATEGORIES = ["ORIGINAL", "PROCESSED", "OTHER"] as const;
export type FileCategory = (typeof FILE_CATEGORIES)[number];
