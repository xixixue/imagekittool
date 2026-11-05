import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isCloudStorageEnabled } from "@/lib/storage";
import { getDownloadUrl } from "@/features/cloud-storage/files";

export const runtime = "nodejs";

/** Mint a short-lived download URL for a cloud file (SPEC §7.4 download). */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!isCloudStorageEnabled()) {
    return NextResponse.json({ error: "Cloud storage is not available." }, { status: 503 });
  }

  const { id } = await params;
  const result = await getDownloadUrl(auth.user.id, id);
  if (!result.url) {
    return NextResponse.json({ error: "File not found or not ready." }, { status: 404 });
  }
  return NextResponse.json(result);
}
