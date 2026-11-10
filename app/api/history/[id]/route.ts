import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { deleteHistory } from "@/features/history/cloud";

export const runtime = "nodejs";

/** Delete one cloud history entry (ownership enforced; idempotent). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const result = await deleteHistory(auth.user.id, id);
  if (result.status === "NOT_FOUND") {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }
  return NextResponse.json({ status: result.status });
}
