/** Shared response shapes for the cloud-storage API (SPEC §11). */

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
  status: string;
  createdAt: string;
}

export interface StorageUsageResponse {
  quotaBytes: number;
  usedBytes: number;
  reservedBytes: number;
  availableBytes: number;
}
