import { NextResponse } from "next/server";
import { guardRateLimit } from "@/lib/auth/http";
import { requireUser } from "@/lib/auth/require-user";
import { isCloudStorageEnabled } from "@/lib/storage";
import { uploadCreateSchema } from "@/lib/validation/cloud";
import { createUploadTask } from "@/features/cloud-storage/upload";
import { toErrorResponse } from "@/features/cloud-storage/http";

export const runtime = "nodejs";

const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 1000;

/** Create an upload task and return a presigned PUT URL (SPEC §7.3). */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!isCloudStorageEnabled()) {
    return NextResponse.json({ error: "Cloud storage is not available." }, { status: 503 });
  }

  const blocked = guardRateLimit(request, "cloud-upload", RATE_LIMIT, RATE_WINDOW);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = uploadCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const handle = await createUploadTask(auth.user.id, parsed.data);
    return NextResponse.json(handle, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
