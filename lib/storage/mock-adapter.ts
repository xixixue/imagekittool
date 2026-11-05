import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  ObjectHead,
  PresignedGet,
  PresignedPut,
  StorageAdapter,
} from "./adapter";

/**
 * Dev-only StorageAdapter that persists objects on the local filesystem under
 * `<workspace>/.cloud-storage/` (gitignored). Presigned URLs point at same-origin
 * mock receive routes (`/api/storage-mock/put|get/[key]`), so the browser still
 * performs a direct PUT/GET — the client code is identical to the real S3 path;
 * only the adapter swaps in production.
 *
 * Server-only (Node runtime). Never imported from client components.
 */
const MOCK_DIR = path.resolve(process.cwd(), ".cloud-storage");

function filePath(objectKey: string): string {
  // Object keys are server-generated flat random cuid strings; reject anything
  // that looks path-like to keep files inside MOCK_DIR.
  if (!/^[A-Za-z0-9_-]+$/.test(objectKey)) {
    throw new Error("Invalid object key for mock storage.");
  }
  return path.join(MOCK_DIR, objectKey);
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export class MockStorageAdapter implements StorageAdapter {
  readonly name = "mock";

  isConfigured(): boolean {
    return true;
  }

  async presignPut(
    objectKey: string,
    contentType: string,
    _sizeBytes: number,
    ttlSeconds: number,
  ): Promise<PresignedPut> {
    // Ensure the key is valid before handing the URL out.
    filePath(objectKey);
    return {
      url: `${appUrl()}/api/storage-mock/put/${objectKey}`,
      method: "PUT",
      headers: { "Content-Type": contentType },
      expiresIn: ttlSeconds,
    };
  }

  async presignGet(objectKey: string, ttlSeconds: number): Promise<PresignedGet> {
    filePath(objectKey);
    return {
      url: `${appUrl()}/api/storage-mock/get/${objectKey}`,
      expiresIn: ttlSeconds,
    };
  }

  async head(objectKey: string): Promise<ObjectHead | null> {
    try {
      const stat = await fs.stat(filePath(objectKey));
      return { size: stat.size };
    } catch {
      return null;
    }
  }

  async delete(objectKey: string): Promise<void> {
    await fs.unlink(filePath(objectKey)).catch(() => undefined);
  }

  async listKeys(): Promise<string[]> {
    try {
      const entries = await fs.readdir(MOCK_DIR);
      // Only return files whose names pass the key guard.
      return entries.filter((e) => /^[A-Za-z0-9_-]+$/.test(e));
    } catch {
      return [];
    }
  }

  /** Used by the mock receive route to write an uploaded body to disk. */
  async putObject(objectKey: string, body: Buffer, contentType?: string): Promise<void> {
    await fs.mkdir(MOCK_DIR, { recursive: true });
    await fs.writeFile(filePath(objectKey), body);
    if (contentType) {
      // Store content type alongside for head()/GET to return.
      await fs.writeFile(`${filePath(objectKey)}.meta`, contentType).catch(() => undefined);
    }
  }

  /** Used by the mock GET route to stream a file; throws if missing. */
  async readObject(objectKey: string): Promise<{ body: Buffer; contentType?: string }> {
    const body = await fs.readFile(filePath(objectKey));
    let contentType: string | undefined;
    try {
      contentType = (await fs.readFile(`${filePath(objectKey)}.meta`, "utf8")) || undefined;
    } catch {
      contentType = undefined;
    }
    return { body, contentType };
  }
}
