// Shared pricing rules: shipping, coupons, and cart totals.
// Used by the cart page and the checkout form so one place defines the maths.

import couponData from "../data/coupons.json";

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

  const subtotal = items.reduce((sum, it) => sum + Number(it.price || 0), 0);
  // A coupon can be limited to one category; then it only sees that category's items.
  const scoped = coupon.group ? items.filter((it) => it.group === coupon.group) : items;
  const scopedTotal = scoped.reduce((sum, it) => sum + Number(it.price || 0), 0);

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

/** Totals for a cart. `coupon` may be null. */
export function cartTotals(items, countryCode, coupon) {
  const subtotal = round2(items.reduce((sum, it) => sum + Number(it.price || 0), 0));
  const { valid, discount, reason } = applyCoupon(coupon, items);
  const shipping = items.length ? shippingFor(countryCode) : 0;
  const total = round2(Math.max(0, subtotal - discount) + shipping);
  return { subtotal, discount: valid ? discount : 0, couponValid: valid, couponReason: reason, shipping, total };
}
