import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { CloudHistoryEntry, HistoryInput, HistoryMeta } from "./types";

/**
 * Cloud processing history (SPEC V2 §12). Server-only — imports Prisma. Entries
 * are created only on explicit user action (POST /api/history). All queries are
 * scoped to the calling user; delete verifies ownership before deleting.
 */

type HistoryRow = {
  id: string;
  userId: string;
  toolType: string;
  inputMeta: unknown;
  outputMeta: unknown;
  parameters: unknown;
  createdAt: Date;
};

function toEntry(row: HistoryRow): CloudHistoryEntry {
  return {
    cloudId: row.id,
    id: row.id,
    toolType: row.toolType,
    inputMeta: row.inputMeta as HistoryMeta,
    outputMeta: row.outputMeta as HistoryMeta,
    parameters: row.parameters as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
  };
}

/** List the caller's cloud history (newest first, capped at 200). */
export async function listHistory(userId: string): Promise<CloudHistoryEntry[]> {
  const rows = await prisma.processingHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map(toEntry);
}

/** Create one cloud history entry for the caller. */
export async function createHistory(
  userId: string,
  input: HistoryInput,
): Promise<CloudHistoryEntry> {
  const row = await prisma.processingHistory.create({
    data: {
      userId,
      toolType: input.toolType,
      inputMeta: input.inputMeta as unknown as Prisma.InputJsonValue,
      outputMeta: input.outputMeta as unknown as Prisma.InputJsonValue,
      parameters: input.parameters as unknown as Prisma.InputJsonValue,
    },
  });
  return toEntry(row);
}

/** Delete one entry, enforcing ownership. Returns NOT_FOUND when not owned. */
export async function deleteHistory(userId: string, id: string): Promise<{ status: string }> {
  const row = await prisma.processingHistory.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return { status: "NOT_FOUND" };
  await prisma.processingHistory.delete({ where: { id } });
  return { status: "DELETED" };
}
