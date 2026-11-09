#!/usr/bin/env python3
"""
Generate the raster demonstration images used by the /guides content center.

These are real, generated bitmap images that show actual image-processing
effects (transparency handling across formats, JPEG compression artifacts, and
EXIF orientation) — the "图文并茂" evidence that an image-tools site benefits
from far more than vector infographics alone.

Outputs go to public/guides/ and are referenced by guide article `image` blocks
in lib/data/guides.ts. Re-run any time; outputs are deterministic.

Run with the bundled Pillow:
  python3 scripts/generate-guide-assets.py
"""

import io
import os
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "guides")
OUT = os.path.abspath(OUT)
os.makedirs(OUT, exist_ok=True)

# Site accent (violet-500) used across the diagrams for brand consistency.
VIOLET = (139, 92, 246)


def font(size: int) -> ImageFont.ImageFont:
    """A sans-serif font, falling back to Pillow's default bitmap font."""
    for p in (
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


def checkerboard(size, sq=20, c1=(220, 220, 224), c2=(245, 245, 248)):
    """A checkerboard used as the backdrop behind transparent regions."""
    img = Image.new("RGB", size, c1)
    d = ImageDraw.Draw(img)
    w, h = size
    for y in range(0, h, sq):
        for x in range(0, w, sq):
            if (x // sq + y // sq) % 2 == 0:
                d.rectangle([x, y, x + sq - 1, y + sq - 1], fill=c2)
    return img


def label_panel(canvas, x, width, text, y=382):
    d = ImageDraw.Draw(canvas)
    d.text((x + width // 2, y), text, fill=(90, 90, 95), font=font(20), anchor="mm")


def dividers(canvas, xs):
    d = ImageDraw.Draw(canvas)
    for x in xs:
        d.line([(x, 0), (x, canvas.size[1])], fill=(205, 205, 210), width=1)


def make_transparency():
    """One source image with transparency, shown as PNG / JPG / WebP."""
    S = 400
    src = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(src)
    d.ellipse([78, 78, 322, 322], fill=VIOLET + (255,))
    d.ellipse([78, 78, 322, 322], outline=(255, 255, 255, 200), width=4)
    d.text((S // 2, S // 2), "ABC", fill=(255, 255, 255, 255), font=font(72), anchor="mm")

    panels = []
    for bg in ("checker", "white", "checker"):
        if bg == "checker":
            base = checkerboard((S, S)).convert("RGBA")
        else:
            base = Image.new("RGBA", (S, S), (255, 255, 255, 255))
        base.alpha_composite(src)
        panels.append(base.convert("RGB"))

    canvas = Image.new("RGB", (1200, 400), (255, 255, 255))
    for i, panel in enumerate(panels):
        canvas.paste(panel, (i * 400, 0))
    label_panel(canvas, 0, 400, "PNG")
    label_panel(canvas, 400, 400, "JPG")
    label_panel(canvas, 800, 400, "WebP")
    dividers(canvas, [400, 800])
    canvas.save(os.path.join(OUT, "transparency-formats.png"))
    print("transparency-formats.png", canvas.size)


def make_quality():
    """A detailed source photograph at JPEG quality 95 / 70 / 30."""
    S = 400
    src = Image.new("RGB", (S, S), (255, 255, 255))
    d = ImageDraw.Draw(src)
    # Smooth sky gradient — where blocking shows first.
    for y in range(S):
        t = y / S
        d.line([(0, y), (S, y)], fill=(int(135 + 45 * t), int(180 + 20 * t), int(235 - 15 * t)))
    # A sharp-edged sun (ringing appears around it).
    d.ellipse([250, 70, 330, 150], fill=(255, 222, 90), outline=(255, 180, 0), width=2)
    # A high-frequency checkerboard patch (worst case for lossy).
    for y in range(280, 380, 8):
        for x in range(20, 220, 8):
            fill = (70, 70, 70) if (x // 8 + y // 8) % 2 == 0 else (205, 205, 205)
            d.rectangle([x, y, x + 7, y + 7], fill=fill)
    # A diagonal edge with a contrasting triangle.
    d.polygon([(20, 280), (220, 200), (220, 280)], fill=(170, 110, 55))
    # Text with sharp edges (ringing around glyphs).
    d.text((36, 36), "Detail", fill=(35, 35, 40), font=font(40))
    # Photographic noise so the gradient is not perfectly smooth.
    px = src.load()
    rng = random.Random(7)
    for _ in range(9000):
        x, y = rng.randint(0, S - 1), rng.randint(0, S - 1)
        r, g, b = px[x, y]
        n = rng.randint(-14, 14)
        px[x, y] = (max(0, min(255, r + n)), max(0, min(255, g + n)), max(0, min(255, b + n)))

    panels = []
    for q in (95, 70, 30):
        buf = io.BytesIO()
        src.save(buf, format="JPEG", quality=q)
        buf.seek(0)
        panels.append(Image.open(buf).convert("RGB"))

    canvas = Image.new("RGB", (1200, 400), (255, 255, 255))
    for i, panel in enumerate(panels):
        canvas.paste(panel, (i * 400, 0))
    label_panel(canvas, 0, 400, "Quality 95")
    label_panel(canvas, 400, 400, "Quality 70")
    label_panel(canvas, 800, 400, "Quality 30")
    dividers(canvas, [400, 800])
    canvas.save(os.path.join(OUT, "quality-comparison.png"))
    print("quality-comparison.png", canvas.size)


def make_exif():
    """A scene shown two ways: stored (EXIF orientation 6, rotated) vs displayed."""
    S = 400
    src = Image.new("RGB", (S, S), (248, 248, 252))
    d = ImageDraw.Draw(src)
    d.rectangle([0, 0, S - 1, S - 1], outline=(205, 205, 212), width=2)
    d.text((36, 32), "TOP", fill=VIOLET, font=font(58))
    # An up arrow so orientation is unambiguous.
    d.polygon([(200, 90), (176, 130), (224, 130)], fill=VIOLET)
    d.rectangle([(194, 130), (206, 210)], fill=VIOLET)
    # A landmark in the bottom-right corner.
    d.ellipse([280, 280, 360, 360], outline=VIOLET, width=4)
    d.text((320, 320), "BR", fill=VIOLET, font=font(30), anchor="mm")

    # EXIF orientation 6 = "rotate 90° CW for display". The stored pixels are
    # therefore the scene rotated 90° clockwise; a compliant viewer rotates them
    # back to display upright.
    stored = src.rotate(-90, expand=True)  # 90° clockwise
    upright = src

    canvas = Image.new("RGB", (800, 400), (255, 255, 255))
    canvas.paste(stored, (0, 0))
    canvas.paste(upright, (400, 0))
    d2 = ImageDraw.Draw(canvas)
    d2.text((200, 386), "Stored pixels (EXIF orientation = 6)", fill=(90, 90, 95), font=font(15), anchor="mm")
    d2.text((600, 386), "Displayed (viewer honors the tag)", fill=(90, 90, 95), font=font(15), anchor="mm")
    dividers(canvas, [400])
    canvas.save(os.path.join(OUT, "exif-orientation-demo.png"))
    print("exif-orientation-demo.png", canvas.size)


def make_gradient_banding():
    """Limited color depth (banding) vs full depth (smooth), side by side."""
    S = 400
    # A full-range blue gradient.
    base = Image.new("RGB", (S, S), (0, 0, 0))
    d = ImageDraw.Draw(base)
    for y in range(S):
        t = y / S
        d.line([(0, y), (S, y)], fill=(int(60 + 120 * t), int(110 + 80 * t), int(190 + 50 * t)))

    # Left: posterize to 8 levels per channel -> obvious horizontal bands.
    step = 32
    left = base.copy()
    lpx = left.load()
    for y in range(S):
        for x in range(S):
            r, g, b = lpx[x, y]
            lpx[x, y] = ((r // step) * step, (g // step) * step, (b // step) * step)

    # Right: the smooth original.
    right = base

    canvas = Image.new("RGB", (1200, 400), (255, 255, 255))
    canvas.paste(left, (0, 0))
    canvas.paste(right, (400, 0))
    canvas.paste(base, (800, 0))
    label_panel(canvas, 0, 400, "Limited depth (banding)")
    label_panel(canvas, 400, 400, "Full depth (smooth)")
    label_panel(canvas, 800, 400, "Original gradient")
    dividers(canvas, [400, 800])
    canvas.save(os.path.join(OUT, "gradient-banding.png"))
    print("gradient-banding.png", canvas.size)


def make_resize_crop_demo():
    """Resizing to a new ratio distorts; cropping to it does not."""
    S = 400
    src = Image.new("RGB", (S, S), (235, 238, 245))
    d = ImageDraw.Draw(src)
    # A centered circle so distortion (circle -> ellipse) is unmistakable.
    d.ellipse([120, 120, 280, 280], fill=VIOLET, outline=(255, 255, 255), width=3)
    d.text((200, 200), "1:1", fill=(255, 255, 255), font=font(40), anchor="mm")
    # Corner landmarks so cropping is visible too.
    d.rectangle([8, 8, 60, 60], outline=(120, 120, 130), width=3)
    d.rectangle([340, 340, 392, 392], outline=(120, 120, 130), width=3)

    target = (400, 225)  # 16:9
    resized = src.resize(target)  # squashed -> circle becomes ellipse
    # Center-crop the 400x400 to 400x225: drop (400-225)/2 = 87 px top and bottom.
    cropped = src.crop((0, 87, 400, 312))

    canvas = Image.new("RGB", (1200, 400), (255, 255, 255))
    canvas.paste(src, (0, 0))
    canvas.paste(resized, (400, 87))
    canvas.paste(cropped, (800, 87))
    label_panel(canvas, 0, 400, "Original 1:1 (400x400)")
    label_panel(canvas, 400, 400, "Resized to 16:9 (distorted)")
    label_panel(canvas, 800, 400, "Cropped to 16:9 (correct)")
    dividers(canvas, [400, 800])
    canvas.save(os.path.join(OUT, "resize-crop-demo.png"))
    print("resize-crop-demo.png", canvas.size)


def _outlined_text(draw, xy, text, f, fill=(255, 255, 255), outline=(0, 0, 0), anchor="mm"):
    """Draw text with a black outline (classic meme-caption style)."""
    x, y = xy
    for dx in (-2, 0, 2):
        for dy in (-2, 0, 2):
            if dx == 0 and dy == 0:
                continue
            draw.text((x + dx, y + dy), text, fill=outline, font=f, anchor=anchor)
    draw.text((x, y), text, fill=fill, font=f, anchor=anchor)


def make_meme_sample():
    """A sample meme with white outlined Impact-style top and bottom captions."""
    W, H = 800, 400
    # A simple "scene": sky gradient + ground + a silhouette.
    img = Image.new("RGB", (W, H), (255, 255, 255))
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        if y < H * 0.62:
            d.line([(0, y), (W, y)], fill=(int(120 + 60 * t), int(170 + 40 * t), int(225 - 20 * t)))
        else:
            tt = (y - H * 0.62) / (H * 0.38)
            d.line([(0, y), (W, y)], fill=(int(90 - 40 * tt), int(110 - 50 * tt), int(70 - 30 * tt)))
    # A simple silhouette (a sitting shape).
    d.ellipse([320, 180, 480, 320], fill=(30, 30, 35))
    d.ellipse([350, 150, 450, 230], fill=(30, 30, 35))

    f = font(46)
    _outlined_text(d, (W // 2, 30), "WHEN THE IMAGE", f, anchor="ma")
    _outlined_text(d, (W // 2, H - 24), "FINALLY LOADS", f, anchor="md")
    img.save(os.path.join(OUT, "meme-sample.png"))
    print("meme-sample.png", img.size)


def make_watermark_demo():
    """Original, single visible watermark, and tiled watermark."""
    S = 400
    src = Image.new("RGB", (S, S), (245, 245, 250))
    d = ImageDraw.Draw(src)
    d.rectangle([0, 0, S - 1, S - 1], outline=(210, 210, 220), width=2)
    d.ellipse([100, 100, 300, 300], fill=VIOLET)
    d.text((200, 200), "IMG", fill=(255, 255, 255), font=font(56), anchor="mm")

    mark = "SAMPLE"
    f = font(40)

    # Single watermark.
    single = src.copy()
    sd = ImageDraw.Draw(single)
    sd.text((200, 200), mark, fill=(255, 255, 255, 160), font=f, anchor="mm")

    # Tiled watermark (diagonal).
    tile_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    td = ImageDraw.Draw(tile_layer)
    spacing = 130
    for y in range(-S, S * 2, spacing):
        for x in range(-S, S * 2, spacing):
            td.text((x, y), mark, fill=(255, 255, 255, 110), font=f)
    tile_layer = tile_layer.rotate(35, resample=Image.BICUBIC, expand=False)
    tiled = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    tiled.paste(src.convert("RGBA"), (0, 0))
    tiled.alpha_composite(tile_layer)
    tiled = tiled.convert("RGB")

    canvas = Image.new("RGB", (1200, 400), (255, 255, 255))
    canvas.paste(src, (0, 0))
    canvas.paste(single, (400, 0))
    canvas.paste(tiled, (800, 0))
    label_panel(canvas, 0, 400, "Original")
    label_panel(canvas, 400, 400, "Single watermark")
    label_panel(canvas, 800, 400, "Tiled watermark")
    dividers(canvas, [400, 800])
    canvas.save(os.path.join(OUT, "watermark-demo.png"))
    print("watermark-demo.png", canvas.size)


def make_blur_pixelate_demo():
    """Original, blurred region, and pixelated region — privacy redaction."""
    S = 400
    src = Image.new("RGB", (S, S), (225, 230, 238))
    d = ImageDraw.Draw(src)
    # A background pattern so redaction is visible.
    for y in range(0, S, 40):
        d.line([(0, y), (S, y)], fill=(210, 215, 225))
    d.rectangle([0, 0, S - 1, S - 1], outline=(190, 195, 205), width=2)
    # A "face" in the center to redact.
    fx0, fy0, fx1, fy1 = 140, 140, 260, 260
    d.ellipse([fx0, fy0, fx1, fy1], fill=(245, 215, 180))  # skin tone
    d.ellipse([170, 175, 185, 190], fill=(40, 40, 50))  # left eye
    d.ellipse([215, 175, 230, 190], fill=(40, 40, 50))  # right eye
    d.arc([170, 205, 230, 235], 0, 180, fill=(120, 70, 60), width=3)  # smile

    face_box = (fx0, fy0, fx1, fy1)

    # Blurred: crop the face region, blur, paste back.
    blurred = src.copy()
    face = src.crop(face_box)
    blurred_face = face.filter(ImageFilter.GaussianBlur(radius=14))
    blurred.paste(blurred_face, (fx0, fy0))

    # Pixelated: crop, shrink to 12px, scale back up, paste.
    pixelated = src.copy()
    face = src.crop(face_box)
    small = face.resize((12, 12), Image.BOX)
    big = small.resize((fx1 - fx0, fy1 - fy0), Image.NEAREST)
    pixelated.paste(big, (fx0, fy0))

    canvas = Image.new("RGB", (1200, 400), (255, 255, 255))
    canvas.paste(src, (0, 0))
    canvas.paste(blurred, (400, 0))
    canvas.paste(pixelated, (800, 0))
    label_panel(canvas, 0, 400, "Original")
    label_panel(canvas, 400, 400, "Blurred")
    label_panel(canvas, 800, 400, "Pixelated")
    dividers(canvas, [400, 800])
    canvas.save(os.path.join(OUT, "blur-pixelate-demo.png"))
    print("blur-pixelate-demo.png", canvas.size)


if __name__ == "__main__":
    make_transparency()
    make_quality()
    make_exif()
    make_gradient_banding()
    make_resize_crop_demo()
    make_meme_sample()
    make_watermark_demo()
    make_blur_pixelate_demo()
    print("done ->", OUT)
