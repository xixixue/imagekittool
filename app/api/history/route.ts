import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { createHistory, listHistory } from "@/features/history/cloud";
import type { HistoryInput } from "@/features/history";

export const runtime = "nodejs";

/**
 * Processing history API (SPEC V2 §12). Cloud history is metadata-only and is
 * created only on explicit user action. All entries are scoped to the caller.
 */

/** List the caller's cloud processing history (newest first). */
export async function GET() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const entries = await listHistory(auth.user.id);
  return NextResponse.json({ entries });
}

/** Validate a history payload. Returns an error string or null when valid. */
function validateInput(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return "Invalid body.";
  const b = body as Record<string, unknown>;
  if (typeof b.toolType !== "string" || !b.toolType.trim()) return "toolType is required.";
  if (!isMeta(b.inputMeta) || !isMeta(b.outputMeta)) return "inputMeta/outputMeta are required.";
  if (typeof b.parameters !== "object" || b.parameters === null) {
    return "parameters is required.";
  }
  return null;
}

function isMeta(v: unknown): boolean {
  if (typeof v !== "object" || v === null) return false;
  const m = v as Record<string, unknown>;
  return (
    typeof m.count === "number" &&
    Array.isArray(m.formats) &&
    Array.isArray(m.sizeBuckets)
  );
}

/** Create one cloud history entry for the caller (explicit save). */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const error = validateInput(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const input = body as HistoryInput;
  const entry = await createHistory(auth.user.id, input);
  return NextResponse.json({ entry }, { status: 201 });
}
