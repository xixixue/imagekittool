import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isCloudStorageEnabled } from "@/lib/storage";
import { cleanupExpiredTasks, cleanupOrphanObjects } from "@/features/cloud-storage/cleanup";

export const runtime = "nodejs";

/**
 * Reclaim expired upload tasks and orphan objects (SPEC §7.3, §7.4). In
 * production this is driven by a cron; in dev it can be triggered by the signed-
 * in user to reconcile their own environment.
 */
export async function POST() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!isCloudStorageEnabled()) {
    return NextResponse.json({ error: "Cloud storage is not available." }, { status: 503 });
  }

  const expiredTasks = await cleanupExpiredTasks();
  const orphanObjects = await cleanupOrphanObjects();
  return NextResponse.json({ expiredTasks, orphanObjects });
}
