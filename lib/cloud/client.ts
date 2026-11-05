/**
 * Client-side cloud upload helper. Orchestrates the browser-direct upload flow
 * (SPEC §7.3): create task → PUT body to the presigned URL → confirm.
 * No image bytes ever touch the app API — they go straight to (mock/S3) storage.
 */
import type { OperationType } from "@/features/cloud-storage/types";

export interface UploadToCloudInput {
  fileName: string;
  mimeType: string;
  category: "ORIGINAL" | "PROCESSED" | "OTHER";
  /** Tag a PROCESSED file with the tool that produced it (shown in the files list). */
  operationType?: OperationType;
}

export async function uploadToCloud(
  blob: Blob,
  input: UploadToCloudInput,
): Promise<{ fileId: string }> {
  const create = await fetch("/api/cloud/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: blob.size,
      category: input.category,
      operationType: input.operationType,
    }),
  });
  if (!create.ok) {
    const data = await create.json().catch(() => ({}));
    throw new Error(data.error ?? "Could not start upload.");
  }
  const handle = await create.json();

  // Browser direct PUT to the presigned object-storage URL.
  const put = await fetch(handle.uploadUrl, {
    method: "PUT",
    body: blob,
    headers: handle.headers,
  });
  if (!put.ok) {
    await fetch(`/api/cloud/uploads/${handle.uploadId}/fail`, { method: "POST" }).catch(
      () => undefined,
    );
    throw new Error("Upload transfer failed.");
  }

  const complete = await fetch(`/api/cloud/uploads/${handle.uploadId}/complete`, {
    method: "POST",
  });
  if (!complete.ok) {
    const data = await complete.json().catch(() => ({}));
    throw new Error(data.error ?? "Upload confirmation failed.");
  }
  const result = await complete.json();
  return { fileId: result.fileId as string };
}
