import { describe, expect, it } from "vitest";
import { guides, guidesForTool } from "@/lib/data/guides";

describe("guidesForTool", () => {
  it("returns guides whose relatedToolSlugs include the tool", () => {
    const result = guidesForTool("image-compressor");
    // At least the two guides known to reference image-compressor.
    expect(result.length).toBeGreaterThanOrEqual(2);
    const slugs = result.map((g) => g.slug);
    expect(slugs).toContain("jpg-vs-png-vs-webp");
    expect(slugs).toContain("how-image-compression-works");
  });

  it("every returned guide actually references the tool", () => {
    const result = guidesForTool("image-compressor");
    expect(result.every((g) => g.relatedToolSlugs.includes("image-compressor"))).toBe(true);
  });

  it("returns an empty array for an unknown tool slug", () => {
    expect(guidesForTool("no-such-tool")).toEqual([]);
  });

  it("is the exact reverse of guide.relatedToolSlugs (no drift)", () => {
    // For every guide, every tool it lists should map back to that guide.
    for (const g of guides) {
      for (const toolSlug of g.relatedToolSlugs) {
        const back = guidesForTool(toolSlug);
        expect(back.map((x) => x.slug)).toContain(g.slug);
      }
    }
  });
});
