import { prisma } from "@/lib/db/prisma";
import { PRESIGN_TTL_SECONDS } from "@/lib/config/quota";
import { releaseUsed } from "@/features/quota/quota";
import { generateObjectKey, getStorageAdapter } from "@/lib/storage";
import type { CloudFileMeta, OperationType } from "./types";

function toMeta(row: {
  id: string;
  originalName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  category: string;
  operationType: string | null;
  status: string;
  createdAt: Date;
}): CloudFileMeta {
  return {
    id: row.id,
    originalName: row.originalName,
    mimeType: row.mimeType,
    extension: row.extension,
    sizeBytes: row.sizeBytes,
    category: row.category,
    operationType: row.operationType as OperationType | null,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

/** List the caller's ready cloud files (SPEC §7.4: users see only their own). */
export async function listFiles(userId: string): Promise<CloudFileMeta[]> {
  const rows = await prisma.storageFile.findMany({
    where: { userId, status: "READY", deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
  const metas: CloudFileMeta[] = rows.map(toMeta);
  // Mint short-lived presigned GET URLs so the list can render image thumbnails.
  // Non-image files get none (the UI shows a file-type glyph instead). Presigning
  // is local signing (no network round-trip), so this is cheap per row.
  const adapter = getStorageAdapter();
  if (adapter) {
    await Promise.all(
      rows.map(async (row, i) => {
        if (!row.mimeType.startsWith("image/")) return;
        try {
          const get = await adapter.presignGet(row.objectKey, PRESIGN_TTL_SECONDS);
          metas[i].thumbnailUrl = get.url;
        } catch {
          // Leave without a thumbnail; the list still renders a file-type glyph.
        }
      }),
    );
  }
  return metas;
}

/** Fetch one file, enforcing ownership. Returns null when not owned/not found. */
export async function getFile(userId: string, fileId: string): Promise<CloudFileMeta | null> {
  const row = await prisma.storageFile.findUnique({ where: { id: fileId } });
  if (!row || row.userId !== userId || row.status === "DELETED") return null;
  return toMeta(row);
}

/**
 * Mint a short-lived download URL for a file (SPEC §7.4 download flow).
 * Ownership is verified before the URL is issued; the URL itself is a
 * short-lived capability.
 */
export async function getDownloadUrl(
  userId: string,
  fileId: string,
): Promise<{ url: string; expiresIn: number }> {
  const row = await prisma.storageFile.findUnique({ where: { id: fileId } });
  if (!row || row.userId !== userId) {
    return { url: "", expiresIn: 0 };
  }
  if (row.status !== "READY") {
    return { url: "", expiresIn: 0 };
  }
  const adapter = getStorageAdapter();
  if (!adapter) return { url: "", expiresIn: 0 };
  const get = await adapter.presignGet(row.objectKey, PRESIGN_TTL_SECONDS);
  return { url: get.url, expiresIn: get.expiresIn };
}

/**
 * Delete a file: mark DELETING, remove the object, mark DELETED, release quota.
 * Idempotent — deleting an already-deleted file succeeds. On object-delete
 * failure the row stays DELETING for retry (SPEC §7.4 delete flow).
 */
export async function deleteFile(userId: string, fileId: string): Promise<{ status: string }> {
  const row = await prisma.storageFile.findUnique({ where: { id: fileId } });
  if (!row || row.userId !== userId) {
    return { status: "NOT_FOUND" };
  }
  if (row.status === "DELETED") {
    return { status: "DELETED" }; // idempotent
  }

  const adapter = getStorageAdapter();
  await prisma.storageFile.update({ where: { id: fileId }, data: { status: "DELETING" } });
  try {
    await adapter?.delete(row.objectKey);
  } catch {
    // Leave as DELETING for retry; do not release quota yet.
    return { status: "DELETING" };
  }
  await prisma.storageFile.update({
    where: { id: fileId },
    data: { status: "DELETED", deletedAt: new Date() },
  });
  await releaseUsed(userId, row.sizeBytes).catch(() => undefined);
  return { status: "DELETED" };
}

// Re-exported so callers can mint keys without importing the storage layer directly.
export { generateObjectKey };
