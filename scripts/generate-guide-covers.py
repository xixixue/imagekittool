#!/usr/bin/env python3
"""Generate cover/inline illustrations for the guides via wan2.7-image-pro.

Reads WAN_API_BASE + WAN_API_KEY from the gitignored .env, calls the
OpenAI-compatible /images/generations endpoint, downloads each result,
saves it as a compact WebP (<=120KB) under public/guides/<slug>-cover.webp,
and verifies it is non-blank. Each image is used both as the article cover
and as the inline illustration (replacing the old SVG diagram block).

Usage:
  python3 scripts/generate-guide-covers.py            # all 12
  python3 scripts/generate-guide-covers.py <slug>     # just one
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

# Light shared style suffix for visual consistency across the 12 covers.
STYLE = (
    ", flat vector illustration, violet and purple accent palette, soft light "
    "background, clean modern editorial tech illustration style"
)

# Each prompt depicts the article's specific subject (not a generic metaphor),
# per the requirement that illustrations must be tightly related to the content.
PROMPTS = {
    "jpg-vs-png-vs-webp": "three image tiles side by side for comparison: left tile a colorful photograph, middle tile a logo over a checkerboard transparency background, right tile a clean modern web illustration, image file format comparison",
    "how-image-compression-works": "the compression pipeline: an image on the left, an arrow into a transform box, branching into a lossless path and a lossy path, ending at a small compressed file on the right",
    "exif-orientation-explained": "a camera photographing a subject, with the resulting photo shown in eight different rotated and mirrored orientations arranged in a grid, EXIF orientation concept",
    "social-media-aspect-ratios": "social media frames shown at true proportions side by side: a square profile picture, a tall vertical story frame, a wide horizontal banner, and a portrait frame",
    "image-resolution-ppi-dpi": "split illustration: left side a screen displaying a magnified grid of square pixels, right side a sheet of printer paper with a magnified grid of round ink dots, pixels per inch versus dots per inch",
    "compress-images-without-losing-quality": "a large image file on the left shrinking through a quality slider into a small file on the right, with a magnifier confirming the image still looks sharp, quality versus file size tradeoff",
    "color-depth-explained": "three horizontal gradient bars stacked: top bar only two colors black and white, middle bar visible stepped bands of gray, bottom bar a smooth continuous gray gradient, bit depth comparison",
    "alpha-channel-transparency": "a semi-transparent violet rectangle floating over a checkerboard background, with several squares at different opacity levels showing the background through them, alpha transparency concept",
    "resizing-vs-cropping": "two operations on a square image containing a circle: top row the square stretched into a wide rectangle making the circle an ellipse, bottom row the square cropped into a wide rectangle keeping the circle round",
    "how-to-make-a-meme": "a meme image macro layout: a photograph in the center with a solid caption bar at the top and a solid caption bar at the bottom, classic internet meme format",
    "watermarking-your-images": "a photograph with a semi-transparent diagonal tiled pattern of repeated small marks overlaid across the whole image, copyright watermark protection concept",
    "blur-vs-pixelate": "a portrait of a face split down the middle: left half smoothly blurred, right half pixelated into blocky squares, privacy redaction comparison",
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

    out_path = os.path.join(OUT, slug + "-cover.webp")
    tmp_path = out_path + ".raw"
    urllib.request.urlretrieve(img_url, tmp_path)

    im = Image.open(tmp_path)
    size, q, bytes_ = save_small(im, out_path)
    os.remove(tmp_path)

    # Non-blank check: sample a 9x9 grid, compute spread; near-zero => blank.
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

    slugs = [sys.argv[1]] if len(sys.argv) > 1 else list(PROMPTS.keys())
    ok = fail = 0
    for slug in slugs:
        prompt = PROMPTS.get(slug)
        if not prompt:
            print("  SKIP unknown slug:", slug)
            continue
        try:
            path, size, q, bytes_, spread, blank = generate_one(env, slug, prompt)
            kb = round(bytes_ / 1024)
            flag = "BLANK?" if blank else "ok"
            qinfo = "q%s" % q if q is not None else "OVER"
            print("  OK  %-34s %dx%d  %dkb  spread=%s  [%s]" % (
                slug + "-cover.webp", size[0], size[1], kb, spread, flag))
            ok += 1
        except Exception as e:
            print("  FAIL %-34s -> %r" % (slug, e))
            fail += 1
        time.sleep(2)
    print("done. ok=%d fail=%d" % (ok, fail))


if __name__ == "__main__":
    main()
