// Bundles: several one-of-a-kind pieces sold together at one price.
//
// A bundle is an ordinary product in products.json (its own id, name, price,
// photos and item number, in the "Bundles" category) that also carries
// `bundle`: the ids of the pieces it contains. Because it is a normal product,
// the shop, cart, PayPal and the catalog feed all handle it without knowing
// anything about bundles. The member pieces stay listed on their own at their
// own prices.
//
// Each piece exists once, so a bundle can only be bought while every piece in
// it is still available. product_admin.py keeps each bundle's `status` in step
// with its pieces whenever it saves ("unavailable" once any piece has sold on
// its own); bundleStatus() below works the same thing out live, so a product
// page never offers a bundle whose pieces are gone.

import { priceInfo } from "./pricing";

export const BUNDLE_GROUP = "Bundles";

export const isBundle = (product) =>
  Boolean(product) && Array.isArray(product.bundle) && product.bundle.length > 0;

/** The pieces in a bundle, in the order listed, skipping any since deleted. */
export function bundleMembers(bundle, allProducts) {
  if (!isBundle(bundle)) return [];
  return bundle.bundle
    .map((id) => allProducts.find((p) => p.id === id))
    .filter(Boolean);
}

/**
 * "available" | "pending" | "sold" | "unavailable".
 * "sold" means the bundle itself sold; "unavailable" means a piece in it sold
 * (or was removed) on its own, so the set can't be bought any more.
 */
export function bundleStatus(bundle, allProducts) {
  if (bundle.soldAsBundle || bundle.status === "sold") return "sold";
  const members = bundleMembers(bundle, allProducts);
  if (members.length < bundle.bundle.length) return "unavailable";
  if (members.some((m) => m.status === "sold")) return "unavailable";
  if (bundle.status === "pending" || members.some((m) => m.status === "pending")) return "pending";
  return "available";
}

/** A product's status, worked out live for bundles. */
export function liveStatus(product, allProducts) {
  if (isBundle(product)) return bundleStatus(product, allProducts);
  return product.status || "available";
}

/** Bundles that include this piece and can still be bought, smallest first. */
export function availableBundlesWith(product, allProducts) {
  if (!product) return [];
  return allProducts
    .filter(
      (b) =>
        isBundle(b) &&
        b.id !== product.id &&
        b.bundle.includes(product.id) &&
        bundleStatus(b, allProducts) === "available"
    )
    .sort((a, b) => a.bundle.length - b.bundle.length);
}

/**
 * Whether two bundles share a piece. A piece can be in several bundles (a
 * pair and a bigger set, say), but only one of them can actually be bought.
 */
export function bundlesOverlap(a, b) {
  return isBundle(a) && isBundle(b) && a.bundle.some((id) => b.bundle.includes(id));
}

/** What the pieces would cost bought one at a time, at today's prices. */
export function separatePrice(bundle, allProducts) {
  const total = bundleMembers(bundle, allProducts).reduce(
    (sum, m) => sum + Number(priceInfo(m).final || 0),
    0
  );
  return Math.round(total * 100) / 100;
}

/** The categories a product touches: its own, or every piece's for a bundle. */
export function groupsOf(product, allProducts) {
  if (!isBundle(product)) return [product.group];
  return bundleMembers(product, allProducts).map((m) => m.group);
}

/** True when the product, or any piece in it, is in one of `groups`. */
export function touchesGroups(product, groups, allProducts) {
  return groupsOf(product, allProducts).some((g) => groups.includes(g));
}
