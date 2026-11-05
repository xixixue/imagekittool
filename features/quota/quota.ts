import { prisma } from "@/lib/db/prisma";
import { DEFAULT_QUOTA_BYTES } from "@/lib/config/quota";

/** Raised when an upload would exceed the user's storage quota. */
export class QuotaExceededError extends Error {
  constructor(public available: number, public required: number) {
    super("Storage quota exceeded.");
    this.name = "QuotaExceededError";
  }
}

export interface StorageUsage {
  quotaBytes: number;
  usedBytes: number;
  reservedBytes: number;
  availableBytes: number;
}

/**
 * Pure guard: can `required` bytes be reserved given the current usage?
 * `used + reserved + required <= quota`. Extracted so it is unit-testable
 * without a database (SPEC AGENTS.md: algorithms must have tests).
 */
export function canReserve(
  used: number,
  reserved: number,
  required: number,
  quota: number,
): boolean {
  if (required < 0 || used < 0 || reserved < 0 || quota < 0) return false;
  // Guard against integer overflow on pathological inputs.
  const total = used + reserved + required;
  if (!Number.isSafeInteger(total)) return false;
  return total <= quota;
}

/** Return the user's quota row, creating it with the default quota if absent. */
export async function getOrCreateQuota(userId: string) {
  return prisma.userStorageQuota.upsert({
    where: { userId },
    update: {},
    create: { userId, quotaBytes: DEFAULT_QUOTA_BYTES },
  });
}

/** Read usage figures for the quota UI. */
export async function getUsage(userId: string): Promise<StorageUsage> {
  const q = await getOrCreateQuota(userId);
  return {
    quotaBytes: q.quotaBytes,
    usedBytes: q.usedBytes,
    reservedBytes: q.reservedBytes,
    availableBytes: Math.max(0, q.quotaBytes - q.usedBytes - q.reservedBytes),
  };
}

/**
 * Atomically reserve `bytes` of quota for an in-flight upload.
 *
 * Uses a single conditional UPDATE so concurrent uploads cannot race past the
 * quota (SPEC §7.5): the increment only applies when `used + reserved + bytes
 * <= quota`. Throws QuotaExceededError when the condition fails.
 */
export async function reserveQuota(userId: string, bytes: number): Promise<void> {
  await getOrCreateQuota(userId);
  const now = new Date();
  const affected = await prisma.$executeRaw`
    UPDATE "UserStorageQuota"
    SET "reservedBytes" = "reservedBytes" + ${bytes},
        "updatedAt" = ${now}
    WHERE "userId" = ${userId}
      AND "usedBytes" + "reservedBytes" + ${bytes} <= "quotaBytes"`;
  if (affected === 0) {
    const q = await getOrCreateQuota(userId);
    const available = Math.max(0, q.quotaBytes - q.usedBytes - q.reservedBytes);
    throw new QuotaExceededError(available, bytes);
  }
}

/**
 * Move a confirmed upload from reserved to used (SPEC §7.5: reserved → used on
 * success). Atomic and guarded so it never drives reserved/used negative.
 */
export async function confirmReserved(userId: string, bytes: number): Promise<void> {
  const now = new Date();
  await prisma.$executeRaw`
    UPDATE "UserStorageQuota"
    SET "reservedBytes" = "reservedBytes" - ${bytes},
        "usedBytes" = "usedBytes" + ${bytes},
        "updatedAt" = ${now}
    WHERE "userId" = ${userId}
      AND "reservedBytes" >= ${bytes}`;
}

/** Release reserved bytes when an upload fails or a task expires. */
export async function releaseReserved(userId: string, bytes: number): Promise<void> {
  if (bytes <= 0) return;
  const now = new Date();
  await prisma.$executeRaw`
    UPDATE "UserStorageQuota"
    SET "reservedBytes" = "reservedBytes" - ${bytes},
        "updatedAt" = ${now}
    WHERE "userId" = ${userId}
      AND "reservedBytes" >= ${bytes}`;
}

/** Release used bytes when a file is deleted. */
export async function releaseUsed(userId: string, bytes: number): Promise<void> {
  if (bytes <= 0) return;
  const now = new Date();
  await prisma.$executeRaw`
    UPDATE "UserStorageQuota"
    SET "usedBytes" = "usedBytes" - ${bytes},
        "updatedAt" = ${now}
    WHERE "userId" = ${userId}
      AND "usedBytes" >= ${bytes}`;
}
