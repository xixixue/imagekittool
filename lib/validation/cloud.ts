import { z } from "zod";

/** Body schema for POST /api/cloud/uploads (SPEC §11 upload create example). */
export const uploadCreateSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  category: z.enum(["ORIGINAL", "PROCESSED", "OTHER"]),
});

export type UploadCreateInput = z.infer<typeof uploadCreateSchema>;
