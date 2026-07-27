"""
Export product images for AI description writing.

Copies the primary photo of each product that still needs a description into a
single folder, renamed to the product's folder name (e.g. eye-of-illusion.jpg),
so you can multi-select and upload them all to ChatGPT at once.

By default it picks products that still have the DEFAULT description (no unique
intro yet) or an empty description. Options:

    python export_images_for_ai.py                 # items still needing a description
    python export_images_for_ai.py --after 2026-07-01   # ...also limited to created on/after a date
    python export_images_for_ai.py --all           # every product
    python export_images_for_ai.py --out some/dir  # custom output folder

Output folder defaults to ./ai-descriptions-images/
"""
import json
import os
import shutil
import sys

PROJECT = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(PROJECT, "data", "products.json")
PENDANTS = os.path.join(PROJECT, "public", "pendants")
DEFAULT_OUT = os.path.join(PROJECT, "ai-descriptions-images")
IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp")


def needs_description(desc):
    """A product still needs a description if it's empty or is just the standard
    boilerplate (which starts with 'Includes:' with no unique intro above it)."""
    d = (desc or "").strip()
    return d == "" or d.startswith("Includes:")


def find_primary_image(folder):
    d = os.path.join(PENDANTS, folder)
    if not os.path.isdir(d):
        return None
    # Prefer 1.jpg, else the first image found (sorted).
    preferred = os.path.join(d, "1.jpg")
    if os.path.exists(preferred):
        return preferred
    for f in sorted(os.listdir(d)):
        if f.lower().endswith(IMG_EXTS):
            return os.path.join(d, f)
    return None


def main():
    args = sys.argv[1:]
    out_dir = DEFAULT_OUT
    after = None
    take_all = False
    i = 0
    while i < len(args):
        a = args[i]
        if a == "--all":
            take_all = True
        elif a == "--after" and i + 1 < len(args):
            after = args[i + 1]
            i += 1
        elif a == "--out" and i + 1 < len(args):
            out_dir = os.path.abspath(args[i + 1])
            i += 1
        else:
            print("Unknown/incomplete argument:", a)
            return
        i += 1

    data = json.load(open(DATA_FILE, encoding="utf-8"))
    products = data.get("products", [])

    selected = []
    for p in products:
        if not take_all and not needs_description(p.get("description")):
            continue
        if after and (p.get("created", "") < after):
            continue
        selected.append(p)

    if not selected:
        print("No matching products. (Nothing needs a description with these options.)")
        return

    os.makedirs(out_dir, exist_ok=True)
    copied, missing = [], []
    for p in selected:
        src = find_primary_image(p["folder"])
        if not src:
            missing.append(p["folder"])
            continue
        ext = os.path.splitext(src)[1].lower()
        dst = os.path.join(out_dir, p["folder"] + ext)
        shutil.copy2(src, dst)
        copied.append(os.path.basename(dst))

    print(f"Exported {len(copied)} image(s) to: {out_dir}")
    for name in copied:
        print("  " + name)
    if missing:
        print(f"\nNo image found for {len(missing)} product(s):")
        for m in missing:
            print("  " + m)

    # Open the folder on Windows for convenience.
    if copied and sys.platform == "win32":
        try:
            os.startfile(out_dir)  # noqa: E1101 (Windows-only)
        except Exception:
            pass


if __name__ == "__main__":
    main()
