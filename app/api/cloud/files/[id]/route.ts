import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { isCloudStorageEnabled } from "@/lib/storage";
import { deleteFile, getFile } from "@/features/cloud-storage/files";

export const runtime = "nodejs";

/** Fetch one cloud file's metadata (ownership enforced). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!isCloudStorageEnabled()) {
    return NextResponse.json({ error: "Cloud storage is not available." }, { status: 503 });
  }

  const { id } = await params;
  const file = await getFile(auth.user.id, id);
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
  return NextResponse.json({ file });
}

/** Delete a cloud file (SPEC §7.4 delete flow; idempotent). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!isCloudStorageEnabled()) {
    return NextResponse.json({ error: "Cloud storage is not available." }, { status: 503 });
  }

  const { id } = await params;
  const result = await deleteFile(auth.user.id, id);
  if (result.status === "NOT_FOUND") {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
  return NextResponse.json({ status: result.status });
}
