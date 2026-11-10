import { describe, expect, it } from "vitest";
import { buildMultiSizeIco } from "../ico";

/** A fake PNG: just distinct bytes so we can verify they land at the right offset. */
function fakePng(seed: number, len: number): Uint8Array {
  const b = new Uint8Array(len);
  for (let i = 0; i < len; i++) b[i] = (seed + i) & 0xff;
  return b;
}

describe("buildMultiSizeIco", () => {
  it("writes the ICONDIR header (type=ICO, count)", () => {
    const ico = buildMultiSizeIco([
      { size: 16, png: fakePng(1, 10) },
      { size: 32, png: fakePng(2, 20) },
    ]);
    const view = new DataView(ico.buffer);
    expect(view.getUint16(0, true)).toBe(0); // reserved
    expect(view.getUint16(2, true)).toBe(1); // type = ICO
    expect(view.getUint16(4, true)).toBe(2); // count = 2
  });

  it("writes ICONDIRENTRY fields and places PNG data at the right offsets", () => {
    const png0 = fakePng(100, 12);
    const png1 = fakePng(200, 34);
    const ico = buildMultiSizeIco([
      { size: 16, png: png0 },
      { size: 48, png: png1 },
    ]);
    const view = new DataView(ico.buffer);
    const headerSize = 6 + 16 * 2; // 38
    // Entry 0 at offset 6
    expect(ico[6]).toBe(16); // width
    expect(ico[7]).toBe(16); // height
    expect(view.getUint32(14, true)).toBe(12); // bytesInRes
    expect(view.getUint32(18, true)).toBe(headerSize); // imageOffset = 38
    // Entry 1 at offset 22
    expect(ico[22]).toBe(48); // width
    expect(view.getUint32(30, true)).toBe(34); // bytesInRes
    expect(view.getUint32(34, true)).toBe(headerSize + 12); // offset = 38 + 12 = 50

    // PNG bytes present at their offsets.
    expect(ico[headerSize]).toBe(png0[0]);
    expect(ico[headerSize + png0.length]).toBe(png1[0]);
    // Total length matches.
    expect(ico.length).toBe(headerSize + png0.length + png1.length);
  });

  it("encodes 256 as 0 in the width/height bytes", () => {
    const ico = buildMultiSizeIco([{ size: 256, png: fakePng(0, 5) }]);
    expect(ico[6]).toBe(0); // width = 0 means 256
    expect(ico[7]).toBe(0);
  });
});
