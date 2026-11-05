import { isS3Configured, readS3Config } from "@/lib/config/storage";
import type { StorageAdapter } from "./adapter";
import { MockStorageAdapter } from "./mock-adapter";
import { S3StorageAdapter } from "./s3-adapter";

/**
 * Resolve the active storage adapter.
 *
 * - When S3-compatible config is present, a real `S3StorageAdapter` is used
 *   (Cloudflare R2 / AWS S3). Credentials are owner-provided (SPEC §22).
 * - In non-production with no S3 config, a local Mock adapter is used so the full
 *   cloud flow is testable end-to-end.
 * - In production with no S3 config, returns null: cloud features report
 *   "unavailable" and the site keeps running (SPEC §16).
 */
let adapter: StorageAdapter | null | undefined;

export function getStorageAdapter(): StorageAdapter | null {
  if (adapter !== undefined) return adapter;
  if (isS3Configured()) {
    try {
      adapter = new S3StorageAdapter(readS3Config());
      return adapter;
    } catch {
      // Misconfigured (should not happen — isS3Configured guards the fields),
      // degrade to null rather than crashing startup.
      adapter = null;
      return null;
    }
  }
  if (process.env.NODE_ENV !== "production") {
    adapter = new MockStorageAdapter();
    return adapter;
  }
  adapter = null;
  return null;
}

/** Whether cloud storage is available in the current environment. */
export function isCloudStorageEnabled(): boolean {
  return getStorageAdapter() !== null;
}

/** Test/override hook (mirrors the email sender pattern). */
export function setStorageAdapter(a: StorageAdapter | null): void {
  adapter = a;
}

export { MockStorageAdapter } from "./mock-adapter";
export { S3StorageAdapter } from "./s3-adapter";
export { generateObjectKey, generateIdempotencyKey } from "./keys";
export type { StorageAdapter, PresignedPut, PresignedGet, ObjectHead } from "./adapter";
