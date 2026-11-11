import { describe, expect, it } from "vitest";
import {
  PLATFORMS,
  SOCIAL_PRESETS,
  getPreset,
  presetsByPlatform,
  presetsByScene,
  type SocialPreset,
} from "@/lib/data/social-presets";

describe("SOCIAL_PRESETS integrity", () => {
  it("every preset has valid fields", () => {
    for (const p of SOCIAL_PRESETS) {
      expect(typeof p.id).toBe("string");
      expect(p.id.length).toBeGreaterThan(0);
      expect(PLATFORMS).toContain(p.platform);
      expect(Number.isInteger(p.width) && p.width > 0).toBe(true);
      expect(Number.isInteger(p.height) && p.height > 0).toBe(true);
      expect(typeof p.ratio).toBe("string");
      expect(p.ratio.length).toBeGreaterThan(0);
      expect(typeof p.description).toBe("string");
      expect(p.description.length).toBeGreaterThan(0);
      expect(p.verifiedAt).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it("ids are unique", () => {
    const ids = SOCIAL_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers all 5 platforms", () => {
    const covered = new Set(SOCIAL_PRESETS.map((p) => p.platform));
    expect(covered).toEqual(new Set(PLATFORMS));
  });

  it("descriptions do not claim to be enforced platform rules", () => {
    // §7: must not describe unverified sizes as official enforced specs.
    for (const p of SOCIAL_PRESETS) {
      expect(p.description.toLowerCase()).not.toContain("required");
      expect(p.description.toLowerCase()).not.toContain("mandatory");
      expect(p.description.toLowerCase()).not.toContain("enforced");
    }
  });
});

describe("preset selectors", () => {
  it("presetsByPlatform returns only that platform's enabled presets", () => {
    const ig = presetsByPlatform("instagram");
    expect(ig.length).toBeGreaterThan(0);
    expect(ig.every((p) => p.platform === "instagram" && p.enabled)).toBe(true);
  });

  it("presetsByScene crosses platforms", () => {
    const profiles = presetsByScene("profile");
    expect(profiles.length).toBeGreaterThanOrEqual(5);
    const platforms = new Set(profiles.map((p) => p.platform));
    expect(platforms.size).toBe(5);
  });

  it("getPreset finds by id and returns undefined for unknown", () => {
    expect(getPreset("ig-post")?.name).toBe("Instagram Post");
    expect(getPreset("nope")).toBeUndefined();
  });
});

describe("aspect ratios", () => {
  const cases: { id: string; w: number; h: number }[] = SOCIAL_PRESETS.map(
    (p: SocialPreset) => ({ id: p.id, w: p.width, h: p.height }),
  );
  it("square presets have 1:1 ratio", () => {
    const squares = cases.filter((c) => c.w === c.h);
    for (const c of squares) {
      expect(getPreset(c.id)?.ratio).toBe("1:1");
    }
  });
});
