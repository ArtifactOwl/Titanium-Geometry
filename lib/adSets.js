// The Facebook ad landing pages.
//
// Each set is a group of pieces flagged in the admin tool, its own video, and
// its own URL. Running one ad per set means a piece selling only costs you that
// ad — the other two keep running.

import adSetData from "../data/ad-sets.json";

export const AD_SETS = adSetData.adSets || [];

/** Every flag key a product might carry, e.g. ["fbFeatured", ...]. */
export const AD_SET_FLAGS = AD_SETS.map((s) => s.flag);

export function adSetById(id) {
  return AD_SETS.find((s) => s.id === id) || AD_SETS[0] || null;
}

/** Available pieces carrying a set's flag, minus anything already shown. */
export function productsInSet(products, set, exclude = []) {
  if (!set) return [];
  const seen = new Set(exclude.map((p) => p.id));
  return products.filter((p) => p[set.flag] && !seen.has(p.id));
}
