import { describe, expect, it } from "vitest";
import { backgroundForFormat } from "../canvas";

/**
 * backgroundForFormat is the pure rule that every image processor uses to
 * decide whether transparency is composited onto an opaque background. JPEG
 * has no alpha channel (transparent pixels would render as black), so it is
 * filled with white (or an explicit color); PNG/WebP keep alpha (SPEC V2 §13.2,
 * Step 1.3 transparency audit).
 */
describe("backgroundForFormat", () => {
  it("fills white for jpeg when no background is given", () => {
    expect(backgroundForFormat("jpeg")).toBe("#ffffff");
  });

  it("uses the explicit background for jpeg", () => {
    expect(backgroundForFormat("jpeg", "#000000")).toBe("#000000");
    expect(backgroundForFormat("jpeg", "transparent")).toBe("transparent");
  });

  it("preserves alpha for png regardless of a background argument", () => {
    expect(backgroundForFormat("png")).toBeUndefined();
    expect(backgroundForFormat("png", "#ffffff")).toBeUndefined();
  });

  it("preserves alpha for webp regardless of a background argument", () => {
    expect(backgroundForFormat("webp")).toBeUndefined();
    expect(backgroundForFormat("webp", "#ffffff")).toBeUndefined();
  });
});
