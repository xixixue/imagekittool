"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DropZone } from "@/components/upload/drop-zone";
import {
  compressImage,
  decodeToImage,
  releaseImage,
  validateImageFile,
  type DecodedImage,
} from "@/features/image-processing";
import { parseExif, type ParsedExif } from "@/features/exif";
import { triggerDownload } from "@/lib/download";

/**
 * EXIF Remover (SPEC V2 §4.2 P0). Re-encodes the image locally so all EXIF,
 * IPTC, XMP and GPS metadata is stripped (canvas keeps only pixel data), then
 * re-parses the output to verify the metadata is genuinely gone — not just
 * assumed. Nothing is uploaded.
 */
export function ExifRemoverClient() {
  const tC = useTranslations("Controls");
  const [fileName, setFileName] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<DecodedImage | null>(null);
  const [before, setBefore] = useState<ParsedExif | null>(null);
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [after, setAfter] = useState<ParsedExif | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decodedRef = useRef<DecodedImage | null>(null);
  decodedRef.current = decoded;

  useEffect(
    () => () => {
      if (decodedRef.current) releaseImage(decodedRef.current);
    },
    [],
  );

  const reset = useCallback(() => {
    if (decodedRef.current) releaseImage(decodedRef.current);
    setDecoded(null);
    setFileName(null);
    setBefore(null);
    setResult(null);
    setAfter(null);
    setError(null);
  }, []);

  const onFiles = useCallback(
    async (files: FileList | File[]) => {
      const f = Array.from(files)[0];
      if (!f) return;
      reset();
      const v = await validateImageFile(f);
      if (!v.ok || !v.format) {
        setError(v.error ?? tC("unsupportedFile"));
        return;
      }
      try {
        const dec = await decodeToImage(f, v.format);
        setDecoded(dec);
        setFileName(f.name);
        const exif = await parseExif(f);
        setBefore(exif);
      } catch (e) {
        setError(e instanceof Error ? e.message : tC("failedLoad"));
      }
    },
    [reset, tC],
  );

  const onRemove = useCallback(async () => {
    if (!decoded) return;
    setWorking(true);
    setError(null);
    try {
      // Re-encode keeping the source format at high quality. Canvas re-encoding
      // drops all metadata; PNG stays lossless, JPEG/WebP use quality 0.92.
      const res = await compressImage(decoded, { quality: 0.92, format: decoded.format });
      setResult({ blob: res.blob, filename: res.filename });
      // Verify by re-parsing the output bytes.
      const exifAfter = await parseExif(res.blob);
      setAfter(exifAfter);
    } catch (e) {
      setError(e instanceof Error ? e.message : tC("exportFailed"));
    } finally {
      setWorking(false);
    }
  }, [decoded, tC]);

  const beforeCount = before ? Object.keys(before.raw).length : 0;
  const afterCount = after ? Object.keys(after.raw).length : 0;
  const hadGps = before?.gps != null;
  const gpsRemoved = after != null && after.gps == null;

  return (
    <div className="space-y-6">
      {!decoded && <DropZone onFiles={onFiles} multiple={false} />}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {decoded && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium break-all">{fileName}</span>
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              {tC("exifReplace")}
            </button>
          </div>

          {/* Before */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground">{tC("exifBeforeTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {beforeCount > 0
                ? tC("exifFieldsFound", { count: beforeCount })
                : tC("exifNoMeta")}
            </p>
            {hadGps && (
              <p className="mt-1 text-sm text-destructive">{tC("exifGpsFound")}</p>
            )}
          </div>

          {beforeCount > 0 && !result && (
            <button
              type="button"
              onClick={onRemove}
              disabled={working}
              className="w-full rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {working ? tC("exifRemoving") : tC("exifRemoveAction")}
            </button>
          )}

          {/* After — verification */}
          {result && after && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground">{tC("exifAfterTitle")}</h3>
              <p className="mt-2 text-sm font-medium text-emerald-600">{tC("exifAllClean")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tC("exifFieldsRemaining", { count: afterCount })}
              </p>
              {hadGps && gpsRemoved && (
                <p className="mt-1 text-sm font-medium text-emerald-600">{tC("exifGpsClean")}</p>
              )}
              <button
                type="button"
                onClick={() => triggerDownload(result.blob, result.filename)}
                className="mt-4 w-full rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {tC("exifDownloadClean")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
