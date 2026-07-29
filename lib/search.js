// Keyword search + category filtering for the shop page.
// Pure functions so the matching rules can be tested on their own.

/** Product keywords, tolerating missing or malformed data. */
export function productKeywords(product) {
  const kw = product && product.keywords;
  if (Array.isArray(kw)) return kw.filter((k) => typeof k === "string" && k.trim());
  if (typeof kw === "string") return kw.split(",").map((k) => k.trim()).filter(Boolean);
  return [];
}

/**
 * The text a search looks through. The standard Includes/Shipping/Care block is
 * left out — it's identical on every product, so searching it would make common
 * words like "titanium" match everything.
 */
export function searchableText(product) {
  const description = String((product && product.description) || "");
  const intro = description.split("Includes:")[0];
  return [
    product && product.name,
    product && product.group,
    product && product.itemId,
    productKeywords(product).join(" "),
    intro,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** A product matches when every word typed appears somewhere in its text. */
export function matchesQuery(product, query) {
  const terms = String(query || "").toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = searchableText(product);
  return terms.every((term) => haystack.includes(term));
}

/**
 * Filter by search text and by the selected categories.
 * An empty `groups` list means "no category filter", i.e. show everything.
 */
export function filterProducts(products, { query = "", groups = [] } = {}) {
  const selected = new Set(groups);
  return products.filter((p) => {
    if (selected.size > 0 && !selected.has(p.group)) return false;
    return matchesQuery(p, query);
  });
}

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest first" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "name", label: "Name: A–Z" },
];

/**
 * Sort a list of products. `priceOf` is passed in so price sorting uses the
 * price actually charged (after any sale), without this module needing to know
 * the pricing rules.
 */
export function sortProducts(products, sortKey, priceOf = (p) => Number(p.price || 0)) {
  const list = [...products];
  switch (sortKey) {
    case "newest":
      // Fall back to item ID so products without a date still order sensibly.
      return list.sort(
        (a, b) =>
          String(b.created || "").localeCompare(String(a.created || "")) ||
          String(b.itemId || "").localeCompare(String(a.itemId || ""))
      );
    case "price-low":
      return list.sort((a, b) => priceOf(a) - priceOf(b));
    case "price-high":
      return list.sort((a, b) => priceOf(b) - priceOf(a));
    case "name":
      return list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    default:
      return list; // "featured" keeps the order they appear in products.json
  }
}

/** Every keyword in use, with counts — handy for showing suggestion chips. */
export function keywordCounts(products) {
  const counts = new Map();
  for (const p of products) {
    for (const raw of productKeywords(p)) {
      const key = raw.trim().toLowerCase();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([keyword, count]) => ({ keyword, count }));
}
