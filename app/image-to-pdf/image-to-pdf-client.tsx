"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DropZone } from "@/components/upload/drop-zone";
import { validateImageFile, type ImageFormat } from "@/features/image-processing";
import type { ImageToPdfOptions, PdfImageInput } from "@/features/pdf";
import { triggerDownload } from "@/lib/download";

interface Item {
  id: string;
  name: string;
  bytes: Uint8Array;
  format: "jpeg" | "png";
  url: string;
}

let seq = 0;

/**
 * Image to PDF (SPEC V2 §4.2 P0). Combine multiple images into one PDF in the
 * browser with pdf-lib — one image per page, with page size, orientation and
 * margins. Images can be reordered before generating. Nothing is uploaded.
 */
export function ImageToPdfClient() {
  const tC = useTranslations("Controls");
  const [items, setItems] = useState<Item[]>([]);
  const [opts, setOpts] = useState<ImageToPdfOptions>({
    pageSize: "a4",
    orientation: "auto",
    margin: "medium",
  });
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;

  useEffect(
    () => () => {
      itemsRef.current.forEach((it) => URL.revokeObjectURL(it.url));
    },
    [],
  );

  const onFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const added: Item[] = [];
      for (const f of Array.from(files)) {
        const v = await validateImageFile(f);
        if (!v.ok || !v.format) {
          setError(v.error ?? tC("unsupportedFile"));
          continue;
        }
        const fmt = v.format as ImageFormat;
        if (fmt !== "jpeg" && fmt !== "png") {
          setError(tC("pdfPngJpegOnly"));
          continue;
        }
        added.push({
          id: `img-${++seq}`,
          name: f.name,
          bytes: new Uint8Array(await f.arrayBuffer()),
          format: fmt as "jpeg" | "png",
          url: URL.createObjectURL(f),
        });
      }
      if (added.length) setItems((prev) => [...prev, ...added]);
    },
    [tC],
  );

  const move = useCallback((id: string, dir: -1 | 1) => {
    setItems((prev) => {
      const i = prev.findIndex((it) => it.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const it = prev.find((p) => p.id === id);
      if (it) URL.revokeObjectURL(it.url);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    itemsRef.current.forEach((it) => URL.revokeObjectURL(it.url));
    setItems([]);
    setError(null);
  }, []);

  const onGenerate = useCallback(async () => {
    if (items.length === 0) return;
    setWorking(true);
    setError(null);
    try {
      const inputs: PdfImageInput[] = items.map((it) => ({ bytes: it.bytes, format: it.format }));
      // Lazy-load pdf-lib (and the build module) only when generating, so the
      // ~175KB PDF library stays out of the page's initial bundle.
      const { buildPdfFromImages } = await import("@/features/pdf");
      const pdfBytes = await buildPdfFromImages(inputs, opts);
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      triggerDownload(blob, "images.pdf");
    } catch (e) {
      setError(e instanceof Error ? e.message : tC("exportFailed"));
    } finally {
      setWorking(false);
    }
  }, [items, opts, tC]);

  return (
    <div className="space-y-6">
      <DropZone onFiles={onFiles} multiple />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tC("pdfEmpty")}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{tC("pdfCount", { count: items.length })}</span>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              {tC("pdfClearAll")}
            </button>
          </div>

          {/* Options */}
          <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-sm sm:grid-cols-3">
            <label className="text-sm">
              <span className="block font-medium">{tC("pdfPageSize")}</span>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"
                value={opts.pageSize}
                onChange={(e) => setOpts((o) => ({ ...o, pageSize: e.target.value as ImageToPdfOptions["pageSize"] }))}
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="block font-medium">{tC("pdfOrientation")}</span>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"
                value={opts.orientation}
                onChange={(e) => setOpts((o) => ({ ...o, orientation: e.target.value as ImageToPdfOptions["orientation"] }))}
              >
                <option value="auto">Auto</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="block font-medium">{tC("pdfMargin")}</span>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"
                value={opts.margin}
                onChange={(e) => setOpts((o) => ({ ...o, margin: e.target.value as ImageToPdfOptions["margin"] }))}
              >
                <option value="none">None</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>
          </div>

          {/* Reorderable list */}
          <ol className="space-y-2">
            {items.map((it, i) => (
              <li
                key={it.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt={it.name} className="h-12 w-12 rounded object-cover" />
                <span className="flex-1 truncate text-sm">{it.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(it.id, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="rounded p-1.5 text-sm hover:bg-muted disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(it.id, 1)}
                    disabled={i === items.length - 1}
                    aria-label="Move down"
                    className="rounded p-1.5 text-sm hover:bg-muted disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(it.id)}
                    className="rounded p-1.5 text-sm text-destructive hover:bg-muted"
                  >
                    {tC("pdfRemove")}
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={onGenerate}
            disabled={working || items.length === 0}
            className="w-full rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {working ? tC("pdfGenerating") : tC("pdfGenerate")}
          </button>
        </div>
      )}
    </div>
  );
}
