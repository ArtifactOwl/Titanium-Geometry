// Parsing for cart links in the URL.
//
// Used by our own quote links and by Meta's checkout URL, which substitutes
// product ids, quantities and a coupon code into a template. Kept pure so it
// can be tested on its own.

/** Pick the first present value among several possible parameter names. */
export function firstParam(query, names) {
  for (const name of names) {
    const value = query[name];
    if (value === undefined || value === null || value === "") continue;
    return Array.isArray(value) ? value.join(",") : String(value);
  }
  return "";
}

export const ITEM_PARAMS = ["products", "product_ids", "product_id", "items", "add"];
export const CODE_PARAMS = ["coupon_code", "coupon", "discount_code", "code"];

/**
 * Turn a cart link's query into product ids we recognise, plus a coupon code.
 * Accepts "ID", "ID:quantity" and "ID|quantity", comma separated. Quantity is
 * parsed but ignored — every piece is one of a kind.
 */
export function parseCartQuery(query, products) {
  const itemsParam = firstParam(query, ITEM_PARAMS);
  const codeParam = firstParam(query, CODE_PARAMS);

  const ids = [];
  const unknown = [];
  if (itemsParam) {
    for (const token of itemsParam.split(",")) {
      const raw = token.trim();
      if (!raw) continue;
      const wanted = raw.split(/[:|]/)[0].trim();
      if (!wanted) continue;
      const match = products.find(
        (p) =>
          p.id === wanted ||
          (p.itemId || "").toUpperCase() === wanted.toUpperCase()
      );
      if (match) {
        if (!ids.includes(match.id)) ids.push(match.id);
      } else {
        unknown.push(wanted);
      }
    }
  }

  return {
    ids,
    unknown,
    code: codeParam ? codeParam.trim().toUpperCase() : "",
    hadParams: Boolean(itemsParam || codeParam),
  };
}
