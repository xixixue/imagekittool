import { describe, expect, it } from "vitest";
import { allPages, parsePageRange } from "../pages";

describe("parsePageRange", () => {
  it("parses mixed ranges and single pages", () => {
    expect(parsePageRange("1-3,5,7-9", 10)).toEqual([1, 2, 3, 5, 7, 8, 9]);
  });

  it("returns all pages for empty input", () => {
    expect(parsePageRange("", 5)).toEqual([1, 2, 3, 4, 5]);
    expect(parsePageRange("   ", 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("clamps out-of-range pages to the max", () => {
    expect(parsePageRange("1,5,99", 10)).toEqual([1, 5, 10]);
  });

  it("handles reversed ranges", () => {
    expect(parsePageRange("5-2", 10)).toEqual([2, 3, 4, 5]);
  });

  it("de-duplicates overlapping ranges", () => {
    expect(parsePageRange("1-5,3-7", 10)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("ignores invalid tokens", () => {
    expect(parsePageRange("abc,2,1-x", 10)).toEqual([2]);
  });

  it("returns [] for a document with no pages", () => {
    expect(parsePageRange("1,2", 0)).toEqual([]);
  });
});

describe("allPages", () => {
  it("lists 1..max", () => {
    expect(allPages(4)).toEqual([1, 2, 3, 4]);
    expect(allPages(0)).toEqual([]);
  });
});
