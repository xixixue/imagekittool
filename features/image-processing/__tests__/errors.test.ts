import { describe, expect, it } from "vitest";
import { ProcessingError } from "../errors";

describe("ProcessingError", () => {
  it("is an Error carrying a stable i18n code + params", () => {
    const err = new ProcessingError("imageTooLarge", "Image is too large.", {
      pixels: "49.0 MP",
      limit: "40.0 MP",
    });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("ProcessingError");
    expect(err.code).toBe("imageTooLarge");
    expect(err.params).toEqual({ pixels: "49.0 MP", limit: "40.0 MP" });
    expect(err.message).toBe("Image is too large.");
  });

  it("allows omitting params", () => {
    const err = new ProcessingError("unsupportedFormat", "Unsupported format.");
    expect(err.code).toBe("unsupportedFormat");
    expect(err.params).toBeUndefined();
  });
});
