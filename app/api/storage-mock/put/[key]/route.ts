import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getStorageAdapter } from "@/lib/storage";
import { MockStorageAdapter } from "@/lib/storage/mock-adapter";

// Dev-only mock object-storage receive endpoint. The browser PUTs the object
// body here (same-origin) exactly as it would PUT to a real presigned S3 URL.
// Node runtime (uses fs). Not exported to Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Receives a browser-direct PUT for an in-flight upload task. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const adapter = getStorageAdapter();
  if (!(adapter instanceof MockStorageAdapter)) {
    return NextResponse.json({ error: "Mock storage not active." }, { status: 404 });
  }

  // Capability check: the key must belong to a pending/in-flight upload task
  // (keys are server-generated random capabilities).
  const task = await prisma.uploadTask.findFirst({
    where: { objectKey: key, status: { in: ["PENDING_UPLOAD", "UPLOADING"] } },
  });
  if (!task) {
    return NextResponse.json({ error: "Unknown or expired upload." }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "application/octet-stream";
  const body = Buffer.from(await request.arrayBuffer());
  await adapter.putObject(key, body, contentType);
  await prisma.uploadTask.update({
    where: { id: task.id },
    data: { status: "UPLOADING" },
  });
  return new NextResponse(null, { status: 200 });
}
