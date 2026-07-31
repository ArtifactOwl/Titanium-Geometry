// Shared pricing rules: shipping, coupons, and cart totals.
// Used by the cart page and the checkout form so one place defines the maths.

import couponData from "../data/coupons.json";
import flagSaleData from "../data/flag-sales.json";
import autoPromoData from "../data/auto-promos.json";

// Where PayPal sends the money, and where it returns the buyer afterwards.
export const PAYPAL_EMAIL = "titaniumgeometry@gmail.com";
export const SITE_URL = "https://titanium-geometry.vercel.app";

// Shipping is charged ONCE per order, no matter how many pieces are in it.
export const SHIPPING_RATES = {
  US: 0,
  CA: 10,
  MX: 10,
  INTERNATIONAL: 20,
};

export const COUNTRIES = [
  { code: "US", name: "United States", rate: SHIPPING_RATES.US },
  { code: "CA", name: "Canada", rate: SHIPPING_RATES.CA },
  { code: "MX", name: "Mexico", rate: SHIPPING_RATES.MX },
  { code: "INT", name: "── International ──", rate: null, disabled: true },
  { code: "AU", name: "Australia", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "AT", name: "Austria", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "BE", name: "Belgium", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "BR", name: "Brazil", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "DK", name: "Denmark", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "FI", name: "Finland", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "FR", name: "France", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "DE", name: "Germany", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "IE", name: "Ireland", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "IL", name: "Israel", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "IT", name: "Italy", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "JP", name: "Japan", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "NL", name: "Netherlands", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "NZ", name: "New Zealand", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "NO", name: "Norway", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "PL", name: "Poland", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "PT", name: "Portugal", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "ES", name: "Spain", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "SE", name: "Sweden", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "CH", name: "Switzerland", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "GB", name: "United Kingdom", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "OTHER", name: "Other Country", rate: SHIPPING_RATES.INTERNATIONAL },
];

export function shippingFor(countryCode) {
  const found = COUNTRIES.find((c) => c.code === countryCode);
  return found && found.rate != null ? found.rate : 0;
}

export const round2 = (n) => Math.round(n * 100) / 100;
export const money = (n) => "$" + round2(n).toFixed(2);

export const COUPONS = couponData.coupons || [];

// ---------- Flag-driven sales ----------
// A product carrying an admin flag (sale1/sale2/sale3) is automatically
// discounted. Amounts live in data/flag-sales.json and are edited in the admin
// tool's Sales tab. Flags themselves stay invisible to customers — only the
// resulting price change shows.
export const FLAG_SALES = flagSaleData.flagSales || {};

/** Total discount a product earns from its flags. */
export function flagDiscountFor(product, basePrice) {
  const flags = Array.isArray(product && product.flags) ? product.flags : [];
  let discount = 0;
  for (const key of flags) {
    const rule = FLAG_SALES[key];
    if (!rule || rule.active === false) continue;
    const value = Number(rule.value || 0);
    if (value <= 0) continue;
    discount += rule.type === "percent" ? basePrice * (value / 100) : value;
  }
  return round2(discount);
}

/**
 * Everything the UI needs to show a price.
 *
 * `price` in products.json already reflects any sale applied from the admin
 * Sales tab (which also records originalPrice). A flag sale comes off on top of
 * that, and the struck-through figure is always the original list price.
 */
export function priceInfo(product) {
  const current = Number((product && product.price) || 0);
  const list = Number((product && product.originalPrice) || current);
  const discount = flagDiscountFor(product, current);
  const final = round2(Math.max(0, current - discount));
  return {
    list: round2(list),
    final,
    onSale: final < round2(list),
    flagDiscount: discount,
  };
}

/** The price actually charged for a product. */
export function effectivePrice(product) {
  return priceInfo(product).final;
}

// ---------- Automatic order-level offers ----------
// These need no code: the cart applies them the moment the subtotal qualifies.
// They are deliberately NOT stackable — not with each other, and not with a
// coupon code. The cart works out what each one would save and applies the
// single best, so a buyer is never quietly given the worse of two offers.
export const AUTO_PROMOS = (autoPromoData.autoPromos || []).filter((p) => p.active !== false);

/** True when the order is big enough for this offer. */
export function promoUnlocked(promo, subtotal) {
  return !!promo && subtotal >= Number(promo.threshold || 0);
}

/**
 * What an offer is worth on this order, in dollars.
 * Free shipping is worth whatever the shipping would have cost — which is
 * nothing for US orders, since those already ship free.
 */
export function promoValue(promo, subtotal, shipping) {
  if (!promoUnlocked(promo, subtotal)) return 0;
  if (promo.kind === "freeShipping") return round2(shipping);
  if (promo.kind === "percent") return round2(subtotal * (Number(promo.value || 0) / 100));
  if (promo.kind === "fixed") return round2(Math.min(Number(promo.value || 0), subtotal));
  return 0;
}

/** Offers this order qualifies for, most valuable first. */
export function qualifyingPromos(subtotal, shipping) {
  return AUTO_PROMOS.filter((p) => promoUnlocked(p, subtotal))
    .map((p) => ({ promo: p, value: promoValue(p, subtotal, shipping) }))
    .sort((a, b) => b.value - a.value || Number(b.promo.threshold || 0) - Number(a.promo.threshold || 0));
}

/** The next offer the buyer could unlock, and how much more they'd need to spend. */
export function nextPromo(subtotal) {
  const upcoming = AUTO_PROMOS.filter((p) => !promoUnlocked(p, subtotal)).sort(
    (a, b) => Number(a.threshold || 0) - Number(b.threshold || 0)
  );
  if (!upcoming.length) return null;
  return { promo: upcoming[0], remaining: round2(Number(upcoming[0].threshold || 0) - subtotal) };
}

function isExpired(coupon) {
  if (!coupon.expires) return false;
  // Compare date-only so a coupon is usable through the whole expiry day.
  return new Date(coupon.expires + "T23:59:59") < new Date();
}

export function findCoupon(code) {
  const wanted = (code || "").trim().toUpperCase();
  if (!wanted) return null;
  return COUPONS.find((c) => (c.code || "").toUpperCase() === wanted) || null;
}

/**
 * Work out what a coupon is worth for the given cart items.
 * Returns { valid, discount, reason } — reason explains a rejection.
 */
export function applyCoupon(coupon, items) {
  if (!coupon) return { valid: false, discount: 0, reason: "" };
  if (coupon.active === false) return { valid: false, discount: 0, reason: "That code is no longer active." };
  if (isExpired(coupon)) return { valid: false, discount: 0, reason: "That code has expired." };

  const subtotal = items.reduce((sum, it) => sum + effectivePrice(it), 0);
  // A coupon can be limited to one category; then it only sees that category's items.
  const scoped = coupon.group ? items.filter((it) => it.group === coupon.group) : items;
  const scopedTotal = scoped.reduce((sum, it) => sum + effectivePrice(it), 0);

  if (coupon.group && scoped.length === 0) {
    return { valid: false, discount: 0, reason: `That code only applies to ${coupon.group}.` };
  }

  const min = Number(coupon.minSubtotal || 0);
  // The minimum is measured against whatever the coupon applies to.
  const measured = coupon.group ? scopedTotal : subtotal;
  if (min > 0 && measured < min) {
    return {
      valid: false,
      discount: 0,
      reason: `Spend ${money(min)}${coupon.group ? " on " + coupon.group : ""} to use this code (currently ${money(measured)}).`,
    };
  }

  let discount =
    coupon.type === "percent"
      ? scopedTotal * (Number(coupon.value || 0) / 100)
      : Number(coupon.value || 0);

  // Never discount below zero, and never more than the items it applies to.
  discount = Math.min(round2(discount), round2(scopedTotal));
  if (discount <= 0) return { valid: false, discount: 0, reason: "That code has no value for this order." };

  return { valid: true, discount: round2(discount), reason: "" };
}

/**
 * Totals for a cart. `coupon` may be null.
 *
 * Exactly one order-level discount is ever applied — the best of the automatic
 * offers and the buyer's coupon code. Nothing stacks. (Per-item flag sales are
 * separate: those are already baked into effectivePrice.)
 */
export function cartTotals(items, countryCode, coupon) {
  const subtotal = round2(items.reduce((sum, it) => sum + effectivePrice(it), 0));
  const baseShipping = items.length ? shippingFor(countryCode) : 0;

  const couponResult = applyCoupon(coupon, items);
  const couponWorth = couponResult.valid ? couponResult.discount : 0;

  const qualifying = qualifyingPromos(subtotal, baseShipping);
  const best = qualifying.find((q) => q.value > 0) || null;

  // Ties go to the automatic offer, so a buyer never has to type a code to get
  // the same money off.
  const usePromo = !!best && best.value >= couponWorth;

  let discount = 0;
  let shipping = baseShipping;
  let appliedPromo = null;

  if (usePromo) {
    appliedPromo = best.promo;
    if (appliedPromo.kind === "freeShipping") shipping = 0;
    else discount = best.value;
  } else if (couponWorth > 0) {
    discount = couponWorth;
  }

  return {
    subtotal,
    discount,
    shipping,
    baseShipping,
    total: round2(Math.max(0, subtotal - discount) + shipping),
    appliedPromo,
    shippingWaived: usePromo && appliedPromo.kind === "freeShipping",
    couponValid: couponResult.valid,
    couponReason: couponResult.reason,
    couponApplied: !usePromo && couponWorth > 0,
    // Valid code, but an automatic offer was worth at least as much.
    couponOutdone: couponResult.valid && usePromo,
    qualifying,
    nextUp: nextPromo(subtotal),
  };
}
