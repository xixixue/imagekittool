import { validatePixels } from "./limits";
import type { DecodedImage, ImageFormat } from "./types";

/**
 * Decode a File into an ImageBitmap, applying EXIF orientation natively.
 *
 * Modern Chrome/Edge/Firefox/Safari support `createImageBitmap(blob,
 * { imageOrientation: 'from-image' })`, which applies the EXIF orientation tag
 * during decode (SPEC §5: test phone-photo orientation). We feature-detect by
 * attempting it and falling back to a plain decode on older browsers.
 */
export async function decodeToImage(file: File, format: ImageFormat): Promise<DecodedImage> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    } as ImageBitmapOptions);
  } catch {
    bitmap = await createImageBitmap(file);
  }

  const px = validatePixels(bitmap.width, bitmap.height);
  if (!px.ok) {
    bitmap.close?.();
    throw new Error(px.error ?? "Image is too large to process.");
  }

  return {
    bitmap,
    width: bitmap.width,
    height: bitmap.height,
    format,
    name: file.name,
  };
}

/** Release an ImageBitmap and any temporary resources (SPEC §5). */
export function releaseImage(image: DecodedImage): void {
  try {
    image.bitmap.close?.();
  } catch {
    // ignore
  }
}
