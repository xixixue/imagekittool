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

from PIL import Image, ImageDraw, ImageFont

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


if __name__ == "__main__":
    make_transparency()
    make_quality()
    make_exif()
    print("done ->", OUT)
