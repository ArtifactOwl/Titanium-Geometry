// Picking a few pieces to show alongside the one being looked at.
//
// There is no browsing history to work from, so similarity comes out of the
// pieces themselves: the colours in their names and descriptions, the
// distinctive words in their titles, their category, and their keywords.
//
// Keywords score highest because they are deliberate. None are filled in yet —
// every product carries an empty list — so today the work is done by colour and
// title words. Filling keywords in from the admin tool improves this with no
// code change.

const COLOURS = [
  "purple", "violet", "magenta", "pink", "red", "orange", "amber", "gold",
  "yellow", "green", "teal", "turquoise", "blue", "silver", "bronze", "copper",
  "black", "white", "rainbow",
];

// Words too common or too generic to mean two pieces are alike.
const STOP = new Set([
  "the", "and", "of", "a", "an", "with", "for", "on", "in", "to", "by",
  "large", "small", "mini", "xl", "big", "long", "short", "wide",
  "pendant", "pendants", "necklace", "keychain", "titanium", "piece",
  "version", "variant", "style", "new", "custom", "set", "one",
]);

const lower = (s) => String(s || "").toLowerCase();

/** Colours mentioned in a piece's name or description. */
export function coloursOf(product) {
  const blob = lower(product && product.name) + " " + lower(product && product.description);
  return COLOURS.filter((c) => blob.includes(c));
}

/** The meaningful words in a piece's title. */
export function titleWordsOf(product) {
  const words = lower(product && product.name).match(/[a-z']+/g) || [];
  return words.filter(
    (w) => w.length > 2 && !STOP.has(w) && !COLOURS.includes(w)
  );
}

const keywordsOf = (product) =>
  (Array.isArray(product && product.keywords) ? product.keywords : []).map(lower);

const overlap = (a, b) => {
  const set = new Set(b);
  return a.filter((x) => set.has(x)).length;
};

/**
 * How alike two pieces are. Higher is closer; 0 means nothing in common.
 * Weights favour what a person actually notices: a shared subject over a
 * shared colour, and a shared colour over merely sharing a category.
 */
export function similarity(a, b) {
  return (
    5 * overlap(keywordsOf(a), keywordsOf(b)) +
    3 * overlap(titleWordsOf(a), titleWordsOf(b)) +
    2 * overlap(coloursOf(a), coloursOf(b)) +
    (a.group && a.group === b.group ? 1 : 0)
  );
}

// Knives never sit alongside pendants: different thing entirely, and it keeps
// any page that suggests them free of weapons for Facebook's crawler.
const KNIVES = "Knives & Tools";
const sameFamily = (a, b) => (a.group === KNIVES) === (b.group === KNIVES);

/**
 * Up to `limit` pieces to show under a product. Purely a function of the data,
 * so the same product always suggests the same pieces.
 */
export function relatedTo(product, allProducts, limit = 4) {
  if (!product) return [];

  const candidates = allProducts.filter(
    (p) =>
      p.id !== product.id &&
      (p.status === "available" || !p.status) &&
      sameFamily(product, p)
  );

  const scored = candidates
    .map((p) => ({
      product: p,
      score: similarity(product, p),
      priceGap: Math.abs(Number(p.price || 0) - Number(product.price || 0)),
    }))
    .sort(
      (x, y) =>
        y.score - x.score ||
        x.priceGap - y.priceGap ||
        String(x.product.itemId || x.product.id).localeCompare(
          String(y.product.itemId || y.product.id)
        )
    );

  // Anything with nothing at all in common is worse than showing less.
  const picks = scored.filter((s) => s.score > 0).slice(0, limit);

  // If a piece is unusual enough to have few matches, fill up from its own
  // category rather than leaving a stubby row.
  if (picks.length < limit) {
    const already = new Set(picks.map((s) => s.product.id));
    for (const s of scored) {
      if (picks.length >= limit) break;
      if (already.has(s.product.id)) continue;
      picks.push(s);
      already.add(s.product.id);
    }
  }

  return picks.map((s) => s.product);
}
