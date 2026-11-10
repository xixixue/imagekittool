import { describe, expect, it } from "vitest";
import { buildExifGroups, extractGps } from "../parse";

describe("buildExifGroups", () => {
  it("builds image + camera + settings groups from a realistic exif object", () => {
    const groups = buildExifGroups({
      ImageWidth: 4000,
      ImageHeight: 3000,
      Make: "Canon",
      Model: "EOS R6",
      LensModel: "RF 24-105mm",
      FocalLength: 50,
      FNumber: 4,
      ExposureTime: 0.004,
      ISO: 200,
      WhiteBalance: 0,
      DateTimeOriginal: new Date("2024-06-15T10:30:00Z"),
      Software: "Adobe Lightroom",
    });

    const keys = groups.map((g) => g.key);
    expect(keys).toEqual(["image", "camera", "settings"]);

    const image = groups[0];
    expect(image.fields.find((f) => f.label === "Dimensions")?.value).toBe("4000 × 3000");
    expect(image.fields.find((f) => f.label === "Date taken")?.value).toBe("2024-06-15 10:30:00");
    expect(image.fields.find((f) => f.label === "Software")?.value).toBe("Adobe Lightroom");

    const camera = groups[1];
    expect(camera.fields.find((f) => f.label === "Make")?.value).toBe("Canon");
    expect(camera.fields.find((f) => f.label === "Model")?.value).toBe("EOS R6");
    expect(camera.fields.find((f) => f.label === "Lens")?.value).toBe("RF 24-105mm");

    const settings = groups[2];
    expect(settings.fields.find((f) => f.label === "Focal length")?.value).toBe("50 mm");
    expect(settings.fields.find((f) => f.label === "F-number")?.value).toBe("f/4");
    expect(settings.fields.find((f) => f.label === "Exposure time")?.value).toBe("1/250 s");
    expect(settings.fields.find((f) => f.label === "ISO")?.value).toBe("ISO 200");
    expect(settings.fields.find((f) => f.label === "White balance")?.value).toBe("Auto");
  });

  it("formats exposure >= 1s as a plain seconds value", () => {
    const groups = buildExifGroups({ ExposureTime: 2 });
    expect(groups[0].fields.find((f) => f.label === "Exposure time")?.value).toBe("2 s");
  });

  it("omits empty groups and skips null/undefined fields", () => {
    const groups = buildExifGroups({ Make: null, Model: undefined, FocalLength: 35 });
    // Only the settings group (Focal length) survives; image/camera are empty.
    expect(groups.map((g) => g.key)).toEqual(["settings"]);
    expect(groups[0].fields).toHaveLength(1);
  });

  it("returns no groups for an empty object", () => {
    expect(buildExifGroups({})).toEqual([]);
  });
});

describe("extractGps", () => {
  it("reads decimal GPS coordinates", () => {
    expect(extractGps({ GPSLatitude: 48.8584, GPSLongitude: 2.2945 })).toEqual({
      latitude: 48.8584,
      longitude: 2.2945,
    });
  });

  it("returns null when GPS is absent or non-numeric", () => {
    expect(extractGps({})).toBeNull();
    expect(extractGps({ GPSLatitude: "48.8584" })).toBeNull();
    expect(extractGps({ GPSLatitude: NaN, GPSLongitude: 2.29 })).toBeNull();
  });
});
