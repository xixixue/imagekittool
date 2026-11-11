import { describe, expect, it } from "vitest";
import {
  CATEGORY_LABELS,
  SIZE_CATEGORIES,
  SIZE_ENTRIES,
  entriesByCategory,
  searchEntries,
  type SizeEntry,
} from "@/lib/data/size-reference";

describe("SIZE_ENTRIES integrity", () => {
  it("every entry has valid fields", () => {
    for (const e of SIZE_ENTRIES) {
      expect(SIZE_CATEGORIES).toContain(e.category);
      expect(e.id.length).toBeGreaterThan(0);
      expect(e.name.length).toBeGreaterThan(0);
      expect(Number.isInteger(e.width) && e.width > 0).toBe(true);
      expect(Number.isInteger(e.height) && e.height > 0).toBe(true);
      expect(e.ratio.length).toBeGreaterThan(0);
      expect(e.formats.length).toBeGreaterThan(0);
      expect(e.description.length).toBeGreaterThan(0);
      expect(e.verifiedAt).toMatch(/^\d{4}-\d{2}$/);
      expect(e.resizerHref.startsWith("/")).toBe(true);
    }
  });

  it("ids are unique", () => {
    const ids = SIZE_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers all 6 categories", () => {
    const covered = new Set(SIZE_ENTRIES.map((e) => e.category));
    expect(covered).toEqual(new Set(SIZE_CATEGORIES));
  });

  it("every category has a label", () => {
    for (const c of SIZE_CATEGORIES) {
      expect(CATEGORY_LABELS[c].length).toBeGreaterThan(0);
    }
  });

  it("descriptions do not claim to be enforced rules", () => {
    // §7 governance: recommended, not enforced.
    for (const e of SIZE_ENTRIES) {
      expect(e.description.toLowerCase()).not.toContain("required");
      expect(e.description.toLowerCase()).not.toContain("mandatory");
      expect(e.description.toLowerCase()).not.toContain("enforced");
    }
  });
});

describe("entriesByCategory", () => {
  it("returns only entries for that category", () => {
    const print = entriesByCategory("print");
    expect(print.length).toBeGreaterThanOrEqual(4);
    expect(print.every((e) => e.category === "print")).toBe(true);
  });

  it("social entries match the social-presets registry count", () => {
    // Derived from SOCIAL_PRESETS — counts must stay in sync.
    const social = entriesByCategory("social");
    expect(social.length).toBe(15);
  });
});

describe("searchEntries", () => {
  it("returns all entries for empty query", () => {
    expect(searchEntries("").length).toBe(SIZE_ENTRIES.length);
  });

  it("matches by name", () => {
    const r = searchEntries("avatar");
    expect(r.length).toBeGreaterThanOrEqual(3);
    expect(r.every((e) => e.name.toLowerCase().includes("avatar"))).toBe(true);
  });

  it("matches by category label", () => {
    const r = searchEntries("print");
    const names = r.map((e: SizeEntry) => e.name);
    expect(names.some((n) => n.includes("Print"))).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(searchEntries("INSTAGRAM").length).toBe(searchEntries("instagram").length);
  });
});
