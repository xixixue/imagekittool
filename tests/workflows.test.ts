import { describe, expect, it } from "vitest";
import { validatePipeline } from "@/features/batch-engine/steps";
import { WORKFLOWS, getWorkflow } from "@/lib/data/workflows";

describe("WORKFLOWS integrity", () => {
  it("every workflow has id/name/tagline/description", () => {
    for (const w of WORKFLOWS) {
      expect(w.id.length).toBeGreaterThan(0);
      expect(w.name.length).toBeGreaterThan(0);
      expect(w.tagline.length).toBeGreaterThan(0);
      expect(w.description.length).toBeGreaterThan(0);
    }
  });

  it("ids are unique", () => {
    const ids = WORKFLOWS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every workflow has exactly one of steps or routeTo", () => {
    for (const w of WORKFLOWS) {
      const hasSteps = Array.isArray(w.steps) && w.steps.length > 0;
      const hasRoute = typeof w.routeTo === "string" && w.routeTo.startsWith("/");
      expect(hasSteps || hasRoute).toBe(true);
      // Not both — a workflow either runs a local chain or routes, not both.
      expect(hasSteps && hasRoute).toBe(false);
    }
  });

  it("pipeline workflows have valid steps", () => {
    for (const w of WORKFLOWS) {
      if (w.steps) {
        expect(validatePipeline(w.steps)).toEqual([]);
      }
    }
  });
});

describe("getWorkflow", () => {
  it("finds by id", () => {
    expect(getWorkflow("optimize-website")?.name).toBe("Optimize for Website");
  });
  it("returns undefined for unknown id", () => {
    expect(getWorkflow("nope")).toBeUndefined();
  });
});
