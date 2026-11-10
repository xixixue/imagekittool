"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DropZone } from "@/components/upload/drop-zone";
import { validateImageFile } from "@/features/image-processing";
import { parseExif, type ExifGroupKey, type ParsedExif } from "@/features/exif";

const GROUP_LABELS: Record<ExifGroupKey, string> = {
  image: "exifGroupImage",
  camera: "exifGroupCamera",
  settings: "exifGroupSettings",
  gps: "exifGroupGps",
} as const;

export function ExifViewerClient() {
  const tC = useTranslations("Controls");
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedExif | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const previewUrlRef = useRef<string | null>(null);
  previewUrlRef.current = previewUrl;

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const onFiles = useCallback(
    async (files: FileList | File[]) => {
      const f = Array.from(files)[0];
      if (!f) return;
      setError(null);
      setParsed(null);
      setShowRaw(false);
      const v = await validateImageFile(f);
      if (!v.ok || !v.format) {
        setError(v.error ?? tC("unsupportedFile"));
        return;
      }
      // Revoke any previous preview before replacing it.
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(f);
      setFileName(f.name);
      setPreviewUrl(url);
      setLoading(true);
      try {
        const result = await parseExif(f);
        setParsed(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : tC("failedLoad"));
      } finally {
        setLoading(false);
      }
    },
    [tC],
  );

  const hasMetadata =
    parsed !== null && (parsed.groups.length > 0 || Object.keys(parsed.raw).length > 0);

  return (
    <div className="space-y-6">
      {!previewUrl && <DropZone onFiles={onFiles} multiple={false} />}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {previewUrl && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={fileName ?? ""}
                className="h-16 w-16 rounded-lg border border-border object-cover"
              />
              <span className="text-sm font-medium break-all">{fileName}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
                setPreviewUrl(null);
                setFileName(null);
                setParsed(null);
                setError(null);
                setShowRaw(false);
              }}
              className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              {tC("exifReplace")}
            </button>
          </div>

          {loading && <p className="text-sm text-muted-foreground">{tC("exifLoading")}</p>}

          {!loading && parsed && !hasMetadata && (
            <p className="text-sm text-muted-foreground">{tC("exifNoData")}</p>
          )}

          {!loading && parsed && hasMetadata && (
            <div className="space-y-6">
              {parsed.groups.map((group) => (
                <div key={group.key} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground">
                    {tC(GROUP_LABELS[group.key])}
                  </h3>
                  <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                    {group.fields.map((field, i) => (
                      <div key={i} className="flex justify-between gap-4 text-sm">
                        <dt className="text-muted-foreground">{field.label}</dt>
                        <dd className="font-medium text-right break-all">{field.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}

              {parsed.gps && (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground">{tC("exifGroupGps")}</h3>
                  <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="flex justify-between gap-4 text-sm">
                      <dt className="text-muted-foreground">{tC("exifGpsLat")}</dt>
                      <dd className="font-medium">{parsed.gps.latitude.toFixed(5)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 text-sm">
                      <dt className="text-muted-foreground">{tC("exifGpsLon")}</dt>
                      <dd className="font-medium">{parsed.gps.longitude.toFixed(5)}</dd>
                    </div>
                  </dl>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${parsed.gps.latitude}&mlon=${parsed.gps.longitude}#map=16/${parsed.gps.latitude}/${parsed.gps.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex text-sm text-primary underline-offset-2 hover:underline"
                  >
                    {tC("exifViewMap")}
                  </a>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => setShowRaw((v) => !v)}
                  className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {showRaw ? tC("exifHideRaw") : tC("exifShowRaw")}
                </button>
                {showRaw && (
                  <dl className="mt-3 grid gap-1 rounded-xl border border-border bg-card p-5 text-xs">
                    {Object.entries(parsed.raw).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="font-medium text-right break-all">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
