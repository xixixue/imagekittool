import { canvasToBlob, drawBitmapToFormat } from "@/features/image-processing/canvas";
import { buildMultiSizeIco, type IcoImage } from "./ico";

/**
 * Favicon set generator (SPEC V2 §4.2 P0). Generates a standard multi-size
 * favicon package entirely in the browser: PNGs at common sizes, a multi-size
 * ICO (16/32/48), a web manifest, and an HTML snippet. The source image is
 * never uploaded.
 */

export interface FaviconResult {
  /** size → PNG blob, for live preview in the UI. */
  previews: Map<number, Blob>;
  /** path → file bytes, ready for fflate zipSync. */
  zipFiles: Record<string, Uint8Array>;
  /** HTML <link>/<meta> snippet, also included as snippet.txt in the ZIP. */
  snippet: string;
}

// Standard favicon surface sizes.
export const FAVICON_SIZES = [16, 32, 48, 96, 180, 192, 512] as const;
// Sizes embedded in favicon.ico.
const ICO_SIZES = [16, 32, 48];

const FILENAMES: Record<number, string> = {
  16: "favicon-16x16.png",
  32: "favicon-32x32.png",
  48: "favicon-48x48.png",
  96: "favicon-96x96.png",
  180: "apple-touch-icon.png",
  192: "android-chrome-192x192.png",
  512: "android-chrome-512x512.png",
};

function buildWebmanifest(): string {
  return JSON.stringify(
    {
      name: "",
      short_name: "",
      icons: [
        { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
        { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { src: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
    },
    null,
    2,
  );
}

export function buildHtmlSnippet(): string {
  return [
    '<link rel="icon" type="image/x-icon" href="/favicon.ico">',
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
    '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
    '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
    '<meta name="theme-color" content="#ffffff">',
  ].join("\n");
}

/**
 * Generate the full favicon set from a decoded bitmap. Each PNG is drawn at the
 * exact target size (no smoothing tricks beyond the browser default).
 */
export async function generateFaviconSet(bitmap: ImageBitmap): Promise<FaviconResult> {
  const previews = new Map<number, Blob>();
  for (const size of FAVICON_SIZES) {
    const canvas = drawBitmapToFormat(bitmap, size, size, "png");
    previews.set(size, await canvasToBlob(canvas, "png"));
  }

  // ICO from the 16/32/48 PNGs.
  const icoImages: IcoImage[] = [];
  for (const size of ICO_SIZES) {
    const blob = previews.get(size)!;
    icoImages.push({ size, png: new Uint8Array(await blob.arrayBuffer()) });
  }
  const icoBytes = buildMultiSizeIco(icoImages);

  // Build the ZIP file map.
  const zipFiles: Record<string, Uint8Array> = { "favicon.ico": icoBytes };
  for (const size of FAVICON_SIZES) {
    const name = FILENAMES[size];
    if (name) zipFiles[name] = new Uint8Array(await previews.get(size)!.arrayBuffer());
  }
  const snippet = buildHtmlSnippet();
  zipFiles["site.webmanifest"] = new TextEncoder().encode(buildWebmanifest());
  zipFiles["snippet.txt"] = new TextEncoder().encode(snippet);

  return { previews, zipFiles, snippet };
}
