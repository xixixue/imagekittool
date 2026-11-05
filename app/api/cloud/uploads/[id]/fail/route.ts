import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isCloudStorageEnabled } from "@/lib/storage";
import { failUpload } from "@/features/cloud-storage/upload";
import { toErrorResponse } from "@/features/cloud-storage/http";

export const runtime = "nodejs";

/** Mark an upload failed and release its reserved quota (SPEC §7.3). */
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
  try {
    const result = await failUpload(auth.user.id, id);
    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
