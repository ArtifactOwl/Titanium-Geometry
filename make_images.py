"""Rebuild the small copies of the product photos.

The site never loads the originals except when a buyer opens the full-size
view, because they run several megabytes each. Every page instead uses one of
two smaller copies, which this script generates:

    public/pendants/<folder>/N.jpg   original, untouched  (what you add photos to)
    public/img/<folder>/N.jpg        1400px  - product page main image
    public/thumb/<folder>/N.jpg      600px   - shop grid, cart, thumbnails

Run this after adding or replacing photos, then Publish:

    python make_images.py

Only missing or out-of-date copies are rebuilt, so re-running it is quick.
The Publish tab in product_admin.py checks the same thing and offers to do it
for you, so this script is only needed if you would rather run it yourself.

Requires Pillow:  pip install Pillow
"""

import os
import sys

PROJECT = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(PROJECT, "public", "pendants")

# (output folder, longest edge in px, JPEG quality)
SIZES = [
    (os.path.join(PROJECT, "public", "img"), 1400, 82),
    (os.path.join(PROJECT, "public", "thumb"), 600, 80),
]

PILLOW_HINT = "Pillow is needed to resize photos.  Install it with:  pip install Pillow"


def pillow():
    """Import Pillow only when a photo actually needs resizing.

    Kept out of the module top level so that importing this file — which
    product_admin.py does — can never take the admin tool down with it.
    """
    from PIL import Image, ImageOps  # noqa: F401  (raises ImportError if absent)
    return Image, ImageOps


def needs_rebuild(source, target):
    """True when the copy is missing or older than the photo it came from."""
    if not os.path.exists(target):
        return True
    return os.path.getmtime(source) > os.path.getmtime(target)


def pending_work():
    """Every copy that is missing or stale, as (source, target, max_px, quality)."""
    jobs = []
    if not os.path.isdir(SOURCE):
        return jobs
    for root, _dirs, files in os.walk(SOURCE):
        for name in files:
            if not name.lower().endswith((".jpg", ".jpeg")):
                continue
            source = os.path.join(root, name)
            relative = os.path.relpath(source, SOURCE)
            for out_dir, max_px, quality in SIZES:
                target = os.path.join(out_dir, relative)
                if needs_rebuild(source, target):
                    jobs.append((source, target, max_px, quality))
    return jobs


def build_one(source, target, max_px, quality):
    """Write one resized copy, making its folder if need be."""
    Image, ImageOps = pillow()
    os.makedirs(os.path.dirname(target), exist_ok=True)
    # exif_transpose so a photo taken sideways stays the right way up.
    image = ImageOps.exif_transpose(Image.open(source)).convert("RGB")
    image.thumbnail((max_px, max_px), Image.LANCZOS)
    image.save(target, "JPEG", quality=quality, optimize=True, progressive=True)


def rebuild(progress=None):
    """Build every pending copy. `progress(done, total)` is called as it goes.

    Returns (built, errors) where errors is a list of (source, message).
    """
    jobs = pending_work()
    built = 0
    errors = []
    for index, (source, target, max_px, quality) in enumerate(jobs, start=1):
        try:
            build_one(source, target, max_px, quality)
            built += 1
        except Exception as exc:  # a single unreadable photo shouldn't stop the rest
            errors.append((source, str(exc)))
        if progress:
            progress(index, len(jobs))
    return built, errors


def main():
    if not os.path.isdir(SOURCE):
        sys.exit(f"No photos found at {SOURCE}")
    try:
        pillow()
    except ImportError:
        sys.exit(PILLOW_HINT)

    jobs = pending_work()
    if not jobs:
        print("Every photo already has its smaller copies. Nothing to do.")
        return

    print(f"Rebuilding {len(jobs)} image(s)...")
    built, errors = rebuild()
    print(f"Rebuilt {built} image(s).")
    for source, message in errors:
        print(f"  FAILED {source}: {message}")
    if built:
        print("Now hit Publish in the admin tool to put them online.")


if __name__ == "__main__":
    main()
