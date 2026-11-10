import { describe, expect, it } from "vitest";
import {
  AnalyticsEvent,
  durationBucket,
  fileCountBucket,
  sanitizeError,
  sizeBucket,
} from "@/lib/analytics/events";

describe("AnalyticsEvent", () => {
  it("exposes the canonical V2 §13.1 event names", () => {
    expect(AnalyticsEvent.toolView).toBe("tool_view");
    expect(AnalyticsEvent.fileSelected).toBe("file_selected");
    expect(AnalyticsEvent.batchStarted).toBe("batch_started");
    expect(AnalyticsEvent.batchCompleted).toBe("batch_completed");
    expect(AnalyticsEvent.downloadClicked).toBe("download_clicked");
    expect(AnalyticsEvent.cloudSaveStarted).toBe("cloud_save_started");
    expect(AnalyticsEvent.cloudSaveCompleted).toBe("cloud_save_completed");
    expect(AnalyticsEvent.signupCompleted).toBe("signup_completed");
  });
});

describe("fileCountBucket", () => {
  it.each([
    [0, "0"],
    [1, "1"],
    [3, "2-5"],
    [5, "2-5"],
    [7, "6-10"],
    [10, "6-10"],
    [20, "11-20"],
    [25, "21+"],
  ] as const)("%i files -> %s", (count, expected) => {
    expect(fileCountBucket(count)).toBe(expected);
  });
});

describe("sizeBucket", () => {
  it.each([
    [0, "0"],
    [50 * 1024, "<100KB"],
    [200 * 1024, "100-500KB"],
    [800 * 1024, "500KB-1MB"],
    [2 * 1024 * 1024, "1-5MB"],
    [7 * 1024 * 1024, "5-10MB"],
    [15 * 1024 * 1024, "10MB+"],
  ] as const)("%s bytes -> %s", (bytes, expected) => {
    expect(sizeBucket(bytes)).toBe(expected);
  });
});

describe("durationBucket", () => {
  it.each([
    [100, "<0.5s"],
    [1000, "0.5-2s"],
    [3000, "2-5s"],
    [7000, "5-10s"],
    [12000, "10s+"],
  ] as const)("%ims -> %s", (ms, expected) => {
    expect(durationBucket(ms)).toBe(expected);
  });
});

describe("sanitizeError", () => {
  it("returns 'unknown' for null/undefined", () => {
    expect(sanitizeError(null)).toBe("unknown");
    expect(sanitizeError(undefined)).toBe("unknown");
  });

  it("lowercases and strips non-alphanumerics from a named error", () => {
    const err = new Error("boom");
    err.name = "QuotaExceededError";
    expect(sanitizeError(err)).toBe("quotaexceedederror");
  });

  it("falls back to 'error' for a generic Error", () => {
    expect(sanitizeError(new Error("boom"))).toBe("error");
  });

  it("returns 'error' for non-Error thrown values", () => {
    expect(sanitizeError("a string")).toBe("error");
    expect(sanitizeError(42)).toBe("error");
  });
});
