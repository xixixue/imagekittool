import { describe, expect, it } from "vitest";
import {
  applyRename,
  validatePipeline,
  validateStepParams,
  type BatchStep,
} from "../steps";

describe("validateStepParams", () => {
  it("accepts a valid resize by dimensions", () => {
    const step: BatchStep = {
      type: "resize",
      params: { targetWidth: 800, targetHeight: 600, lockAspect: true },
    };
    expect(validateStepParams(step)).toEqual([]);
  });

  it("accepts a valid percent resize", () => {
    const step: BatchStep = {
      type: "resize",
      params: { lockAspect: true, percent: 50 },
    };
    expect(validateStepParams(step)).toEqual([]);
  });

  it("rejects resize with no target", () => {
    const step: BatchStep = { type: "resize", params: { lockAspect: true } };
    expect(validateStepParams(step)).toContain("resize needs width, height, or percent");
  });

  it("rejects out-of-range percent", () => {
    const step: BatchStep = { type: "resize", params: { lockAspect: true, percent: 150 } };
    expect(validateStepParams(step)).toContain("percent must be 1..100");
  });

  it("rejects compress quality outside 0..1", () => {
    const step: BatchStep = { type: "compress", params: { quality: 1.5 } };
    expect(validateStepParams(step)).toContain("quality must be 0..1");
  });

  it("rejects empty watermark text", () => {
    const step: BatchStep = {
      type: "watermark",
      params: {
        text: " ",
        fontSize: 24,
        color: "#fff",
        opacity: 0.5,
        position: "bottom-right",
        angle: 0,
        repeat: false,
        margin: 8,
      },
    };
    expect(validateStepParams(step)).toContain("watermark text required");
  });

  it("rejects invalid rotate angle", () => {
    const step = { type: "rotate", params: { angle: 45 } } as unknown as BatchStep;
    expect(validateStepParams(step)).toContain("angle must be 0/90/180/270");
  });

  it("accepts a valid rename pattern", () => {
    const step: BatchStep = { type: "rename", params: { pattern: "batch-{n}" } };
    expect(validateStepParams(step)).toEqual([]);
  });
});

describe("validatePipeline", () => {
  it("rejects an empty pipeline", () => {
    expect(validatePipeline([])).toContain("pipeline needs at least one step");
  });

  it("returns no errors for a valid multi-step pipeline", () => {
    const steps: BatchStep[] = [
      { type: "resize", params: { targetWidth: 1000, lockAspect: true } },
      { type: "compress", params: { quality: 0.8 } },
      { type: "rename", params: { pattern: "out-{n}" } },
    ];
    expect(validatePipeline(steps)).toEqual([]);
  });

  it("returns the first failing step's errors", () => {
    const steps: BatchStep[] = [
      { type: "compress", params: { quality: 2 } },
      { type: "rename", params: { pattern: "" } },
    ];
    const errs = validatePipeline(steps);
    expect(errs).toContain("quality must be 0..1");
    expect(errs).not.toContain("rename pattern required");
  });
});

describe("applyRename", () => {
  it("pads the sequence and appends the extension when {ext} is absent", () => {
    expect(applyRename({ pattern: "batch-{n}" }, "photo", "jpg", 0)).toBe("batch-001.jpg");
  });

  it("substitutes {name} and {ext}", () => {
    expect(applyRename({ pattern: "{name}-small.{ext}" }, "photo", "png", 2)).toBe(
      "photo-small.png",
    );
  });

  it("leaves no extension when the original has none and {ext} is absent", () => {
    expect(applyRename({ pattern: "img-{n}" }, "x", "", 0)).toBe("img-001");
  });

  it("zero-pads sequence to 3 digits", () => {
    expect(applyRename({ pattern: "{n}" }, "x", "jpg", 11)).toMatch(/^012/);
  });
});
