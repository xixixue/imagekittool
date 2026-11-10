import exifr from "exifr";

/**
 * EXIF parsing for the EXIF Viewer tool (SPEC V2 §4.2 P0).
 *
 * Parsing is 100% browser-local (exifr reads the File bytes in-page); the image
 * is never uploaded. We expose a small, pure `buildExifGroups` over the raw exifr
 * output so the grouping logic is unit-testable without a real EXIF-bearing
 * image, and `parseExif` is the thin async wrapper used by the client.
 *
 * Field labels are deliberately the standard photography terms (Make, Model,
 * Focal length…): they are technical and largely locale-stable, like most pro
 * EXIF tools. Group *headers* are localized by the client via the group `key`.
 */

export type ExifGroupKey = "image" | "camera" | "settings" | "gps";

export interface ExifField {
  label: string;
  value: string;
}

export interface ExifGroup {
  key: ExifGroupKey;
  fields: ExifField[];
}

export interface GpsCoords {
  latitude: number;
  longitude: number;
}

export interface ParsedExif {
  groups: ExifGroup[];
  gps: GpsCoords | null;
  /** The raw merged exifr output, for an "all fields" fallback view. */
  raw: Record<string, number | string | Date | null>;
}

/** Format a raw exif value into a display string. */
function fmt(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) {
    // Drop milliseconds + tz for a stable, readable timestamp.
    return v.toISOString().replace("T", " ").slice(0, 19);
  }
  if (typeof v === "number") {
    return Number.isInteger(v) ? String(v) : v.toFixed(2);
  }
  return String(v);
}

/** Format an exposure time (seconds) as e.g. 1/250 s, or plain for >= 1s. */
function fmtExposure(v: unknown): string {
  if (typeof v !== "number" || v <= 0) return fmt(v);
  if (v >= 1) return `${v.toFixed(0)} s`;
  const denom = Math.round(1 / v);
  return `1/${denom} s`;
}

/** Build a field only when the value is non-empty. */
function field(label: string, v: unknown, format: (v: unknown) => string = fmt): ExifField | null {
  if (v == null) return null;
  const value = format(v);
  return value ? { label, value } : null;
}

function pushField(arr: ExifField[], label: string, v: unknown, format?: (v: unknown) => string): void {
  const f = field(label, v, format);
  if (f) arr.push(f);
}

/**
 * Build structured, display-ready EXIF groups from a raw merged exifr output.
 * Pure — no I/O — so it can be unit tested with a plain object.
 */
export function buildExifGroups(raw: Record<string, unknown>): ExifGroup[] {
  const groups: ExifGroup[] = [];

  const image: ExifField[] = [];
  const w = raw.ImageWidth ?? raw.ExifImageWidth ?? raw.width;
  const h = raw.ImageHeight ?? raw.ExifImageHeight ?? raw.height;
  if (w != null || h != null) {
    image.push({ label: "Dimensions", value: `${w ?? "?"} × ${h ?? "?"}` });
  }
  pushField(image, "Orientation", raw.Orientation);
  pushField(image, "Software", raw.Software);
  pushField(image, "Date taken", raw.DateTimeOriginal ?? raw.CreateDate);
  if (image.length > 0) groups.push({ key: "image", fields: image });

  const camera: ExifField[] = [];
  pushField(camera, "Make", raw.Make);
  pushField(camera, "Model", raw.Model);
  pushField(camera, "Lens", raw.LensModel ?? raw.LensModel);
  if (camera.length > 0) groups.push({ key: "camera", fields: camera });

  const settings: ExifField[] = [];
  pushField(settings, "Focal length", raw.FocalLength, (v) => `${fmt(v)} mm`);
  pushField(settings, "F-number", raw.FNumber, (v) => `f/${fmt(v)}`);
  pushField(settings, "Exposure time", raw.ExposureTime, fmtExposure);
  pushField(settings, "ISO", raw.ISO, (v) => `ISO ${fmt(v)}`);
  pushField(
    settings,
    "White balance",
    raw.WhiteBalance,
    (v) => (Number(v) === 0 ? "Auto" : "Manual"),
  );
  if (settings.length > 0) groups.push({ key: "settings", fields: settings });

  return groups;
}

/** Extract GPS coordinates (decimal degrees) from the raw exifr output. */
export function extractGps(raw: Record<string, unknown>): GpsCoords | null {
  const lat = raw.GPSLatitude ?? raw.latitude;
  const lon = raw.GPSLongitude ?? raw.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { latitude: lat, longitude: lon };
}

/**
 * Parse EXIF/IPTC/XMP/JFIF/ICC from an image File/Blob, entirely in the
 * browser. Returns structured groups + GPS + the raw merged output. Throws if
 * exifr cannot read the input (the client shows the error).
 */
export async function parseExif(file: File | Blob): Promise<ParsedExif> {
  const raw = (await exifr.parse(file, {
    tiff: true,
    exif: true,
    gps: true,
    iptc: true,
    xmp: true,
    jfif: true,
    icc: true,
    mergeOutput: true,
  })) as Record<string, unknown> | null;
  const data = raw ?? {};
  return {
    groups: buildExifGroups(data),
    gps: extractGps(data),
    raw: data as ParsedExif["raw"],
  };
}
