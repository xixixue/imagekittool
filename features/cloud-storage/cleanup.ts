import { prisma } from "@/lib/db/prisma";
import { releaseReserved } from "@/features/quota/quota";
import { getStorageAdapter } from "@/lib/storage";

/**
 * Whether an upload task is expired relative to `now`. Pure helper extracted for
 * unit testing (no DB).
 */
export function isExpired(expiresAtMs: number, nowMs: number): boolean {
  return expiresAtMs <= nowMs;
}

/**
 * Reclaim expired upload tasks (SPEC §7.3 failure handling, §7.4): tasks still
 * PENDING_UPLOAD/UPLOADING past their expiry are marked EXPIRED, their reserved
 * quota is released, and any orphaned object is deleted. Returns the count.
 */
export async function cleanupExpiredTasks(): Promise<number> {
  const now = new Date();
  const stale = await prisma.uploadTask.findMany({
    where: {
      status: { in: ["PENDING_UPLOAD", "UPLOADING"] },
      expiresAt: { lt: now },
    },
  });
  if (stale.length === 0) return 0;

  const adapter = getStorageAdapter();
  for (const task of stale) {
    await adapter?.delete(task.objectKey).catch(() => undefined);
    await prisma.uploadTask.update({ where: { id: task.id }, data: { status: "EXPIRED" } });
    await releaseReserved(task.userId, task.reservedBytes).catch(() => undefined);
    if (task.fileId) {
      await prisma.storageFile
        .update({ where: { id: task.fileId }, data: { status: "EXPIRED" } })
        .catch(() => undefined);
    }
  }
  return stale.length;
}

/**
 * Delete orphan objects that exist in storage but have no READY file row
 * (SPEC §7.3: orphan object cleanup). Returns the count of removed objects.
 */
export async function cleanupOrphanObjects(): Promise<number> {
  const adapter = getStorageAdapter();
  if (!adapter) return 0;
  const keys = await adapter.listKeys();
  if (keys.length === 0) return 0;

  const live = await prisma.storageFile.findMany({
    where: { objectKey: { in: keys }, status: "READY" },
    select: { objectKey: true },
  });
  const liveSet = new Set(live.map((r) => r.objectKey));

  let removed = 0;
  for (const key of keys) {
    if (!liveSet.has(key)) {
      await adapter.delete(key).catch(() => undefined);
      removed += 1;
    }
  }
  return removed;
}
