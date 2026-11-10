import { describe, expect, it } from "vitest";
import {
  readImageDpi,
  readJpegDpi,
  readPngDpi,
  setImageDpi,
  setJpegDpi,
  setPngDpi,
  printSizeInches,
} from "../edit";

// --- synthetic byte builders ------------------------------------------------

function makeJpeg(density: number): Uint8Array {
  const b = new Uint8Array(22);
  b[0] = 0xff; b[1] = 0xd8; // SOI
  b[2] = 0xff; b[3] = 0xe0; // APP0 marker
  b[4] = 0; b[5] = 16; // length = 16
  b[6] = 0x4a; b[7] = 0x46; b[8] = 0x49; b[9] = 0x46; b[10] = 0x00; // "JFIF\0"
  b[11] = 1; b[12] = 1; // version 1.1
  b[13] = 1; // units = DPI
  b[14] = (density >> 8) & 0xff; b[15] = density & 0xff; // Xdensity
  b[16] = (density >> 8) & 0xff; b[17] = density & 0xff; // Ydensity
  b[18] = 0; b[19] = 0; // no thumbnail
  b[20] = 0xff; b[21] = 0xd9; // EOI
  return b;
}

/** A JPEG with an APP1 (non-JFIF) segment and no JFIF APP0. */
function makeJpegNoJfif(): Uint8Array {
  const app1Data = new Uint8Array(10); // arbitrary APP1 payload
  const b = new Uint8Array(2 + 4 + app1Data.length + 2);
  b[0] = 0xff; b[1] = 0xd8; // SOI
  b[2] = 0xff; b[3] = 0xe1; // APP1 marker
  const len = app1Data.length + 2;
  b[4] = (len >> 8) & 0xff; b[5] = len & 0xff;
  b.set(app1Data, 6);
  b[b.length - 2] = 0xff; b[b.length - 1] = 0xd9; // EOI
  return b;
}

function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) chunk[4 + i] = type.charCodeAt(i);
  chunk.set(data, 8);
  // CRC left zero — the editor reads length+type only and never validates CRC.
  return chunk;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

const PNG_SIG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function makePng(withPhys: boolean, dpi = 72): Uint8Array {
  const parts: Uint8Array[] = [PNG_SIG, makeChunk("IHDR", new Uint8Array(13))];
  if (withPhys) {
    const ppm = Math.round(dpi / 0.0254);
    const data = new Uint8Array(9);
    const dv = new DataView(data.buffer);
    dv.setUint32(0, ppm);
    dv.setUint32(4, ppm);
    data[8] = 1; // meters
    parts.push(makeChunk("pHYs", data));
  }
  parts.push(makeChunk("IDAT", new Uint8Array(0)));
  parts.push(makeChunk("IEND", new Uint8Array(0)));
  return concat(parts);
}

// --- tests ------------------------------------------------------------------

describe("JPEG JFIF density", () => {
  it("reads and sets DPI in place, preserving SOI/EOI and length", () => {
    const src = makeJpeg(72);
    expect(readJpegDpi(src)).toBe(72);
    const out = setJpegDpi(src, 300);
    expect(readJpegDpi(out)).toBe(300);
    // Edited in place: same byte length, SOI + EOI intact.
    expect(out.length).toBe(src.length);
    expect(out[0]).toBe(0xff); expect(out[1]).toBe(0xd8);
    expect(out[out.length - 2]).toBe(0xff); expect(out[out.length - 1]).toBe(0xd9);
  });

  it("inserts a JFIF APP0 when none exists", () => {
    const src = makeJpegNoJfif();
    expect(readJpegDpi(src)).toBeNull();
    const out = setJpegDpi(src, 96);
    expect(readJpegDpi(out)).toBe(96);
    expect(out.length).toBe(src.length + 18); // +2 marker +16 data
    expect(out[0]).toBe(0xff); expect(out[1]).toBe(0xd8);
  });

  it("clamps DPI to a safe range", () => {
    expect(readJpegDpi(setJpegDpi(makeJpeg(72), 99999))).toBe(4000);
    expect(readJpegDpi(setJpegDpi(makeJpeg(72), 0))).toBe(1);
  });
});

describe("PNG pHYs chunk", () => {
  it("replaces an existing pHYs chunk", () => {
    const src = makePng(true, 72);
    expect(readPngDpi(src)).toBe(72);
    const out = setPngDpi(src, 300);
    expect(readPngDpi(out)).toBe(300);
    // pHYs is always 21 bytes, so replace keeps the length unchanged.
    expect(out.length).toBe(src.length);
  });

  it("inserts a pHYs chunk before IDAT when absent", () => {
    const src = makePng(false);
    expect(readPngDpi(src)).toBeNull();
    const out = setPngDpi(src, 300);
    expect(readPngDpi(out)).toBe(300);
    expect(out.length).toBe(src.length + 21); // +21 pHYs chunk
  });

  it("round-trips a print-standard DPI (600)", () => {
    const out = setPngDpi(makePng(true, 72), 600);
    // 600 DPI → 600/0.0254 = 23622 ppm → back to 600.
    expect(readPngDpi(out)).toBe(600);
  });
});

describe("dispatchers + helpers", () => {
  it("readImageDpi/setImageDpi dispatch by format", () => {
    const jpg = setJpegDpi(makeJpeg(72), 144);
    expect(readImageDpi(jpg, "jpeg")).toBe(144);
    const png = setPngDpi(makePng(false), 144);
    expect(readImageDpi(png, "png")).toBe(144);
  });

  it("printSizeInches divides pixels by DPI", () => {
    expect(printSizeInches(3000, 300)).toBe(10);
    expect(printSizeInches(1080, 72)).toBe(15);
  });
});
