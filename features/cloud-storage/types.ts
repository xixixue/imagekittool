/** Shared response shapes for the cloud-storage API (SPEC §11). */

/**
 * The tool/operation that produced a PROCESSED cloud file (SPEC §6.2). Stored
 * on the StorageFile row so the files list can badge each file by origin.
 * `null` for originals and any file saved before this field existed.
 */
export const OPERATION_TYPES = [
  "compress",
  "resize",
  "convert",
  "rotate",
  "watermark",
  "meme",
  "other",
] as const;
export type OperationType = (typeof OPERATION_TYPES)[number];

export interface UploadHandle {
  uploadId: string;
  fileId: string;
  objectKey: string;
  uploadUrl: string;
  method: "PUT";
  headers: Record<string, string>;
  expiresIn: number;
}

export interface CloudFileMeta {
  id: string;
  originalName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  category: string;
  operationType: OperationType | null;
  status: string;
  createdAt: string;
  /** Short-lived presigned GET URL for image files (for list thumbnails). */
  thumbnailUrl?: string;
}

export interface StorageUsageResponse {
  quotaBytes: number;
  usedBytes: number;
  reservedBytes: number;
  availableBytes: number;
}
