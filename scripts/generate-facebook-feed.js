/**
 * Generates public/facebook-feed.csv — a Meta (Facebook/Instagram) catalog feed
 * built from data/products.json and the real image folders under public/pendants.
 *
 * Runs automatically as part of `npm run build`, so the feed is regenerated on
 * every Vercel deploy. Point Meta Commerce Manager at:
 *     https://titanium-geometry.vercel.app/facebook-feed.csv
 * and set it to fetch on a schedule.
 *
 * This feed is for "checkout on another website": each item links to its own
 * product page, where the existing PayPal flow handles the sale.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data", "products.json");
const PENDANTS_DIR = path.join(ROOT, "public", "pendants");
const OUT_FILE = path.join(ROOT, "public", "facebook-feed.csv");

// Override with SITE_URL when the custom domain goes live.
const SITE_URL = (process.env.SITE_URL || "https://titanium-geometry.vercel.app").replace(/\/$/, "");
const BRAND = "Titanium Geometry";
// Meta's commerce policy prohibits weapons, which includes pocket knives —
// listing them risks the whole catalog, so they stay off the feed.
const EXCLUDED_GROUPS = ["Knives & Tools"];
const GOOGLE_CATEGORY = "Apparel & Accessories > Jewelry > Necklaces";
const MAX_ADDITIONAL_IMAGES = 20; // Meta's limit
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

const COLUMNS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "sale_price",
  "link",
  "image_link",
  "additional_image_link",
  "brand",
  "google_product_category",
  "custom_label_0",
];

function csvEscape(value) {
  const s = value === undefined || value === null ? "" : String(value);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** Image files for a product, ordered numerically (1.jpg, 2.jpg, ... 10.jpg). */
function productImages(folder) {
  const dir = path.join(PENDANTS_DIR, folder);
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return files
    .filter((f) => IMAGE_EXTS.includes(path.extname(f).toLowerCase()))
    .sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      const va = Number.isNaN(na) ? Infinity : na;
      const vb = Number.isNaN(nb) ? Infinity : nb;
      return va - vb || a.localeCompare(b);
    });
}

function money(amount) {
  return Number(amount).toFixed(2) + " USD";
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const rows = [];
  const skipped = { excludedGroup: 0, noImages: [] };

  for (const p of data.products || []) {
    if (EXCLUDED_GROUPS.includes(p.group)) {
      skipped.excludedGroup++;
      continue;
    }

    const images = productImages(p.folder);
    if (images.length === 0) {
      // Meta rejects items without an image, so leave them out entirely.
      skipped.noImages.push(p.id);
      continue;
    }

    const imageUrls = images.map(
      (f) => `${SITE_URL}/pendants/${encodeURIComponent(p.folder)}/${encodeURIComponent(f)}`
    );

    // On sale: `price` is the regular price and `sale_price` the discounted one.
    const onSale = p.salePrice != null && p.originalPrice != null;
    const regular = onSale ? p.originalPrice : p.price;

    rows.push({
      id: p.itemId || p.id,
      title: p.name,
      description: p.description || p.name,
      availability: (p.status || "available") === "available" ? "in stock" : "out of stock",
      condition: "new",
      price: money(regular),
      sale_price: onSale ? money(p.salePrice) : "",
      link: `${SITE_URL}/products/${encodeURIComponent(p.id)}`,
      image_link: imageUrls[0],
      additional_image_link: imageUrls.slice(1, 1 + MAX_ADDITIONAL_IMAGES).join(","),
      brand: BRAND,
      google_product_category: GOOGLE_CATEGORY,
      custom_label_0: p.group || "",
    });
  }

  const lines = [COLUMNS.join(",")];
  for (const row of rows) {
    lines.push(COLUMNS.map((c) => csvEscape(row[c])).join(","));
  }
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, lines.join("\n") + "\n", "utf8");

  const inStock = rows.filter((r) => r.availability === "in stock").length;
  console.log(
    `facebook-feed.csv: ${rows.length} products (${inStock} in stock)` +
      (skipped.excludedGroup ? `, ${skipped.excludedGroup} excluded by group` : "") +
      (skipped.noImages.length ? `, skipped (no images): ${skipped.noImages.join(", ")}` : "")
  );
}

main();
