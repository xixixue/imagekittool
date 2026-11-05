import { describe, it, expect } from "vitest";
import { wrapText } from "../meme";

const measure = (line: string) => line.length * 10;

describe("wrapText", () => {
  it("returns no lines for blank text", () => {
    expect(wrapText("   ", 100, measure)).toEqual([]);
  });

  it("fits a single short word on one line", () => {
    expect(wrapText("hello", 100, measure)).toEqual(["hello"]);
  });

  it("wraps when a word would overflow the width", () => {
    // each char is 10 units; width 25 fits "ab" (20) but not "abc" (30)
    expect(wrapText("ab cd ef", 25, measure)).toEqual(["ab", "cd", "ef"]);
  });

  it("keeps words on one line when they exactly fit the width", () => {
    // "ab cd" measures 50 units; width 50 fits it exactly on one line.
    expect(wrapText("ab cd", 50, measure)).toEqual(["ab cd"]);
  });

  it("puts a long single word on its own line", () => {
    expect(wrapText("abcdefghij ab", 25, measure)).toEqual(["abcdefghij", "ab"]);
  });
});
