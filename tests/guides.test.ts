import { describe, expect, it } from "vitest";
import { guides, guidesForTool, howToFromGuide } from "@/lib/data/guides";

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

describe("howToFromGuide", () => {
  it("derives numbered steps from the list under a 'How to' heading", () => {
    const guide = guides.find((g) => g.slug === "remove-exif-metadata")!;
    const howTo = howToFromGuide(guide);
    expect(howTo).not.toBeNull();
    expect(howTo!.name).toBe(guide.title);
    expect(howTo!.steps.length).toBeGreaterThanOrEqual(3);
    expect(howTo!.steps[0].name).toBe("Step 1");
    expect(howTo!.steps[1].name).toBe("Step 2");
    // Step text mirrors the actual list items rendered on the page (§9.2).
    expect(howTo!.steps.every((s) => s.text.length > 0)).toBe(true);
  });

  it("returns null for a guide with no 'How to' section", () => {
    // jpg-vs-png-vs-webp is a comparison explainer, not a how-to.
    const guide = guides.find((g) => g.slug === "jpg-vs-png-vs-webp")!;
    expect(howToFromGuide(guide)).toBeNull();
  });

  it("every how-to guide's steps are non-empty", () => {
    for (const g of guides) {
      const howTo = howToFromGuide(g);
      if (howTo) {
        expect(howTo.steps.length).toBeGreaterThan(0);
        expect(howTo.steps.every((s) => s.text.length > 0)).toBe(true);
      }
    }
  });
});
