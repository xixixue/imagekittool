/**
 * Multi-size ICO writer (SPEC V2 §4.2 P0 — Favicon Generator).
 *
 * Writes a Windows .ico file containing one PNG image per size. Pure byte
 * construction (no DOM) so it is unit-testable with fake PNG bytes. Modern
 * browsers support PNG-encoded ICO entries, which avoids the older BMP/DIB
 * encoding entirely.
 */

export interface IcoImage {
  size: number;
  png: Uint8Array;
}

/**
 * Build a multi-size ICO from PNG-encoded entries.
 * Layout: ICONDIR (6) + N×ICONDIRENTRY (16) + N×PNG data.
 */
export function buildMultiSizeIco(images: IcoImage[]): Uint8Array {
  const count = images.length;
  const headerSize = 6 + 16 * count;
  const offsets: number[] = [];
  let cursor = headerSize;
  for (const img of images) {
    offsets.push(cursor);
    cursor += img.png.length;
  }
  const total = cursor;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);

  // ICONDIR
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type = ICO
  view.setUint16(4, count, true);

  images.forEach((img, i) => {
    const base = 6 + 16 * i;
    const dim = img.size >= 256 ? 0 : img.size; // 0 encodes 256
    out[base] = dim; // width
    out[base + 1] = dim; // height
    out[base + 2] = 0; // colorCount (0 for >=8bpp)
    out[base + 3] = 0; // reserved
    view.setUint16(base + 4, 1, true); // planes
    view.setUint16(base + 6, 32, true); // bitCount
    view.setUint32(base + 8, img.png.length, true); // bytesInRes
    view.setUint32(base + 12, offsets[i], true); // imageOffset
  });

  // Append each PNG at its offset.
  let pos = headerSize;
  for (const img of images) {
    out.set(img.png, pos);
    pos += img.png.length;
  }
  return out;
}
