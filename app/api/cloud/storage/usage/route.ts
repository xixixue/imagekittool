import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isCloudStorageEnabled } from "@/lib/storage";
import { getUsage } from "@/features/quota/quota";

export const runtime = "nodejs";

/** Return the caller's storage usage (SPEC §11 quota response). */
export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!isCloudStorageEnabled()) {
    return NextResponse.json({ error: "Cloud storage is not available." }, { status: 503 });
  }

  const usage = await getUsage(auth.user.id);
  return NextResponse.json(usage);
}
