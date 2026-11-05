import { prisma } from "@/lib/db/prisma";
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  ALLOWED_UPLOAD_MIME,
  FILE_CATEGORIES,
  MAX_UPLOAD_BYTES,
  PRESIGN_TTL_SECONDS,
  UPLOAD_TASK_TTL_MS,
  type FileCategory,
} from "@/lib/config/quota";
import { confirmReserved, releaseReserved, reserveQuota } from "@/features/quota/quota";
import { generateIdempotencyKey, generateObjectKey, getStorageAdapter } from "@/lib/storage";
import { OPERATION_TYPES, type OperationType, type UploadHandle } from "./types";

/** MIME → extension fallback when the filename has no usable extension. */
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface CreateUploadInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  operationType?: OperationType;
}

export type ValidationResult =
  | { ok: true; extension: string; category: FileCategory; operationType: OperationType | null }
  | { ok: false; error: string };

/**
 * Pure validation of an upload request (SPEC §7.3 step 3: validate identity,
 * quota, size and type). Extracted so it is unit-testable without a database.
 */
export function validateUploadInput(input: CreateUploadInput): ValidationResult {
  const { fileName, mimeType, sizeBytes, category } = input;

  if (!fileName || typeof fileName !== "string") {
    return { ok: false, error: "File name is required." };
  }
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, error: "Invalid file size." };
  }
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `File exceeds the ${MAX_UPLOAD_BYTES} byte limit.` };
  }
  const mime = ALLOWED_UPLOAD_MIME.find((m) => m === mimeType);
  if (!mime) {
    return { ok: false, error: "Unsupported file type. Only JPG, PNG and WebP are allowed." };
  }
  if (!FILE_CATEGORIES.includes(category as FileCategory)) {
    return { ok: false, error: "Invalid file category." };
  }

  // operationType is optional (originals have none); when present it must be a
  // known tool so the files list can badge the file by origin.
  let operationType: OperationType | null = null;
  if (input.operationType) {
    if (!OPERATION_TYPES.includes(input.operationType)) {
      return { ok: false, error: "Invalid operation type." };
    }
    operationType = input.operationType;
  }

  const lower = fileName.toLowerCase();
  const dot = lower.lastIndexOf(".");
  const fromName = dot > 0 ? lower.slice(dot + 1) : "";
  const ext =
    ALLOWED_UPLOAD_EXTENSIONS.includes(fromName as never) ? fromName : (MIME_EXT[mime] ?? "");
  if (!ext) {
    return { ok: false, error: "Could not determine file extension." };
  }

  return { ok: true, extension: ext, category: category as FileCategory, operationType };
}

/**
 * Create an upload task: validate, reserve quota, mint a presigned PUT URL.
 * The browser then PUTs the object body directly to storage and calls
 * completeUpload (SPEC §7.3).
 */
export async function createUploadTask(
  userId: string,
  input: CreateUploadInput,
): Promise<UploadHandle> {
  const validation = validateUploadInput(input);
  if (!validation.ok) {
    throw new ValidationError(validation.error);
  }
  const { extension, category, operationType } = validation;
  const adapter = getStorageAdapter();
  if (!adapter) {
    throw new ValidationError("Cloud storage is not available.");
  }

  const objectKey = generateObjectKey();
  // Reserve quota first; if it fails, nothing else is created.
  await reserveQuota(userId, input.sizeBytes);

  try {
    const file = await prisma.storageFile.create({
      data: {
        userId,
        objectKey,
        originalName: input.fileName,
        mimeType: input.mimeType,
        extension,
        sizeBytes: input.sizeBytes,
        category,
        operationType,
        status: "PENDING_UPLOAD",
      },
    });
    const task = await prisma.uploadTask.create({
      data: {
        userId,
        fileId: file.id,
        objectKey,
        expectedSizeBytes: input.sizeBytes,
        reservedBytes: input.sizeBytes,
        status: "PENDING_UPLOAD",
        expiresAt: new Date(Date.now() + UPLOAD_TASK_TTL_MS),
        idempotencyKey: generateIdempotencyKey(),
      },
    });

    const put = await adapter.presignPut(
      objectKey,
      input.mimeType,
      input.sizeBytes,
      PRESIGN_TTL_SECONDS,
    );

    return {
      uploadId: task.id,
      fileId: file.id,
      objectKey,
      uploadUrl: put.url,
      method: put.method,
      headers: put.headers,
      expiresIn: put.expiresIn,
    };
  } catch (err) {
    // Roll back the reservation if task/file creation or presigning failed.
    await releaseReserved(userId, input.sizeBytes).catch(() => undefined);
    throw err;
  }
}

/**
 * Confirm an upload: verify the object exists with the expected size, then move
 * reserved quota to used and mark the file READY. Idempotent — a task already
 * READY returns the current state without re-charging quota (SPEC §7.5).
 */
export async function completeUpload(
  userId: string,
  uploadId: string,
): Promise<{ fileId: string; status: string }> {
  const task = await prisma.uploadTask.findUnique({ where: { id: uploadId } });
  if (!task || task.userId !== userId) {
    throw new NotFoundError("Upload not found.");
  }
  if (task.status === "READY") {
    return { fileId: task.fileId ?? "", status: "READY" };
  }
  if (task.status !== "PENDING_UPLOAD" && task.status !== "UPLOADING") {
    throw new ConflictError(`Upload cannot be completed (status: ${task.status}).`);
  }

  const adapter = getStorageAdapter();
  if (!adapter) {
    throw new ConflictError("Cloud storage is not available.");
  }

  const head = await adapter.head(task.objectKey);
  if (!head) {
    await markFailed(task, "Object not found after upload.");
    throw new ConflictError("Uploaded object not found.");
  }
  if (head.size !== task.expectedSizeBytes) {
    await adapter.delete(task.objectKey).catch(() => undefined);
    await markFailed(task, `Size mismatch: expected ${task.expectedSizeBytes}, got ${head.size}.`);
    throw new ConflictError("Uploaded object size does not match.");
  }

  // Move reserved → used, then finalize the file/task rows.
  await confirmReserved(userId, task.reservedBytes);
  await prisma.storageFile.update({ where: { id: task.fileId ?? "" }, data: { status: "READY" } });
  await prisma.uploadTask.update({ where: { id: task.id }, data: { status: "READY" } });
  return { fileId: task.fileId ?? "", status: "READY" };
}

/** Mark an upload failed; release its reserved quota and delete the orphan. */
export async function failUpload(
  userId: string,
  uploadId: string,
): Promise<{ status: string }> {
  const task = await prisma.uploadTask.findUnique({ where: { id: uploadId } });
  if (!task || task.userId !== userId) {
    throw new NotFoundError("Upload not found.");
  }
  if (task.status === "READY") {
    return { status: "READY" }; // idempotent
  }
  await markFailed(task, "Reported failed by client.");
  return { status: "FAILED" };
}

async function markFailed(
  task: { id: string; userId: string; objectKey: string; reservedBytes: number; fileId: string | null },
  _reason: string,
): Promise<void> {
  const adapter = getStorageAdapter();
  await adapter?.delete(task.objectKey).catch(() => undefined);
  await prisma.uploadTask.update({ where: { id: task.id }, data: { status: "FAILED" } });
  await releaseReserved(task.userId, task.reservedBytes).catch(() => undefined);
  if (task.fileId) {
    await prisma.storageFile
      .update({ where: { id: task.fileId }, data: { status: "FAILED" } })
      .catch(() => undefined);
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}
