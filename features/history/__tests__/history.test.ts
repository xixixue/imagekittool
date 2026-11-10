import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHistoryInput } from "../build";
import { addLocalHistory, clearLocalHistory, loadLocalHistory, removeLocalHistory } from "../local";

describe("buildHistoryInput", () => {
  it("aggregates formats + size buckets and drops duplicates (privacy-safe)", () => {
    const input = buildHistoryInput({
      toolType: "image-compressor",
      inputs: [
        { format: "jpg", sizeBytes: 3 * 1024 * 1024 },
        { format: "jpg", sizeBytes: 2 * 1024 * 1024 },
        { format: "png", sizeBytes: 8 * 1024 * 1024 },
      ],
      outputs: [
        { format: "jpg", sizeBytes: 200 * 1024 },
        { format: "jpg", sizeBytes: 150 * 1024 },
        { format: "jpg", sizeBytes: 300 * 1024 },
      ],
      parameters: { quality: 80 },
    });
    expect(input.toolType).toBe("image-compressor");
    expect(input.inputMeta.count).toBe(3);
    expect(input.inputMeta.formats).toEqual(["jpg", "png"]);
    expect(input.inputMeta.sizeBuckets).toEqual(["1-5MB", "5-10MB"]);
    expect(input.outputMeta.count).toBe(3);
    expect(input.outputMeta.formats).toEqual(["jpg"]);
    expect(input.outputMeta.sizeBuckets).toEqual(["100-500KB"]);
    expect(input.parameters).toEqual({ quality: 80 });
  });

  it("marks unknown format when missing", () => {
    const input = buildHistoryInput({
      toolType: "image-resizer",
      inputs: [{ sizeBytes: 500 }],
      outputs: [{ sizeBytes: 300 }],
      parameters: {},
    });
    expect(input.inputMeta.formats).toEqual(["unknown"]);
    expect(input.outputMeta.sizeBuckets).toEqual(["<100KB"]);
  });

  it("truncates oversized parameters defensively", () => {
    const huge = { blob: "x".repeat(5000) };
    const input = buildHistoryInput({
      toolType: "image-compressor",
      inputs: [{ format: "jpg", sizeBytes: 1024 }],
      outputs: [{ format: "jpg", sizeBytes: 512 }],
      parameters: huge,
    });
    expect(input.parameters).toEqual({ truncated: true });
  });
});

describe("local history storage", () => {
  // Vitest runs in the node environment (no window/localStorage). local.ts is
  // SSR-safe (no-ops without window), so install a minimal localStorage mock
  // for these round-trip tests.
  const store = new Map<string, string>();
  beforeAll(() => {
    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: {
          getItem: (k: string) => store.get(k) ?? null,
          setItem: (k: string, v: string) => {
            store.set(k, v);
          },
          removeItem: (k: string) => {
            store.delete(k);
          },
          clear: () => store.clear(),
        },
      },
      configurable: true,
      writable: true,
    });
  });
  afterAll(() => {
    delete (globalThis as { window?: unknown }).window;
  });
  beforeEach(() => {
    store.clear();
  });

  it("round-trips add/load/remove/clear in localStorage", () => {
    expect(loadLocalHistory()).toEqual([]);

    const a = addLocalHistory({
      toolType: "image-compressor",
      inputMeta: { count: 1, formats: ["jpg"], sizeBuckets: ["1-5MB"] },
      outputMeta: { count: 1, formats: ["jpg"], sizeBuckets: ["100-500KB"] },
      parameters: { quality: 80 },
    });
    const b = addLocalHistory({
      toolType: "image-resizer",
      inputMeta: { count: 1, formats: ["png"], sizeBuckets: ["1-5MB"] },
      outputMeta: { count: 1, formats: ["png"], sizeBuckets: ["<100KB"] },
      parameters: { width: 800 },
    });
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();

    // Newest first.
    const loaded = loadLocalHistory();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].toolType).toBe("image-resizer");
    expect(loaded[1].toolType).toBe("image-compressor");
    expect(loaded[0].createdAt).toBeTruthy();

    removeLocalHistory(loaded[0].id);
    expect(loadLocalHistory()).toHaveLength(1);
    expect(loadLocalHistory()[0].toolType).toBe("image-compressor");

    clearLocalHistory();
    expect(loadLocalHistory()).toEqual([]);
  });
});
