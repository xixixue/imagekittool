import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { type S3Config } from "@/lib/config/storage";
import type {
  ObjectHead,
  PresignedGet,
  PresignedPut,
  StorageAdapter,
} from "./adapter";

/**
 * Real S3-compatible StorageAdapter (Cloudflare R2, AWS S3, etc.).
 *
 * - Object keys are server-generated flat random strings (see keys.ts); the
 *   browser uploads/downloads via short-lived presigned URLs minted here.
 * - Buckets are private: nothing is publicly listable; only a presigned URL
 *   grants temporary access (SPEC §7, §9.2, decision four).
 * - Server-only (Node runtime); imports the AWS SDK, never bundled for clients.
 *
 * The browser performs a cross-origin PUT/GET directly against the storage
 * endpoint, so the bucket must allow CORS from the app origin (see
 * DEPLOYMENT.md §2). Credentials are owner-provided (SPEC §22) and read from
 * env via S3Config; nothing is fabricated.
 */
export class S3StorageAdapter implements StorageAdapter {
  readonly name = "s3";
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: S3Config) {
    if (!config.bucket || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error("S3StorageAdapter requires bucket and credentials.");
    }
    this.bucket = config.bucket;
    this.client = new S3Client({
      endpoint: config.endpoint,
      // R2 / S3-compatible endpoints work reliably with path-style addressing.
      forcePathStyle: true,
      region: config.region || "auto",
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  isConfigured(): boolean {
    return true;
  }

  /**
   * Mint a short-lived presigned URL the browser PUTs the object body to.
   * Content-Type is signed so the browser must send it with the PUT; the
   * returned headers tell the client exactly what to send (SPEC §7.3 step 6).
   */
  async presignPut(
    objectKey: string,
    contentType: string,
    _sizeBytes: number,
    ttlSeconds: number,
  ): Promise<PresignedPut> {
    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        ContentType: contentType,
      }),
      { expiresIn: ttlSeconds },
    );
    return {
      url,
      method: "PUT",
      headers: { "Content-Type": contentType },
      expiresIn: ttlSeconds,
    };
  }

  /** Mint a short-lived presigned URL the browser downloads the object from. */
  async presignGet(objectKey: string, ttlSeconds: number): Promise<PresignedGet> {
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      { expiresIn: ttlSeconds },
    );
    return { url, expiresIn: ttlSeconds };
  }

  /**
   * Verify an object exists and return its real size/type after upload
   * (SPEC §7.3 step 8 — server must check the actual object, not trust the
   * client's claimed size).
   */
  async head(objectKey: string): Promise<ObjectHead | null> {
    try {
      const res = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: objectKey }),
      );
      const size = res.ContentLength;
      if (typeof size !== "number") return null;
      return { size, contentType: res.ContentType };
    } catch (err) {
      if (err instanceof NotFound) return null;
      // Other errors are surfaced as "not found" so the caller treats the
      // object as missing rather than crashing the request.
      return null;
    }
  }

  /** Delete an object. Idempotent — no error if the object is missing. */
  async delete(objectKey: string): Promise<void> {
    await this.client
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }))
      .catch(() => undefined);
  }

  /**
   * List all object keys under the bucket (for orphan-object cleanup,
   * SPEC §7.4). Paginates through ListObjectsV2.
   */
  async listKeys(): Promise<string[]> {
    const keys: string[] = [];
    let token: string | undefined;
    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          ContinuationToken: token,
        }),
      );
      for (const obj of res.Contents ?? []) {
        if (obj.Key) keys.push(obj.Key);
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
    return keys;
  }
}
