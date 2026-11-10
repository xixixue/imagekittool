"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { BatchToolPreview } from "@/components/tools/batch-tool-preview";
import { DownloadButtons } from "@/components/upload/download-buttons";
import { DropZone } from "@/components/upload/drop-zone";
import { FileList } from "@/components/upload/file-list";
import type { DecodedImage, ImageFormat, ProcessResult } from "@/features/image-processing";
import type { OperationType } from "@/features/cloud-storage/types";
import { useImageToolWorkspace } from "@/hooks/use-image-tool-workspace";

/** Draws the processed result into a sized canvas — shared by export and preview. */
export type ComposeFn<O> = (
  ctx: CanvasRenderingContext2D,
  bitmap: CanvasImageSource,
  width: number,
  height: number,
  options: O,
) => void;

interface ImageToolWorkspaceProps<O> {
  processFn: (image: DecodedImage, options: O) => Promise<ProcessResult>;
  defaultOptions: O;
  /** Render tool-specific parameter controls. */
  renderParams: (options: O, setOptions: (o: O) => void, disabled: boolean) => ReactNode;
  processLabel?: string;
  zipName?: string;
  /** When provided, a live preview of the first image is rendered above the params. */
  composePreview?: ComposeFn<O>;
  /** Output size for given source dims + options (e.g. rotated size). Defaults to source size. */
  previewSize?: (srcW: number, srcH: number, options: O) => { width: number; height: number };
  /** Scale size-dependent option fields (fontSize, margin, …) with the preview canvas. */
  scalePreviewOptions?: (options: O, scale: number) => O;
  /** The tool identity — tags saved results with their origin (shown in cloud files). */
  operation: OperationType;
}

/**
 * Generic workspace shared by the batch tools (compress, resize, convert,
 * compress-to-KB, rotate, watermark, meme). Composes drop-zone, optional live
 * preview, params, process button, file list and downloads. All processing
 * stays in the browser.
 */
export function ImageToolWorkspace<O>(props: ImageToolWorkspaceProps<O>) {
  const t = useTranslations("Workspace");
  const workspace = useImageToolWorkspace(props.processFn, props.operation);
  const [options, setOptions] = useState<O>(props.defaultOptions);

  const first = workspace.items.find((it) => it.originalFormat);
  const showPreview = Boolean(props.composePreview && first);
  const params = props.renderParams(options, setOptions, workspace.isProcessing);

  return (
    <div className="space-y-6">
      <DropZone onFiles={workspace.addFiles} disabled={workspace.isProcessing} />

      {showPreview && first && props.composePreview ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <BatchToolPreview<O>
            file={first.file}
            format={first.originalFormat as ImageFormat}
            options={options}
            compose={props.composePreview}
            previewSize={props.previewSize}
            scaleOptions={props.scalePreviewOptions}
          />
          <div>{params}</div>
        </div>
      ) : (
        params
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => workspace.processAll(options)}
          disabled={!workspace.canProcess}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow disabled:opacity-50 disabled:shadow-none"
        >
          {workspace.isProcessing
            ? t("processing", {
                done: workspace.progress.done,
                total: workspace.progress.total,
              })
            : (props.processLabel ?? t("process"))}
        </button>
        {workspace.pendingCount > 0 && !workspace.isProcessing && (
          <span className="text-sm text-muted-foreground">
            {t("ready", { count: workspace.pendingCount })}
          </span>
        )}
        {workspace.batchError && (
          <span className="text-sm text-destructive">{workspace.batchError}</span>
        )}
      </div>

      <FileList
        items={workspace.items}
        onDownload={workspace.downloadOne}
        onRemove={workspace.removeFile}
        operation={props.operation}
      />

      {workspace.hasResults && (
        <DownloadButtons
          onDownloadZip={() => workspace.downloadZip(props.zipName)}
          onClear={workspace.clearAll}
          disabled={workspace.isProcessing}
          count={workspace.doneCount}
        />
      )}
    </div>
  );
}
