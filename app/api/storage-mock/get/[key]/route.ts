import { NextResponse } from "next/server";
import { getStorageAdapter } from "@/lib/storage";
import { MockStorageAdapter } from "@/lib/storage/mock-adapter";

// Dev-only mock object-storage read endpoint. Ownership was already verified by
// the download-url API before this URL was minted; the key is an unguessable
// server-generated capability. Node runtime (uses fs).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Streams an object to the browser via a presigned GET URL. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const adapter = getStorageAdapter();
  if (!(adapter instanceof MockStorageAdapter)) {
    return NextResponse.json({ error: "Mock storage not active." }, { status: 404 });
  }
  try {
    const { body, contentType } = await adapter.readObject(key);
    return new NextResponse(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": contentType ?? "application/octet-stream",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Object not found." }, { status: 404 });
  }
}
