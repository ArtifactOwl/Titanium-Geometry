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
Requires Pillow:  pip install Pillow
"""

import os
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is needed for this script.  Install it with:  pip install Pillow")

PROJECT = os.path.dirname(os.path.abspath(__file__))
SOURCE = os.path.join(PROJECT, "public", "pendants")

# (output folder, longest edge in px, JPEG quality)
SIZES = [
    (os.path.join(PROJECT, "public", "img"), 1400, 82),
    (os.path.join(PROJECT, "public", "thumb"), 600, 80),
]


def needs_rebuild(source, target):
    """True when the copy is missing or older than the photo it came from."""
    if not os.path.exists(target):
        return True
    return os.path.getmtime(source) > os.path.getmtime(target)


def build(source, target, max_px, quality):
    os.makedirs(os.path.dirname(target), exist_ok=True)
    # exif_transpose so a photo taken sideways stays the right way up.
    image = ImageOps.exif_transpose(Image.open(source)).convert("RGB")
    image.thumbnail((max_px, max_px), Image.LANCZOS)
    image.save(target, "JPEG", quality=quality, optimize=True, progressive=True)


def main():
    if not os.path.isdir(SOURCE):
        sys.exit(f"No photos found at {SOURCE}")

    built = skipped = 0
    for root, _dirs, files in os.walk(SOURCE):
        for name in files:
            if not name.lower().endswith((".jpg", ".jpeg")):
                continue
            source = os.path.join(root, name)
            relative = os.path.relpath(source, SOURCE)
            for out_dir, max_px, quality in SIZES:
                target = os.path.join(out_dir, relative)
                if needs_rebuild(source, target):
                    build(source, target, max_px, quality)
                    built += 1
                else:
                    skipped += 1

    print(f"Rebuilt {built} image(s); {skipped} already up to date.")
    if built:
        print("Now hit Publish in the admin tool to put them online.")


if __name__ == "__main__":
    main()
