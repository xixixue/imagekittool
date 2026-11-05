"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DropZone } from "@/components/upload/drop-zone";
import {
  ADJUST_FILTERS,
  composePhotoEdit,
  decodeToImage,
  photoEditImage,
  releaseImage,
  validateImageFile,
  type AdjustFilter,
  type DecodedImage,
  type EditTextOverlay,
  type EditStickerOverlay,
} from "@/features/image-processing";
import { triggerDownload } from "@/lib/download";

const STICKERS = ["😀", "😍", "😂", "🔥", "❤️", "👍", "⭐", "🎉", "💯", "🌈"];

interface TextLayer extends EditTextOverlay {
  id: number;
}
interface StickerLayer extends EditStickerOverlay {
  id: number;
}
type Selection = { kind: "text" | "sticker"; id: number } | null;

const FILTER_LABELS: Record<AdjustFilter, string> = {
  none: "filterNone",
  grayscale: "filterGrayscale",
  sepia: "filterSepia",
  invert: "filterInvert",
  vintage: "filterVintage",
};

export function PhotoEditorClient() {
  const tC = useTranslations("Controls");
  const [decoded, setDecoded] = useState<DecodedImage | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [filter, setFilter] = useState<AdjustFilter>("none");
  const [texts, setTexts] = useState<TextLayer[]>([]);
  const [stickers, setStickers] = useState<StickerLayer[]>([]);
  const [selected, setSelected] = useState<Selection>(null);
  const [newText, setNewText] = useState("");
  const [working, setWorking] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const idRef = useRef(1);
  const dragRef = useRef<Selection>(null);

  const resourcesRef = useRef<{ decoded?: DecodedImage; imageSrc?: string }>({});
  resourcesRef.current = { decoded: decoded ?? undefined, imageSrc: imageSrc ?? undefined };

  useEffect(
    () => () => {
      const r = resourcesRef.current;
      if (r.decoded) releaseImage(r.decoded);
      if (r.imageSrc) URL.revokeObjectURL(r.imageSrc);
    },
    [],
  );

  const onFiles = useCallback(async (files: FileList | File[]) => {
    const f = Array.from(files)[0];
    if (!f) return;
    setError(null);
    const v = await validateImageFile(f);
    if (!v.ok || !v.format) {
      setError(v.error ?? tC("unsupportedFile"));
      return;
    }
    try {
      const dec = await decodeToImage(f, v.format);
      setDecoded((prev) => {
        if (prev) releaseImage(prev);
        return dec;
      });
      setImageSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(f);
      });
      setTexts([]);
      setStickers([]);
      setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : tC("failedLoad"));
    }
  }, [tC]);

  // Preview dimensions capped to keep the live canvas light.
  const previewDims = decoded
    ? (() => {
        const max = 1000;
        const scale = Math.min(1, max / Math.max(decoded.width, decoded.height));
        return { w: Math.round(decoded.width * scale), h: Math.round(decoded.height * scale) };
      })()
    : null;

  // Re-render the preview whenever the composition or selection changes.
  useEffect(() => {
    if (!decoded || !previewDims || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { w, h } = previewDims;
    composePhotoEdit(ctx, decoded.bitmap, w, h, {
      brightness,
      contrast,
      saturation,
      filter,
      texts,
      stickers,
    });
    if (selected) {
      const layer =
        selected.kind === "text"
          ? texts.find((t) => t.id === selected.id)
          : stickers.find((s) => s.id === selected.id);
      if (layer) {
        const cx = layer.x * w;
        const cy = layer.y * h;
        const fontPx = layer.fontSize * h;
        const lw =
          selected.kind === "text"
            ? Math.max(fontPx, (layer as TextLayer).text.length * fontPx * 0.34) + 10
            : fontPx * 1.3;
        const lh = fontPx * 1.3;
        ctx.save();
        ctx.strokeStyle = "#6366f1";
        ctx.setLineDash([5, 3]);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - lw / 2, cy - lh / 2, lw, lh);
        ctx.restore();
      }
    }
  }, [decoded, previewDims, brightness, contrast, saturation, filter, texts, stickers, selected]);

  const eventToPixels = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !previewDims) return null;
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * previewDims.w;
    const py = ((e.clientY - rect.top) / rect.height) * previewDims.h;
    return { px, py };
  };

  const hitTest = (px: number, py: number): Selection => {
    if (!previewDims) return null;
    const { w, h } = previewDims;
    // Stickers are drawn last (topmost); check them first.
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i];
      const fontPx = s.fontSize * h;
      if (Math.abs(px - s.x * w) <= fontPx * 0.6 && Math.abs(py - s.y * h) <= fontPx * 0.6) {
        return { kind: "sticker", id: s.id };
      }
    }
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      const fontPx = t.fontSize * h;
      const halfW = Math.max(fontPx * 0.5, t.text.length * fontPx * 0.34) + 6;
      const halfH = fontPx * 0.7;
      if (Math.abs(px - t.x * w) <= halfW && Math.abs(py - t.y * h) <= halfH) {
        return { kind: "text", id: t.id };
      }
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!decoded) return;
    const p = eventToPixels(e);
    if (!p) return;
    const hit = hitTest(p.px, p.py);
    setSelected(hit);
    if (hit) {
      dragRef.current = hit;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const sel = dragRef.current;
    if (!sel || !previewDims) return;
    const p = eventToPixels(e);
    if (!p) return;
    const nx = p.px / previewDims.w;
    const ny = p.py / previewDims.h;
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    if (sel.kind === "text") {
      setTexts((prev) =>
        prev.map((t) => (t.id === sel.id ? { ...t, x: clamp(nx), y: clamp(ny) } : t)),
      );
    } else {
      setStickers((prev) =>
        prev.map((s) => (s.id === sel.id ? { ...s, x: clamp(nx), y: clamp(ny) } : s)),
      );
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    dragRef.current = null;
  };

  const addText = () => {
    const value = newText.trim();
    if (!value) return;
    const id = idRef.current++;
    setTexts((prev) => [
      ...prev,
      { id, text: value, fontSize: 0.08, color: "#ffffff", x: 0.5, y: 0.5 },
    ]);
    setSelected({ kind: "text", id });
    setNewText("");
  };

  const addSticker = (emoji: string) => {
    const id = idRef.current++;
    setStickers((prev) => [
      ...prev,
      { id, emoji, fontSize: 0.12, x: 0.5, y: 0.5 },
    ]);
    setSelected({ kind: "sticker", id });
  };

  const deleteSelected = () => {
    if (!selected) return;
    if (selected.kind === "text") {
      setTexts((prev) => prev.filter((t) => t.id !== selected.id));
    } else {
      setStickers((prev) => prev.filter((s) => s.id !== selected.id));
    }
    setSelected(null);
  };

  const resetAll = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setFilter("none");
    setTexts([]);
    setStickers([]);
    setSelected(null);
  };

  const updateSelected = (patch: Partial<TextLayer> | Partial<StickerLayer>) => {
    if (!selected) return;
    if (selected.kind === "text") {
      setTexts((prev) =>
        prev.map((t) => (t.id === selected.id ? ({ ...t, ...patch } as TextLayer) : t)),
      );
    } else {
      setStickers((prev) =>
        prev.map((s) => (s.id === selected.id ? ({ ...s, ...patch } as StickerLayer) : s)),
      );
    }
  };

  const selectedLayer =
    selected?.kind === "text"
      ? texts.find((t) => t.id === selected.id)
      : selected?.kind === "sticker"
        ? stickers.find((s) => s.id === selected.id)
        : null;

  const onExport = async () => {
    if (!decoded) return;
    setWorking(true);
    setError(null);
    try {
      const result = await photoEditImage(decoded, {
        brightness,
        contrast,
        saturation,
        filter,
        texts,
        stickers,
      });
      triggerDownload(result.blob, result.filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : tC("exportFailed"));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-6">
      {!imageSrc && <DropZone onFiles={onFiles} multiple={false} />}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {imageSrc && decoded && previewDims && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <canvas
              ref={canvasRef}
              width={previewDims.w}
              height={previewDims.h}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className="max-h-[70vh] w-full touch-none rounded-lg"
            />
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div>
              <span className="text-sm font-medium">{tC("adjust")}</span>
              <div className="mt-3 space-y-3">
                <RangeRow
                  label={tC("brightness", { value: brightness })}
                  min={0}
                  max={200}
                  value={brightness}
                  onChange={setBrightness}
                />
                <RangeRow
                  label={tC("contrast", { value: contrast })}
                  min={0}
                  max={200}
                  value={contrast}
                  onChange={setContrast}
                />
                <RangeRow
                  label={tC("saturation", { value: saturation })}
                  min={0}
                  max={200}
                  value={saturation}
                  onChange={setSaturation}
                />
              </div>
            </div>

            <label className="block">
              <span className="text-sm font-medium">{tC("filter")}</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as AdjustFilter)}
                className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {ADJUST_FILTERS.map((f) => (
                  <option key={f} value={f}>
                    {tC(FILTER_LABELS[f])}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="text-sm font-medium">{tC("addText")}</span>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addText();
                  }}
                  className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={addText}
                  className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium">{tC("addSticker")}</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {STICKERS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => addSticker(emoji)}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-lg transition-colors hover:bg-muted"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {selectedLayer && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selected?.kind === "text" ? tC("layerText") : tC("layerSticker")}
                  </span>
                  <button
                    type="button"
                    onClick={deleteSelected}
                    className="text-xs text-destructive hover:underline"
                  >
                    {tC("deleteLayer")}
                  </button>
                </div>
                {selected?.kind === "text" && (
                  <input
                    type="text"
                    value={(selectedLayer as TextLayer).text}
                    onChange={(e) => updateSelected({ text: e.target.value })}
                    className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                )}
                <RangeRow
                  label={tC("layerSize", { percent: Math.round(selectedLayer.fontSize * 100) })}
                  min={2}
                  max={30}
                  value={Math.round(selectedLayer.fontSize * 100)}
                  onChange={(v) => updateSelected({ fontSize: v / 100 })}
                />
                {selected?.kind === "text" && (
                  <label className="flex items-center gap-2">
                    <span className="text-sm">{tC("color")}</span>
                    <input
                      type="color"
                      value={(selectedLayer as TextLayer).color}
                      onChange={(e) => updateSelected({ color: e.target.value })}
                      className="h-8 w-12 rounded border border-border bg-background"
                    />
                  </label>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={onExport}
                disabled={working}
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {working ? tC("exporting") : tC("export")}
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
              >
                {tC("reset")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RangeRow({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-primary"
      />
    </label>
  );
}
