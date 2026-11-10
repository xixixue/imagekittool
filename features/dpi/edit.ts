/**
 * Lossless DPI/PPI metadata editor (SPEC V2 §4.2 P0, §6.3).
 *
 * Edits the DPI metadata IN PLACE — pixels and EXIF are preserved; only the
 * resolution metadata changes (JPEG JFIF density / PNG pHYs). This is metadata
 * only: it does NOT add pixels or improve clarity, which the UI makes explicit.
 *
 * Pure byte functions (no DOM, no deps) so they are fully unit-testable with
 * synthetic bytes. WebP DPI lives inside a RIFF/EXIF chunk and is not handled.
 */

export type DpiFormat = "jpeg" | "png";

const MIN_DPI = 1;
const MAX_DPI = 4000;

function clampDpi(dpi: number): number {
  if (!Number.isFinite(dpi)) return 300;
  return Math.min(MAX_DPI, Math.max(MIN_DPI, Math.round(dpi)));
}

// --- CRC32 (PNG chunks) -----------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array, start: number, end: number): number {
  let c = 0xffffffff;
  for (let i = start; i < end; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// --- JPEG JFIF density ------------------------------------------------------

/** Offset of the JFIF APP0 marker (FF E0 ...), or -1 if none. */
function findJfifApp0(b: Uint8Array): number {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return -1; // not a JPEG
  let i = 2;
  while (i + 4 < b.length) {
    if (b[i] !== 0xff) break;
    const marker = b[i + 1];
    if (marker === 0xda || marker === 0xd9) break; // SOS / EOI — stop
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2; // standalone markers, no length field
      continue;
    }
    const len = (b[i + 2] << 8) | b[i + 3];
    if (marker === 0xe0 && len >= 8) {
      // APP0 — check "JFIF\0" signature at i+4..i+8
      if (
        b[i + 4] === 0x4a &&
        b[i + 5] === 0x46 &&
        b[i + 6] === 0x49 &&
        b[i + 7] === 0x46 &&
        b[i + 8] === 0x00
      ) {
        return i;
      }
    }
    i += 2 + len;
  }
  return -1;
}

/** Build a minimal 16-byte JFIF APP0 segment (without the 2-byte marker). */
function buildJfifApp0Data(dpi: number): Uint8Array {
  // length(2) + "JFIF\0"(5) + version(2) + units(1) + Xd(2) + Yd(2) + Xthumb(1) + Ythumb(1) = 16
  const d = new Uint8Array(16);
  d[0] = 0; d[1] = 16; // length = 16
  d[2] = 0x4a; d[3] = 0x46; d[4] = 0x49; d[5] = 0x46; d[6] = 0x00; // "JFIF\0"
  d[7] = 1; d[8] = 1; // version 1.1
  d[9] = 1; // units = DPI
  d[10] = (dpi >> 8) & 0xff; d[11] = dpi & 0xff; // Xdensity
  d[12] = (dpi >> 8) & 0xff; d[13] = dpi & 0xff; // Ydensity
  d[14] = 0; d[15] = 0; // no thumbnail
  return d;
}

/** Read the JFIF density (DPI) from a JPEG, or null if absent/no units. */
export function readJpegDpi(bytes: Uint8Array): number | null {
  const off = findJfifApp0(bytes);
  if (off < 0) return null;
  const units = bytes[off + 11];
  if (units !== 1) return null; // 0 = no units, 2 = DPCM
  return (bytes[off + 12] << 8) | bytes[off + 13];
}

/** Set the JFIF density (DPI) on a JPEG. Inserts a JFIF APP0 if none exists. */
export function setJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  const d = clampDpi(dpi);
  const off = findJfifApp0(bytes);
  if (off >= 0) {
    const out = bytes.slice();
    out[off + 11] = 1; // units = DPI
    out[off + 12] = (d >> 8) & 0xff;
    out[off + 13] = d & 0xff;
    out[off + 14] = (d >> 8) & 0xff;
    out[off + 15] = d & 0xff;
    return out;
  }
  // No JFIF APP0 — insert one right after the SOI (FFD8). 2 marker + 16 data.
  const seg = new Uint8Array(18);
  seg[0] = 0xff; seg[1] = 0xe0;
  seg.set(buildJfifApp0Data(d), 2);
  const out = new Uint8Array(bytes.length + seg.length);
  out.set(bytes.subarray(0, 2), 0);
  out.set(seg, 2);
  out.set(bytes.subarray(2), 2 + seg.length);
  return out;
}

// --- PNG pHYs chunk ---------------------------------------------------------

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Build a 21-byte pHYs chunk (length + type + 9-byte data + CRC). */
function buildPhysChunk(ppm: number): Uint8Array {
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9); // data length
  chunk[4] = 0x70; chunk[5] = 0x48; chunk[6] = 0x59; chunk[7] = 0x73; // "pHYs"
  view.setUint32(8, ppm); // X pixels per meter
  view.setUint32(12, ppm); // Y pixels per meter
  chunk[16] = 1; // unit = meters
  view.setUint32(17, crc32(chunk, 4, 17)); // CRC over type + data
  return chunk;
}

function readChunkType(b: Uint8Array, i: number): string {
  return String.fromCharCode(b[i + 4], b[i + 5], b[i + 6], b[i + 7]);
}

/** Read the DPI from a PNG pHYs chunk, or null if absent/no units. */
export function readPngDpi(bytes: Uint8Array): number | null {
  if (!isPng(bytes)) return null;
  let i = 8;
  while (i + 8 <= bytes.length) {
    const len = (bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3];
    const type = readChunkType(bytes, i);
    if (type === "pHYs" && len >= 9) {
      const unit = bytes[i + 16];
      if (unit !== 1) return null;
      const ppm = (bytes[i + 8] << 24) | (bytes[i + 9] << 16) | (bytes[i + 10] << 8) | bytes[i + 11];
      return Math.round(ppm * 0.0254);
    }
    if (type === "IDAT") return null; // pHYs would have come before IDAT
    i += 4 + 4 + len + 4;
  }
  return null;
}

/** Set the DPI of a PNG by replacing or inserting the pHYs chunk. */
export function setPngDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (!isPng(bytes)) throw new Error("Not a PNG file.");
  const ppm = Math.round(clampDpi(dpi) / 0.0254);
  const chunk = buildPhysChunk(ppm);
  let i = 8;
  while (i + 8 <= bytes.length) {
    const len = (bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3];
    const type = readChunkType(bytes, i);
    const total = 4 + 4 + len + 4;
    if (type === "pHYs") {
      // Replace the existing chunk.
      const out = new Uint8Array(bytes.length - total + chunk.length);
      out.set(bytes.subarray(0, i), 0);
      out.set(chunk, i);
      out.set(bytes.subarray(i + total), i + chunk.length);
      return out;
    }
    if (type === "IDAT") {
      // Insert pHYs before the first IDAT.
      const out = new Uint8Array(bytes.length + chunk.length);
      out.set(bytes.subarray(0, i), 0);
      out.set(chunk, i);
      out.set(bytes.subarray(i), i + chunk.length);
      return out;
    }
    i += total;
  }
  throw new Error("Malformed PNG: no IDAT chunk found.");
}

function isPng(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  return PNG_SIG.every((v, idx) => bytes[idx] === v);
}

// --- Dispatchers ------------------------------------------------------------

/** Read the current DPI from an image, or null if none/unsupported. */
export function readImageDpi(bytes: Uint8Array, format: DpiFormat): number | null {
  return format === "jpeg" ? readJpegDpi(bytes) : readPngDpi(bytes);
}

/** Losslessly set the DPI metadata on an image. Preserves pixels + EXIF. */
export function setImageDpi(bytes: Uint8Array, format: DpiFormat, dpi: number): Uint8Array {
  return format === "jpeg" ? setJpegDpi(bytes, dpi) : setPngDpi(bytes, dpi);
}

/** Dots ↔ inches helper for the print-size preview shown in the UI. */
export function printSizeInches(px: number, dpi: number): number {
  if (dpi <= 0) return 0;
  return px / dpi;
}
