import { z } from "zod";
import { OPERATION_TYPES } from "@/features/cloud-storage/types";

/** Body schema for POST /api/cloud/uploads (SPEC §11 upload create example). */
export const uploadCreateSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  category: z.enum(["ORIGINAL", "PROCESSED", "OTHER"]),
  operationType: z.enum(OPERATION_TYPES).optional(),
});

export type UploadCreateInput = z.infer<typeof uploadCreateSchema>;
