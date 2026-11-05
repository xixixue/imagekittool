import { describe, expect, it } from "vitest";
import { S3StorageAdapter } from "@/lib/storage/s3-adapter";

/**
 * The S3 adapter mints presigned URLs via local AWS SigV4 signing — no network
 * call is made for presignPut/presignGet (getSignedUrl is pure signing), so we
 * can verify the contract deterministically. head/delete/listKeys hit the wire
 * and are covered by the end-to-end cloud flow instead.
 */
const FAKE_CONFIG = {
  endpoint: "https://testacct.r2.cloudflarestorage.com",
  region: "auto",
  bucket: "imagekittools-test",
  accessKeyId: "AKIAFAKEKEY",
  secretAccessKey: "fakeSecretAccessKey",
};

describe("S3StorageAdapter", () => {
  it("rejects construction without bucket/credentials", () => {
    expect(
      () => new S3StorageAdapter({ endpoint: "https://x", region: "auto" }),
    ).toThrow();
  });

  it("reports configured and the s3 name", () => {
    const a = new S3StorageAdapter(FAKE_CONFIG);
    expect(a.name).toBe("s3");
    expect(a.isConfigured()).toBe(true);
  });

  it("presignPut returns a signed path-style PUT URL with Content-Type header", async () => {
    const a = new S3StorageAdapter(FAKE_CONFIG);
    const presigned = await a.presignPut("obj-key-123", "image/png", 1024, 60);
    expect(presigned.method).toBe("PUT");
    expect(presigned.expiresIn).toBe(60);
    expect(presigned.headers["Content-Type"]).toBe("image/png");
    // Path-style addressing: endpoint host + bucket + key in the path.
    expect(presigned.url).toContain("testacct.r2.cloudflarestorage.com");
    expect(presigned.url).toContain("/imagekittools-test/obj-key-123");
    // A real SigV4 presigned URL carries the signature in the query string.
    expect(presigned.url).toMatch(/X-Amz-Signature=/);
  });

  it("presignGet returns a signed GET URL for the object", async () => {
    const a = new S3StorageAdapter(FAKE_CONFIG);
    const presigned = await a.presignGet("obj-key-123", 120);
    expect(presigned.expiresIn).toBe(120);
    expect(presigned.url).toContain("/imagekittools-test/obj-key-123");
    expect(presigned.url).toMatch(/X-Amz-Signature=/);
  });
});
