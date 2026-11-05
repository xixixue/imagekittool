/**
 * Storage adapter abstraction (SPEC §7, §9.2). The browser uploads/downloads via
 * short-lived presigned URLs minted by the adapter; the backend verifies object
 * existence and size after upload. Buckets are always private.
 *
 * A local Mock implementation backs development; a real S3-compatible adapter
 * (Cloudflare R2, etc.) is wired in production once credentials are provided
 * (SPEC §22 — never fabricate credentials).
 */

export interface PresignedPut {
  /** URL the browser PUTs the object body to. */
  url: string;
  method: "PUT";
  /** Request headers the browser must send with the PUT. */
  headers: Record<string, string>;
  /** Validity in seconds. */
  expiresIn: number;
}

export interface PresignedGet {
  /** URL the browser downloads the object from. */
  url: string;
  expiresIn: number;
}

export interface ObjectHead {
  size: number;
  contentType?: string;
}

export interface StorageAdapter {
  readonly name: string;
  /** True when the adapter is backed by real, configured storage. */
  isConfigured(): boolean;
  /** Mint a short-lived URL the browser can PUT the object body to. */
  presignPut(
    objectKey: string,
    contentType: string,
    sizeBytes: number,
    ttlSeconds: number,
  ): Promise<PresignedPut>;
  /** Mint a short-lived URL the browser can GET the object from. */
  presignGet(objectKey: string, ttlSeconds: number): Promise<PresignedGet>;
  /** Verify an object exists and return its real size/type (SPEC §7.3 step 8). */
  head(objectKey: string): Promise<ObjectHead | null>;
  /** Delete an object. Idempotent — no error if the object is missing. */
  delete(objectKey: string): Promise<void>;
  /** List all object keys (for orphan-object cleanup, SPEC §7.4). */
  listKeys(): Promise<string[]>;
}
