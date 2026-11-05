"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LIMITS,
  type CompressToKbResult,
  type DecodedImage,
  type FileStatus,
  type ImageFormat,
  type ProcessResult,
  decodeToImage,
  releaseImage,
  validateImageFile,
} from "@/features/image-processing";
import { triggerDownload } from "@/lib/download";

export interface WorkspaceItem {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
  /** Object URL for the source preview. */
  previewUrl?: string;
  /** Object URL for the result preview. */
  outputPreviewUrl?: string;
  originalSize: number;
  originalFormat?: ImageFormat;
  originalWidth?: number;
  originalHeight?: number;
  result?: ProcessResult;
  /** Extra info from compress-to-KB (note / metTarget). */
  note?: string;
  metTarget?: boolean;
}

export interface Progress {
  done: number;
  total: number;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function revoke(url?: string) {
  if (url) URL.revokeObjectURL(url);
}

/** Run async tasks with a bounded concurrency limit. */
async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) break;
      await worker(next);
    }
  });
  await Promise.all(runners);
}

/**
 * Generic workspace hook shared by the batch tools (compress, resize, convert,
 * compress-to-KB). Handles validation, decoding, bounded-concurrency processing,
 * previews, single + ZIP downloads, and resource cleanup. All processing is
 * browser-local; nothing is uploaded.
 */
export function useImageToolWorkspace<O>(
  processFn: (image: DecodedImage, options: O) => Promise<ProcessResult>,
) {
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<Progress>({ done: 0, total: 0 });
  const [batchError, setBatchError] = useState<string | null>(null);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Revoke all object URLs on unmount.
  useEffect(() => {
    return () => {
      for (const it of itemsRef.current) {
        revoke(it.previewUrl);
        revoke(it.outputPreviewUrl);
      }
    };
  }, []);

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    setBatchError(null);
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const currentCount = itemsRef.current.length;
    const room = LIMITS.maxBatchFiles - currentCount;
    if (room <= 0) {
      setBatchError(`You can process at most ${LIMITS.maxBatchFiles} files at once.`);
      return;
    }
    const accepted = incoming.slice(0, room);
    if (accepted.length < incoming.length) {
      setBatchError(
        `Only the first ${accepted.length} file(s) were added (batch limit is ${LIMITS.maxBatchFiles}).`,
      );
    }

    const validated: WorkspaceItem[] = [];
    for (const file of accepted) {
      const result = await validateImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      validated.push({
        id: makeId(),
        file,
        status: result.ok ? "pending" : "invalid",
        error: result.error,
        previewUrl,
        originalSize: file.size,
        originalFormat: result.format,
      });
    }
    setItems((prev) => [...prev, ...validated]);
  }, []);

  const processAll = useCallback(
    async (options: O) => {
      const pending = itemsRef.current.filter(
        (it) => it.status === "pending" || it.status === "error" || it.status === "invalid",
      );
      // Only valid items can be processed.
      const processable = pending.filter((it) => it.originalFormat);
      if (processable.length === 0) {
        setBatchError("Add at least one supported image to process.");
        return;
      }
      setBatchError(null);
      setIsProcessing(true);
      setProgress({ done: 0, total: processable.length });

      setItems((prev) =>
        prev.map((it) =>
          it.originalFormat && (it.status === "pending" || it.status === "error")
            ? { ...it, status: "processing", error: undefined, result: undefined }
            : it,
        ),
      );

      let done = 0;
      await mapWithConcurrency(processable, LIMITS.maxConcurrency, async (item) => {
        try {
          const decoded = await decodeToImage(item.file, item.originalFormat!);
          let result: ProcessResult;
          try {
            result = await processFn(decoded, options);
          } finally {
            releaseImage(decoded);
          }
          const outputPreviewUrl = URL.createObjectURL(result.blob);
          const ckResult = result as CompressToKbResult;
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    status: "done",
                    result,
                    outputSize: result.sizeBytes,
                    outputPreviewUrl,
                    originalWidth: decoded.width,
                    originalHeight: decoded.height,
                    note: ckResult.note,
                    metTarget: ckResult.metTarget,
                  }
                : it,
            ),
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Processing failed.";
          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, status: "error", error: message } : it)),
          );
        }
        done += 1;
        setProgress({ done, total: processable.length });
      });

      setIsProcessing(false);
    },
    [processFn],
  );

  const downloadOne = useCallback((id: string) => {
    const item = itemsRef.current.find((it) => it.id === id);
    if (!item?.result) return;
    triggerDownload(item.result.blob, item.result.filename);
  }, []);

  const downloadZip = useCallback(async (zipName = "images.zip") => {
    const doneItems = itemsRef.current.filter((it) => it.result);
    if (doneItems.length === 0) return;
    const { zipSync } = await import("fflate");
    const files: Record<string, Uint8Array> = {};
    const used = new Set<string>();
    for (const it of doneItems) {
      let name = it.result!.filename;
      let n = 1;
      while (used.has(name)) {
        const dot = name.lastIndexOf(".");
        name = dot > 0 ? `${name.slice(0, dot)} (${n})${name.slice(dot)}` : `${name} (${n})`;
        n += 1;
      }
      used.add(name);
      files[name] = new Uint8Array(await it.result!.blob.arrayBuffer());
    }
    const zipped = zipSync(files);
    const blob = new Blob([zipped], { type: "application/zip" });
    triggerDownload(blob, zipName);
  }, []);

  const removeFile = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      revoke(target?.previewUrl);
      revoke(target?.outputPreviewUrl);
      return prev.filter((it) => it.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems((prev) => {
      for (const it of prev) {
        revoke(it.previewUrl);
        revoke(it.outputPreviewUrl);
      }
      return [];
    });
    setBatchError(null);
  }, []);

  const pendingCount = items.filter((it) => it.status === "pending" && it.originalFormat).length;
  const doneCount = items.filter((it) => it.status === "done").length;

  return {
    items,
    isProcessing,
    progress,
    batchError,
    canProcess: pendingCount > 0 && !isProcessing,
    hasResults: doneCount > 0,
    pendingCount,
    doneCount,
    addFiles,
    processAll,
    downloadOne,
    downloadZip,
    removeFile,
    clearAll,
  };
}

export type ImageToolWorkspace = ReturnType<typeof useImageToolWorkspace>;
