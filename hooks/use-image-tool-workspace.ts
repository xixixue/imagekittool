"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  LIMITS,
  ProcessingError,
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
import { track } from "@/lib/analytics/track";
import { AnalyticsEvent, durationBucket, fileCountBucket, sanitizeError } from "@/lib/analytics/events";

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
  toolId?: string,
) {
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<Progress>({ done: 0, total: 0 });
  const [batchError, setBatchError] = useState<string | null>(null);
  // Translator is read through a ref so useCallback deps stay stable (the
  // translator identity can change on locale switch) while messages stay fresh.
  const t = useTranslations("Workspace");
  const tRef = useRef(t);
  tRef.current = t;

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
      setBatchError(tRef.current("errors.tooManyFiles", { limit: LIMITS.maxBatchFiles }));
      return;
    }
    const accepted = incoming.slice(0, room);
    if (accepted.length < incoming.length) {
      setBatchError(
        tRef.current("errors.partialBatchAdded", {
          accepted: accepted.length,
          limit: LIMITS.maxBatchFiles,
        }),
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
        error: result.code ? tRef.current(`errors.${result.code}`, result.params) : result.error,
        previewUrl,
        originalSize: file.size,
        originalFormat: result.format,
      });
    }
    setItems((prev) => [...prev, ...validated]);
    if (validated.length > 0) {
      track(AnalyticsEvent.fileSelected, {
        tool_id: toolId,
        file_count: fileCountBucket(validated.length),
      });
    }
  }, [toolId]);

  const processAll = useCallback(
    async (options: O) => {
      const pending = itemsRef.current.filter(
        (it) => it.status === "pending" || it.status === "error" || it.status === "invalid",
      );
      // Only valid items can be processed.
      const processable = pending.filter((it) => it.originalFormat);
      if (processable.length === 0) {
        setBatchError(tRef.current("errors.addAtLeastOne"));
        return;
      }
      setBatchError(null);
      setIsProcessing(true);
      setProgress({ done: 0, total: processable.length });

      const startedAt = Date.now();
      let failedCount = 0;
      track(AnalyticsEvent.batchStarted, {
        tool_id: toolId,
        file_count: fileCountBucket(processable.length),
      });

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
          failedCount += 1;
          const message =
            err instanceof ProcessingError
              ? tRef.current(`errors.${err.code}`, err.params)
              : err instanceof Error
                ? err.message
                : tRef.current("errors.processingFailed");
          track(AnalyticsEvent.processingFailed, {
            tool_id: toolId,
            error_code: err instanceof ProcessingError ? err.code : sanitizeError(err),
          });
          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, status: "error", error: message } : it)),
          );
        }
        done += 1;
        setProgress({ done, total: processable.length });
      });

      track(AnalyticsEvent.batchCompleted, {
        tool_id: toolId,
        file_count: fileCountBucket(processable.length),
        duration: durationBucket(Date.now() - startedAt),
        had_errors: failedCount > 0,
      });
      setIsProcessing(false);
    },
    [processFn, toolId],
  );

  const downloadOne = useCallback((id: string) => {
    const item = itemsRef.current.find((it) => it.id === id);
    if (!item?.result) return;
    triggerDownload(item.result.blob, item.result.filename);
    track(AnalyticsEvent.downloadClicked, { tool_id: toolId, method: "single" });
  }, [toolId]);

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
    track(AnalyticsEvent.downloadClicked, {
      tool_id: toolId,
      method: "zip",
      file_count: fileCountBucket(doneItems.length),
    });
  }, [toolId]);

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
