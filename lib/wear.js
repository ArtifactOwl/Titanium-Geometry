// How a piece is finished: worn on a cord, or carried on a key ring.
//
// The engraved piece is the same either way — only the fitting differs — so
// there's no price difference and nothing to track in products.json. The buyer
// picks at checkout and the choice rides along to PayPal, where it shows up in
// the order notification so the right fitting gets shipped.

export const WEAR_OPTIONS = [
  { value: "necklace", label: "Pendant necklace", hint: "on a cord" },
  { value: "keychain", label: "Keychain fob", hint: "on a split ring" },
];

export const DEFAULT_WEAR = "necklace";

// Knives and tools aren't worn — they have their own fittings.
export const NOT_WEARABLE_GROUPS = ["Knives & Tools"];

/**
 * Whether this piece can be had either way.
 *
 * Most can. A whole category can be ruled out (knives), and an individual
 * piece can be too by carrying `noWearChoice` — pins and brooches come with
 * their own fitting and are neither a pendant nor a keychain. That flag is
 * ticked in the admin tool's Manage Products tab.
 */
export function canChooseWear(product) {
  if (!product || product.noWearChoice) return false;
  return !NOT_WEARABLE_GROUPS.includes(product.group);
}

/** Normalise whatever is stored, so an unknown value can never leak through. */
export function normaliseWear(value) {
  return WEAR_OPTIONS.some((o) => o.value === value) ? value : DEFAULT_WEAR;
}

/** The human label PayPal and the cart show. */
export function wearLabel(value) {
  const found = WEAR_OPTIONS.find((o) => o.value === normaliseWear(value));
  return found ? found.label : "";
}

// PayPal Payments Standard carries one option per item as a name/value pair:
// on0/os0 for a single item, on0_N/os0_N in a cart upload.
export const PAYPAL_OPTION_NAME = "Fitting";
