"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DropZone } from "@/components/upload/drop-zone";
import { startBatch, type BatchHandle } from "@/features/batch-engine/scheduler";
import type { BatchItem } from "@/features/batch-engine/state";
import {
  applySteps,
  effectiveSteps,
  validatePipeline,
  type BatchStep,
  type BatchStepType,
  type RenameStepParams,
} from "@/features/batch-engine/steps";
import type { ImageFormat, ProcessResult } from "@/features/image-processing";
import { triggerDownload } from "@/lib/download";

interface BatchFile {
  id: string;
  file: File;
  name: string;
  size: number;
  thumbUrl: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  error?: string;
  result?: { url: string; filename: string };
  /** Per-step param overrides (keyed by step index) for this file (§5.4). */
  overrides: Record<number, Partial<BatchStep["params"]>>;
}

const STEP_TYPES: BatchStepType[] = [
  "resize",
  "convert",
  "compress",
  "watermark",
  "rotate",
  "rename",
];

function defaultStep(type: BatchStepType): BatchStep {
  switch (type) {
    case "resize":
      return { type, params: { targetWidth: 800, lockAspect: true } };
    case "convert":
      return { type, params: { format: "webp" } };
    case "compress":
      return { type, params: { quality: 0.7 } };
    case "watermark":
      return {
        type,
        params: {
          text: "© Your Name",
          fontSize: 24,
          color: "#ffffff",
          opacity: 0.5,
          position: "bottom-right",
          angle: 0,
          repeat: false,
          margin: 8,
        },
      };
    case "rotate":
      return { type, params: { angle: 90 } };
    case "rename":
      return { type, params: { pattern: "batch-{n}" } };
  }
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Batch Workspace (SPEC V2 §5, Phase 3). A multi-file, multi-step processing
 * workspace. Files are processed locally in a concurrency-limited queue; one
 * failure never stops the batch. Guest use — no login wall.
 */
export function BatchWorkspaceClient() {
  const tC = useTranslations("Controls");
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [steps, setSteps] = useState<BatchStep[]>([]);
  const [pendingType, setPendingType] = useState<BatchStepType>("resize");
  const [concurrency, setConcurrency] = useState(2);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const handleRef = useRef<BatchHandle<File, ProcessResult> | null>(null);
  const urlsRef = useRef<string[]>([]);
  urlsRef.current = [
    ...files.map((f) => f.thumbUrl),
    ...files.map((f) => f.result?.url ?? ""),
  ].filter(Boolean);

  useEffect(
    () => () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  const onFiles = useCallback((incoming: FileList | File[]) => {
    setError(null);
    const next: BatchFile[] = [];
    for (const file of Array.from(incoming)) {
      if (!IMAGE_TYPES.includes(file.type)) continue;
      if (file.size > MAX_BYTES) continue;
      next.push({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        name: file.name,
        size: file.size,
        thumbUrl: URL.createObjectURL(file),
        status: "queued",
        overrides: {},
      });
    }
    if (next.length) setFiles((prev) => [...prev, ...next]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) {
        URL.revokeObjectURL(target.thumbUrl);
        if (target.result) URL.revokeObjectURL(target.result.url);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    setFiles((prev) => {
      prev.forEach((f) => {
        URL.revokeObjectURL(f.thumbUrl);
        if (f.result) URL.revokeObjectURL(f.result.url);
      });
      return [];
    });
    setError(null);
  }, []);

  const moveFile = useCallback((id: string, dir: -1 | 1) => {
    setFiles((prev) => {
      const i = prev.findIndex((f) => f.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const addStep = useCallback(() => {
    setSteps((prev) => [...prev, defaultStep(pendingType)]);
  }, [pendingType]);

  const removeStep = useCallback((idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const moveStep = useCallback((idx: number, dir: -1 | 1) => {
    setSteps((prev) => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }, []);

  const updateStep = useCallback((idx: number, patch: Partial<BatchStep["params"]>) => {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === idx ? ({ ...s, params: { ...s.params, ...patch } } as BatchStep) : s,
      ),
    );
  }, []);

  /** Set a per-file override for one step (§5.4 per-file param override). */
  const setOverride = useCallback(
    (fileId: string, idx: number, patch: Partial<BatchStep["params"]>) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                overrides: {
                  ...f.overrides,
                  [idx]: { ...f.overrides[idx], ...patch },
                },
              }
            : f,
        ),
      );
    },
    [],
  );

  const completed = useMemo(() => files.filter((f) => f.status === "completed"), [files]);

  const onProcess = useCallback(() => {
    if (files.length === 0) return;
    const stepErrs = validatePipeline(steps);
    if (stepErrs.length) {
      setError(tC("batchInvalid"));
      return;
    }
    setError(null);
    setRunning(true);
    // Reset all to queued, drop stale results.
    setFiles((prev) =>
      prev.map((f) => {
        if (f.result) URL.revokeObjectURL(f.result.url);
        return { ...f, status: "queued", error: undefined, result: undefined };
      }),
    );

    const items: BatchItem<File, ProcessResult>[] = files.map((f) => ({
      id: f.id,
      input: f.file,
      status: "queued" as const,
    }));
    // Per-file param overrides (§5.4): each file may override specific steps.
    const overridesMap = new Map(files.map((f) => [f.id, f.overrides]));

    const runner = async (item: BatchItem<File, ProcessResult>, signal: AbortSignal) => {
      const eff = effectiveSteps(steps, overridesMap.get(item.id) ?? {});
      const result = await applySteps(item.input, eff, {
        signal,
        index: items.indexOf(item),
      });
      return result;
    };

    const handle = startBatch(items, runner, {
      concurrency,
      onUpdate: (next) => {
        setFiles((prev) => {
          const byId = new Map(next.map((it) => [it.id, it]));
          return prev.map((f) => {
            const it = byId.get(f.id);
            if (!it) return f;
            const result =
              it.status === "completed" && it.result
                ? { url: URL.createObjectURL(it.result.blob), filename: it.result.filename }
                : f.result;
            return { ...f, status: it.status, error: it.error, result };
          });
        });
      },
    });
    handleRef.current = handle;
    handle.done
      .catch(() => undefined)
      .finally(() => {
        setRunning(false);
        handleRef.current = null;
      });
  }, [files, steps, concurrency, tC]);

  const onCancel = useCallback(() => {
    handleRef.current?.cancel();
  }, []);

  const onDownloadZip = useCallback(async () => {
    if (completed.length === 0) return;
    const { zipSync } = await import("fflate");
    const zipped: Record<string, Uint8Array> = {};
    for (const f of completed) {
      if (!f.result) continue;
      const bytes = new Uint8Array(await (await fetch(f.result.url)).arrayBuffer());
      zipped[f.result.filename] = bytes;
    }
    triggerDownload(new Blob([zipSync(zipped)], { type: "application/zip" }), "batch-results.zip");
  }, [completed]);

  return (
    <div className="space-y-6">
      <DropZone onFiles={onFiles} />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {files.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {tC("batchCount", { count: files.length })}
          </span>
          <button
            type="button"
            onClick={clearAll}
            disabled={running}
            className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-50"
          >
            {tC("batchClearAll")}
          </button>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li key={f.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.thumbUrl} alt="" className="h-10 w-10 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(f.size / 1024).toFixed(0)} KB · <span className="capitalize">{f.status}</span>
                    {f.error ? ` · ${f.error}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveFile(f.id, -1)} disabled={i === 0 || running} className="rounded px-2 py-1 text-sm hover:bg-muted disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => moveFile(f.id, 1)} disabled={i === files.length - 1 || running} className="rounded px-2 py-1 text-sm hover:bg-muted disabled:opacity-30">↓</button>
                  {steps.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                      disabled={running}
                      className="rounded border border-border px-2 py-1 text-sm hover:bg-muted disabled:opacity-30"
                    >
                      {tC("batchEditParams")}
                    </button>
                  )}
                  {f.result && (
                    <a href={f.result.url} download={f.result.filename} className="rounded border border-border px-2 py-1 text-sm hover:bg-muted">
                      {tC("batchDownload")}
                    </a>
                  )}
                  <button type="button" onClick={() => removeFile(f.id)} disabled={running} className="rounded px-2 py-1 text-sm text-destructive hover:bg-muted disabled:opacity-30">
                    {tC("batchRemove")}
                  </button>
                </div>
              </div>
              {expandedId === f.id && steps.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    Per-file step params — override the global settings for this file.
                  </p>
                  {steps.map((step, idx) => {
                    const merged = {
                      ...step,
                      params: { ...step.params, ...f.overrides[idx] },
                    } as BatchStep;
                    return (
                      <div key={idx} className="rounded border border-border p-2">
                        <p className="mb-1 text-xs font-medium capitalize">{step.type}</p>
                        <StepParamsFields
                          step={merged}
                          onChange={(patch) => setOverride(f.id, idx, patch)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Step builder */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="mb-3 text-sm font-medium">{tC("batchSteps")}</p>
        {steps.length === 0 && (
          <p className="text-sm text-muted-foreground">{tC("batchNoSteps")}</p>
        )}
        <ol className="space-y-3">
          {steps.map((step, idx) => (
            <li key={idx} className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{step.type}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => moveStep(idx, -1)} disabled={idx === 0 || running} className="rounded px-2 py-0.5 text-xs hover:bg-muted disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1 || running} className="rounded px-2 py-0.5 text-xs hover:bg-muted disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => removeStep(idx)} disabled={running} className="rounded px-2 py-0.5 text-xs text-destructive hover:bg-muted disabled:opacity-30">✕</button>
                </div>
              </div>
              <StepParamsFields step={step} onChange={(patch) => updateStep(idx, patch)} />
            </li>
          ))}
        </ol>
        <div className="mt-3 flex items-center gap-2">
          <select
            value={pendingType}
            onChange={(e) => setPendingType(e.target.value as BatchStepType)}
            disabled={running}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            {STEP_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
          <button type="button" onClick={addStep} disabled={running} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50">
            {tC("batchAddStep")}
          </button>
        </div>
      </div>

      {/* Process controls */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          <span className="mr-2 text-muted-foreground">{tC("batchConcurrency")}</span>
          <select
            value={concurrency}
            onChange={(e) => setConcurrency(Number(e.target.value))}
            disabled={running}
            className="rounded-md border border-border bg-background px-2 py-1.5"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </label>
        <button
          type="button"
          onClick={onProcess}
          disabled={running || files.length === 0 || steps.length === 0}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {running ? tC("batchProcessing") : tC("batchProcess")}
        </button>
        {running && (
          <button type="button" onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
            {tC("batchCancel")}
          </button>
        )}
        {completed.length > 0 && (
          <button type="button" onClick={onDownloadZip} className="ml-auto rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
            {tC("batchDownloadZip")}
          </button>
        )}
      </div>
    </div>
  );
}

/** Inline param fields per step type (technical labels, EN — i18n follow-up). */
function StepParamsFields({
  step,
  onChange,
}: {
  step: BatchStep;
  onChange: (patch: Partial<BatchStep["params"]>) => void;
}) {
  const p = step.params;
  switch (step.type) {
    case "resize":
      return (
        <div className="flex flex-wrap gap-3 text-sm">
          <NumField label="Width" value={(p as { targetWidth?: number }).targetWidth} onChange={(v) => onChange({ targetWidth: v })} />
          <NumField label="Height" value={(p as { targetHeight?: number }).targetHeight} onChange={(v) => onChange({ targetHeight: v })} />
          <NumField label="Percent" value={(p as { percent?: number }).percent} onChange={(v) => onChange({ percent: v })} />
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={(p as { lockAspect: boolean }).lockAspect} onChange={(e) => onChange({ lockAspect: e.target.checked })} />
            Lock aspect
          </label>
        </div>
      );
    case "convert":
      return (
        <label className="text-sm">
          Format{" "}
          <select
            value={(p as { format: string }).format}
            onChange={(e) => onChange({ format: e.target.value as ImageFormat })}
            className="ml-1 rounded border border-border bg-background px-2 py-1"
          >
            <option value="jpeg">JPG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </label>
      );
    case "compress":
      return (
        <label className="text-sm">
          Quality{" "}
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={(p as { quality: number }).quality}
            onChange={(e) => onChange({ quality: Number(e.target.value) })}
          />
          <span className="ml-1">{Math.round((p as { quality: number }).quality * 100)}%</span>
        </label>
      );
    case "watermark": {
      const wp = p as Extract<BatchStep, { type: "watermark" }>["params"];
      return (
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <label>Text <input className="ml-1 w-full rounded border border-border bg-background px-2 py-1" value={wp.text} onChange={(e) => onChange({ text: e.target.value })} /></label>
          <label>Font size <input type="number" className="ml-1 w-20 rounded border border-border bg-background px-2 py-1" value={wp.fontSize} onChange={(e) => onChange({ fontSize: Number(e.target.value) })} /></label>
          <label>Color <input type="color" className="ml-1" value={wp.color} onChange={(e) => onChange({ color: e.target.value })} /></label>
          <label>Opacity <input type="range" min={0} max={1} step={0.05} value={wp.opacity} onChange={(e) => onChange({ opacity: Number(e.target.value) })} /></label>
          <label>Position
            <select className="ml-1 rounded border border-border bg-background px-2 py-1" value={wp.position} onChange={(e) => onChange({ position: e.target.value as never })}>
              {["top-left","top-center","top-right","middle-left","middle-center","middle-right","bottom-left","bottom-center","bottom-right"].map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label>Angle <input type="number" className="ml-1 w-20 rounded border border-border bg-background px-2 py-1" value={wp.angle} onChange={(e) => onChange({ angle: Number(e.target.value) })} /></label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={wp.repeat} onChange={(e) => onChange({ repeat: e.target.checked })} /> Repeat (tile)</label>
          <label>Margin <input type="number" className="ml-1 w-20 rounded border border-border bg-background px-2 py-1" value={wp.margin} onChange={(e) => onChange({ margin: Number(e.target.value) })} /></label>
        </div>
      );
    }
    case "rotate": {
      const rp = p as Extract<BatchStep, { type: "rotate" }>["params"];
      return (
        <div className="flex flex-wrap gap-3 text-sm">
          <label>Angle
            <select className="ml-1 rounded border border-border bg-background px-2 py-1" value={rp.angle} onChange={(e) => onChange({ angle: Number(e.target.value) as 0 | 90 | 180 | 270 })}>
              <option value={0}>0</option><option value={90}>90</option><option value={180}>180</option><option value={270}>270</option>
            </select>
          </label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={!!rp.flipH} onChange={(e) => onChange({ flipH: e.target.checked })} /> Flip H</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={!!rp.flipV} onChange={(e) => onChange({ flipV: e.target.checked })} /> Flip V</label>
        </div>
      );
    }
    case "rename":
      return (
        <label className="text-sm">
          Pattern{" "}
          <input className="ml-1 w-64 rounded border border-border bg-background px-2 py-1" value={(p as RenameStepParams).pattern} onChange={(e) => onChange({ pattern: e.target.value })} />
          <span className="ml-2 text-xs text-muted-foreground">{"{n} {name} {ext}"}</span>
        </label>
      );
  }
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label>
      {label}{" "}
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="w-20 rounded border border-border bg-background px-2 py-1"
      />
    </label>
  );
}
