import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isCloudStorageEnabled } from "@/lib/storage";
import { listFiles } from "@/features/cloud-storage/files";

export const runtime = "nodejs";

/** List the caller's ready cloud files (SPEC §7.4, users see only their own). */
export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!isCloudStorageEnabled()) {
    return NextResponse.json({ error: "Cloud storage is not available." }, { status: 503 });
  }

  const files = await listFiles(auth.user.id);
  return NextResponse.json({ files });
}
