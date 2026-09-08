"""Export the shop into a form that is quick to turn into Etsy listings.

Etsy has no CSV import for *creating* listings. Its bulk CSV is for editing
listings that already exist, so nothing can upload 89 pieces in one go except
the Etsy API or a paid third-party tool. What this does instead is remove the
copying and the photo wrangling:

    etsy-export/
        etsy-listings.csv     one row per piece, in Etsy's own column layout
        photos/
            G0004 - Flower of Life Mandala Large/
                1.jpg  2.jpg  3.jpg      (resized for upload, in order)
        README.txt

With that open beside the Etsy listing form, each piece is paste, paste,
drag the photo folder in, set the category. The CSV also loads directly into
tools that push to Etsy for you (Vela, Nembol, Sellbrite), which is the only
way to do it in bulk.

    python export_etsy.py              available pieces only
    python export_etsy.py --all        include sold and pending too

Requires Pillow for the photo resizing:  pip install Pillow
"""

import csv
import json
import os
import re
import shutil
import sys

PROJECT = os.path.dirname(os.path.abspath(__file__))
PRODUCTS = os.path.join(PROJECT, "data", "products.json")
PENDANTS = os.path.join(PROJECT, "public", "pendants")
OUT_DIR = os.path.join(PROJECT, "etsy-export")

# Etsy's own listing download uses these headers, so anything that understands
# an Etsy CSV understands this one.
HEADERS = (
    ["TITLE", "DESCRIPTION", "PRICE", "CURRENCY_CODE", "QUANTITY", "TAGS", "MATERIALS"]
    + [f"IMAGE{i}" for i in range(1, 11)]
    + ["VARIATION 1 TYPE", "VARIATION 1 NAME", "VARIATION 1 VALUES", "SKU"]
)

# Etsy's limits, worth honouring so nothing is silently truncated on paste.
MAX_TITLE = 140
MAX_TAGS = 13
MAX_TAG_LEN = 20
MAX_PHOTOS = 10
PHOTO_MAX_PX = 3000          # Etsy wants 2000px+; beyond 3000 only slows uploading

COLOURS = [
    "purple", "violet", "magenta", "pink", "red", "orange", "amber", "gold",
    "yellow", "green", "teal", "turquoise", "blue", "silver", "bronze",
    "copper", "black", "white", "rainbow",
]

STOP = {
    "the", "and", "of", "a", "an", "with", "for", "on", "in", "to", "by",
    "large", "small", "mini", "xl", "big", "new", "set", "one", "pendant",
    "pendants", "necklace", "keychain", "titanium", "piece", "version",
}

# Deliberately avoids "handmade" — these are laser cut and engraved, and the
# site never uses that word either.
BASE_TAGS = [
    "titanium pendant",
    "laser engraved",
    "anodized titanium",
    "one of a kind",
    "sacred geometry",
    "unique gift",
]

NOT_WEARABLE_GROUPS = ["Knives & Tools"]


def clean_tag(text):
    """Etsy tags: 20 characters, letters, numbers, spaces and hyphens only."""
    tag = re.sub(r"[^\w\s-]", "", str(text)).strip().lower()
    tag = re.sub(r"\s+", " ", tag)
    return tag[:MAX_TAG_LEN].strip()


def suggest_tags(product):
    """A starting set of tags. Etsy search lives on these, so they are worth
    reviewing by hand — this only saves the blank page."""
    blob = (product.get("name", "") + " " + product.get("description", "")).lower()
    tags = []

    for word in re.findall(r"[a-z']+", product.get("name", "").lower()):
        if len(word) > 2 and word not in STOP and word not in COLOURS:
            tags.append(word)

    tags += [c for c in COLOURS if c in blob][:2]
    tags += [k for k in (product.get("keywords") or [])]

    group = product.get("group", "")
    if group == "Judaic":
        tags.append("judaica")
    elif group == "Molecules":
        tags.append("molecule jewelry")
    elif group in NOT_WEARABLE_GROUPS:
        tags.append("engraved knife")

    tags += BASE_TAGS

    seen, out = set(), []
    for tag in (clean_tag(t) for t in tags):
        if tag and tag not in seen:
            seen.add(tag)
            out.append(tag)
    return out[:MAX_TAGS]


def photo_files(folder):
    """A product's photos, in the order the site numbers them."""
    path = os.path.join(PENDANTS, folder)
    if not os.path.isdir(path):
        return []
    names = [f for f in os.listdir(path) if f.lower().endswith((".jpg", ".jpeg", ".png"))]

    def order(name):
        stem = os.path.splitext(name)[0]
        return (0, int(stem), "") if stem.isdigit() else (1, 0, stem.lower())

    return [os.path.join(path, n) for n in sorted(names, key=order)][:MAX_PHOTOS]


def safe_dirname(text):
    return re.sub(r'[\\/:*?"<>|]', "-", str(text)).strip()[:80]


def copy_photos(product, resizer):
    """Put a piece's photos in their own folder, ready to drag into Etsy."""
    label = f"{product.get('itemId', 'NOID')} - {product.get('name', 'Untitled')}"
    dest = os.path.join(OUT_DIR, "photos", safe_dirname(label))
    os.makedirs(dest, exist_ok=True)

    written = []
    for index, source in enumerate(photo_files(product.get("folder", "")), start=1):
        target = os.path.join(dest, f"{index}.jpg")
        if resizer:
            resizer(source, target)
        else:
            shutil.copy2(source, target)
        written.append(os.path.relpath(target, OUT_DIR).replace("\\", "/"))
    return written


def make_resizer():
    """Shrink to something Etsy is happy with, or fall back to plain copies."""
    try:
        from PIL import Image, ImageOps
    except ImportError:
        print("Pillow not installed - copying photos at full size instead.")
        print("  For smaller, faster uploads:  pip install Pillow\n")
        return None

    def resize(source, target):
        image = ImageOps.exif_transpose(Image.open(source)).convert("RGB")
        image.thumbnail((PHOTO_MAX_PX, PHOTO_MAX_PX), Image.LANCZOS)
        image.save(target, "JPEG", quality=88, optimize=True)

    return resize


def row_for(product, images):
    can_choose = (
        not product.get("noWearChoice")
        and product.get("group") not in NOT_WEARABLE_GROUPS
    )
    description = product.get("description", "")
    size = (product.get("size") or "").strip()
    if size:
        description = f"{description}\n\nSize: {size}"

    row = {
        "TITLE": product.get("name", "")[:MAX_TITLE],
        "DESCRIPTION": description,
        "PRICE": f"{float(product.get('price', 0)):.2f}",
        "CURRENCY_CODE": "USD",
        "QUANTITY": 1,                       # every piece is one of a kind
        "TAGS": ",".join(suggest_tags(product)),
        "MATERIALS": "Titanium",
        "VARIATION 1 TYPE": "Style" if can_choose else "",
        "VARIATION 1 NAME": "Fitting" if can_choose else "",
        "VARIATION 1 VALUES": "Pendant necklace,Keychain fob" if can_choose else "",
        "SKU": product.get("itemId", ""),
    }
    for i in range(1, MAX_PHOTOS + 1):
        row[f"IMAGE{i}"] = images[i - 1] if i <= len(images) else ""
    return row


README = """Etsy export
===========

Etsy cannot import a CSV to CREATE listings. Its bulk CSV only edits listings
that already exist. So this is not a one-click migration, and nothing else is
either unless you use the Etsy API or a paid tool.

What this gives you:

  etsy-listings.csv   one row per piece, in Etsy's own column layout
  photos/             one folder per piece, photos numbered in order

Two ways to use it:

1. Listing by hand (free)
   Open the CSV in Excel or Google Sheets beside Etsy's "Add a listing" form.
   Copy the title, description and tags across, then drag that piece's photo
   folder onto the photo box - they upload in the right order.

2. A tool that pushes to Etsy for you (paid, does it in bulk)
   Vela, Nembol and Sellbrite all import an Etsy-shaped CSV. Check whether
   yours wants photos as URLs rather than files; if so, your own site already
   serves them at https://titaniumgeometry.com/pendants/<folder>/1.jpg

Before you list, three things this export cannot know:

  TAGS are suggestions, not answers. Etsy search runs on them and they are
  worth more than anything else on the listing. Look at what sells for a
  search like "titanium pendant" and steal the vocabulary.

  CATEGORY has to be picked in Etsy's own taxonomy, per listing.

  ABOUT - "who made it / what is it / when was it made" - is required by
  Etsy and set per listing. For these: I made it / a finished product /
  made to order or 2020s.

QUANTITY is 1 on every row, which is correct: each piece exists once. Turn
listing auto-renew OFF, or Etsy will keep charging to relist things that
have sold.
"""


def main():
    include_all = "--all" in sys.argv

    with open(PRODUCTS, encoding="utf-8") as handle:
        data = json.load(handle)

    products = data.get("products", [])
    if not include_all:
        products = [p for p in products if p.get("status", "available") == "available"]
    if not products:
        sys.exit("Nothing to export.")

    if os.path.isdir(OUT_DIR):
        shutil.rmtree(OUT_DIR)
    os.makedirs(os.path.join(OUT_DIR, "photos"), exist_ok=True)

    resizer = make_resizer()

    rows = []
    no_photos = []
    for product in products:
        images = copy_photos(product, resizer)
        if not images:
            no_photos.append(product.get("itemId", product.get("id")))
        rows.append(row_for(product, images))
        print(f"  {product.get('itemId', '?'):6} {product.get('name', '')[:44]:46} "
              f"{len(images)} photo(s)")

    csv_path = os.path.join(OUT_DIR, "etsy-listings.csv")
    # utf-8-sig so Excel opens the accented characters correctly.
    with open(csv_path, "w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=HEADERS)
        writer.writeheader()
        writer.writerows(rows)

    with open(os.path.join(OUT_DIR, "README.txt"), "w", encoding="utf-8") as handle:
        handle.write(README)

    total_photos = sum(1 for _ in os.walk(os.path.join(OUT_DIR, "photos")))
    print(f"\nExported {len(rows)} listing(s) to {OUT_DIR}")
    print(f"  etsy-listings.csv   {len(rows)} rows")
    print(f"  photos/             {total_photos - 1} folder(s)")
    if no_photos:
        print(f"\n  No photos found for: {', '.join(str(x) for x in no_photos)}")
    print("\nRead README.txt first - Etsy cannot bulk-import listings, so this is")
    print("a copy-and-paste aid rather than an upload.")


if __name__ == "__main__":
    main()
