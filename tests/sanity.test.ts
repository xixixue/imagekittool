import { describe, it, expect } from "vitest";

describe("test harness sanity", () => {
  it("runs assertions", () => {
    expect(1 + 1).toBe(2);
  });
});
