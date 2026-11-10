"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DropZone } from "@/components/upload/drop-zone";
import { parsePageRange } from "@/features/pdf/pages";
import { triggerDownload } from "@/lib/download";

interface PdfLoaded {
  name: string;
  bytes: Uint8Array;
  pages: number;
}

interface Rendered {
  pageNumber: number;
  url: string;
  blob: Blob;
  ext: string;
}

/**
 * PDF to Image (SPEC V2 §4.2 P0). Renders PDF pages to PNG or JPG in the
 * browser with pdf.js — page range, DPI, and ZIP download. The PDF is never
 * uploaded; the pdf.js worker is served locally.
 */
export function PdfToImageClient() {
  const tC = useTranslations("Controls");
  const [pdf, setPdf] = useState<PdfLoaded | null>(null);
  const [range, setRange] = useState("");
  const [dpi, setDpi] = useState(150);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [results, setResults] = useState<Rendered[]>([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlsRef = useRef<string[]>([]);
  urlsRef.current = results.map((r) => r.url);

  useEffect(
    () => () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  const reset = useCallback(() => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    setResults([]);
    setPdf(null);
    setError(null);
    setRange("");
  }, []);

  const onFiles = useCallback(
    async (files: FileList | File[]) => {
      const f = Array.from(files)[0];
      if (!f) return;
      reset();
      const isPdf = f.type === "application/pdf" || /\.pdf$/i.test(f.name);
      if (!isPdf) {
        setError(tC("pdfOnly"));
        return;
      }
      try {
        const bytes = new Uint8Array(await f.arrayBuffer());
        const { countPdfPages } = await import("@/features/pdf/render");
        const pages = await countPdfPages(bytes);
        if (pages < 1) {
          setError(tC("pdfOnly"));
          return;
        }
        setPdf({ name: f.name, bytes, pages });
      } catch (e) {
        setError(e instanceof Error ? e.message : tC("failedLoad"));
      }
    },
    [reset, tC],
  );

  const onConvert = useCallback(async () => {
    if (!pdf) return;
    setWorking(true);
    setError(null);
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    setResults([]);
    try {
      const pages = parsePageRange(range, pdf.pages);
      if (pages.length === 0) {
        setError(tC("pdfPageRangeHint"));
        return;
      }
      const { renderPdfPages } = await import("@/features/pdf/render");
      const rendered = await renderPdfPages(pdf.bytes, pages, { format, dpi });
      const ext = format === "png" ? "png" : "jpg";
      setResults(
        rendered.map((r) => ({
          pageNumber: r.pageNumber,
          blob: r.blob,
          ext,
          url: URL.createObjectURL(r.blob),
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : tC("exportFailed"));
    } finally {
      setWorking(false);
    }
  }, [pdf, range, format, dpi, tC]);

  const onDownloadZip = useCallback(async () => {
    if (results.length === 0) return;
    const { zipSync } = await import("fflate");
    const files: Record<string, Uint8Array> = {};
    for (const r of results) {
      files[`page-${r.pageNumber}.${r.ext}`] = new Uint8Array(await r.blob.arrayBuffer());
    }
    const zipped = zipSync(files);
    const blob = new Blob([zipped], { type: "application/zip" });
    triggerDownload(blob, "pdf-pages.zip");
  }, [results]);

  return (
    <div className="space-y-6">
      {!pdf && <DropZone onFiles={onFiles} multiple={false} accept="application/pdf" />}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {pdf && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <span className="font-medium break-all">{pdf.name}</span>
              <span className="ml-2 text-muted-foreground">
                {tC("pdfPageCount", { count: pdf.pages })}
              </span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              {tC("exifReplace")}
            </button>
          </div>

          <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-sm sm:grid-cols-3">
            <label className="text-sm">
              <span className="block font-medium">{tC("pdfPageRange")}</span>
              <input
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                placeholder={tC("pdfPageRangeHint")}
              />
            </label>
            <label className="text-sm">
              <span className="block font-medium">{tC("pdfDpi")}</span>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
              >
                <option value={72}>72</option>
                <option value={150}>150</option>
                <option value={300}>300</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="block font-medium">{tC("pdfFormat")}</span>
              <select
                className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5"
                value={format}
                onChange={(e) => setFormat(e.target.value as "png" | "jpeg")}
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={onConvert}
            disabled={working}
            className="w-full rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {working ? tC("pdfConverting") : tC("pdfConvert")}
          </button>

          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onDownloadZip}
                  className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  {tC("pdfDownloadZip")}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {results.map((r) => (
                  <div key={r.pageNumber} className="space-y-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.url}
                      alt={`Page ${r.pageNumber}`}
                      className="w-full rounded-lg border border-border object-contain"
                    />
                    <p className="text-center text-xs text-muted-foreground">
                      {tC("pdfPageLabel", { n: r.pageNumber })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
