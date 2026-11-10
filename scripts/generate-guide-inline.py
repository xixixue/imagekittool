#!/usr/bin/env python3
"""Generate the INLINE (in-body) illustrations for the guides via wan2.7-image-pro.

Distinct from the covers (`scripts/generate-guide-covers.py`): each inline
illustration depicts the specific concept its article teaches, not the same
image as the cover. Saves compact WebP (<=120KB) under
public/guides/<slug>-inline.webp and verifies non-blank.

Usage:
  python3 scripts/generate-guide-inline.py            # all 12
  python3 scripts/generate-guide-inline.py <slug>     # just one
"""
import json
import os
import statistics
import sys
import time
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "guides")
TARGET_KB = 120

STYLE = (
    ", professional flat editorial illustration, clean modern infographic style, "
    "violet and purple accent palette, soft light background, minimal, no "
    "watermark, no signature"
)

# Each prompt STRICTLY depicts the article's specific subject (the concept the
# article teaches), distinct from the cover illustration for the same article.
INLINE_PROMPTS = {
    "jpg-vs-png-vs-webp": "a professional editorial illustration of three sample images — a product photograph, a transparent logo over a colored background, and a modern web hero banner — each connected by an arrow to its recommended file format chip labeled JPG, PNG, and WebP respectively, a decision guide for choosing an image format",
    "how-image-compression-works": "a professional editorial illustration comparing two copies of the same photograph side by side: the left copy crisp and clean, the right copy showing heavy JPEG compression with visible 8x8 pixel blocking and ringing artifacts around edges, compression quality comparison",
    "exif-orientation-explained": "a professional editorial illustration of a smartphone held horizontally taking a photo, with two display panels showing the resulting image: one panel shows the photo rotated sideways, the other panel shows it upright, demonstrating the EXIF orientation display problem",
    "social-media-aspect-ratios": "a professional editorial illustration of a single source photograph with three overlapping crop frames on it: a square 1:1 frame, a tall 9:16 vertical frame, and a wide 16:9 horizontal frame, showing how one image is cropped to different social media aspect ratios",
    "image-resolution-ppi-dpi": "a professional editorial illustration of the same image displayed at the same physical size but two resolutions: the left half sharp and detailed with many small pixels, the right half blurry and pixelated with few large blocky pixels, resolution comparison concept",
    "compress-images-without-losing-quality": "a professional editorial illustration of the image optimization workflow as a horizontal four-step pipeline: step one choose format, step two adjust a quality slider, step three resize dimensions smaller, step four strip metadata, ending at a small optimized file",
    "color-depth-explained": "a professional editorial illustration of a blue sky gradient split horizontally: the top half smooth and continuous with no visible steps, the bottom half showing visible color banding as distinct stepped bands, demonstrating bit depth banding",
    "alpha-channel-transparency": "a professional editorial illustration comparing two logo edges over a colored background: the left edge with hard jagged one-bit transparency showing stair-step aliasing, the right edge with smooth eight-bit alpha anti-aliasing, transparency edge quality comparison",
    "resizing-vs-cropping": "a professional editorial illustration of a wide group photograph processed two ways: the top version resized into a square ratio with stretched distorted faces, the bottom version cropped into a square ratio with natural faces but with the left and right people cut off",
    "how-to-make-a-meme": "a professional editorial illustration showing bold white Impact-style meme caption text with a heavy black outline, displayed over three different backgrounds side by side — a light background, a busy photographic background, and a dark background — demonstrating outline legibility",
    "watermarking-your-images": "a professional editorial illustration comparing two watermark strategies side by side: the left photograph with a single small semi-transparent watermark in one corner, the right photograph with a semi-transparent tiled diagonal watermark pattern repeated across the whole image",
    "blur-vs-pixelate": "a professional editorial illustration of privacy redaction security: a blurred image region on the left with an arrow indicating it can be partially reversed and recovered, a pixelated image region on the right with a small lock icon indicating it is harder to reverse, security comparison",
}


def load_env():
    env = {}
    path = os.path.join(ROOT, ".env")
    if not os.path.exists(path):
        return env
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def save_small(im, out_path, target_kb=TARGET_KB):
    """Save im as WebP <= target_kb by stepping down quality then dimension."""
    im = im.convert("RGB")
    im.thumbnail((1200, 1200))
    for q in (82, 72, 62):
        im.save(out_path, "WEBP", quality=q)
        if os.path.getsize(out_path) <= target_kb * 1024:
            return im.size, q, os.path.getsize(out_path)
    for dim in (1000, 850, 700):
        t = im.copy()
        t.thumbnail((dim, dim))
        t.save(out_path, "WEBP", quality=70)
        if os.path.getsize(out_path) <= target_kb * 1024:
            return t.size, 70, os.path.getsize(out_path)
    return im.size, None, os.path.getsize(out_path)


def generate_one(env, slug, prompt):
    base = env["WAN_API_BASE"].rstrip("/")
    key = env["WAN_API_KEY"]
    url = base + "/images/generations"
    body = json.dumps(
        {"model": "wan2.7-image-pro", "prompt": prompt + STYLE, "n": 1}
    ).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Authorization": "Bearer " + key,
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    img_url = payload["data"][0]["url"]

    out_path = os.path.join(OUT, slug + "-inline.webp")
    tmp_path = out_path + ".raw"
    urllib.request.urlretrieve(img_url, tmp_path)

    im = Image.open(tmp_path)
    size, q, bytes_ = save_small(im, out_path)
    os.remove(tmp_path)

    w, h = size
    im2 = Image.open(out_path).convert("RGB")
    samples = [
        im2.getpixel((w * i // 10, h * j // 10))
        for i in range(1, 10)
        for j in range(1, 10)
    ]
    vals = [sum(p) / 3 for p in samples]
    spread = statistics.pstdev(vals)
    return out_path, size, q, bytes_, round(spread, 1), spread < 5


def main():
    env = load_env()
    if not env.get("WAN_API_BASE") or not env.get("WAN_API_KEY"):
        print("ERROR: WAN_API_BASE/WAN_API_KEY not found in .env")
        sys.exit(1)
    os.makedirs(OUT, exist_ok=True)

    slugs = [sys.argv[1]] if len(sys.argv) > 1 else list(INLINE_PROMPTS.keys())
    ok = fail = 0
    for slug in slugs:
        prompt = INLINE_PROMPTS.get(slug)
        if not prompt:
            print("  SKIP unknown slug:", slug)
            continue
        try:
            path, size, q, bytes_, spread, blank = generate_one(env, slug, prompt)
            kb = round(bytes_ / 1024)
            flag = "BLANK?" if blank else "ok"
            print("  OK  %-34s %dx%d  %dkb  spread=%s  [%s]" % (
                slug + "-inline.webp", size[0], size[1], kb, spread, flag))
            ok += 1
        except Exception as e:
            print("  FAIL %-34s -> %r" % (slug, e))
            fail += 1
        time.sleep(2)
    print("done. ok=%d fail=%d" % (ok, fail))


if __name__ == "__main__":
    main()
