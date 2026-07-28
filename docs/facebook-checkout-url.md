# Meta checkout URL

When someone checks out from the Facebook/Instagram shop, Meta sends them to a
URL on this site with the chosen products and any coupon filled in. The cart page
(`/cart`) is that endpoint — it reads the products and coupon out of the URL,
fills the cart, and shows the normal PayPal checkout.

## The URL to give Meta

```
https://titanium-geometry.vercel.app/cart?products={product_id}&coupon={coupon_code}
```

Two different things are going on in that URL, and it's worth being clear about
which is which:

- `products=` and `coupon=` are **our** parameter names. They're fixed — the cart
  page looks for these.
- `{product_id}` and `{coupon_code}` are **Meta's** placeholders. Meta swaps in
  the real values. Use whatever placeholder tokens Meta's own configuration tool
  offers you; the names in braces above are only illustrative.

So in Meta's tool, put our parameter name on the left of each `=`, and pick their
matching placeholder for the right.

## What the cart accepts

The endpoint is deliberately forgiving, so it works whichever way Meta formats
things:

| Products | Accepted |
|---|---|
| Parameter name | `products`, `product_ids`, `product_id`, `items`, or `add` |
| Several products | comma separated — `G0002,G0004` |
| With quantity | `G0002:1,G0004:1` or `G0002\|1` (quantity is ignored — every piece is one of a kind) |
| Identifier | the item ID from the feed (`G0002`) or the product slug (`sun-bloom`) |

| Coupon | Accepted |
|---|---|
| Parameter name | `coupon_code`, `coupon`, `discount_code`, or `code` |
| Case | any — `geo10` and `GEO10` both work |

The product IDs Meta sends are the `id` column of the feed, which is the item ID
(`G0002`, `O0011`) — the same number shown on the product page and in PayPal.

## Behaviour worth knowing before you test

- **Unknown product IDs are skipped**, not errored. Meta's test tool sometimes
  probes with a fake ID; the page still loads.
- **An unknown or inactive coupon** fills the box and explains itself
  ("That code is no longer active") rather than failing the page.
- **Sold pieces** are moved to a "no longer available" notice and left out of the
  total, so a stale Facebook listing can't sell something twice.
- After the cart is filled, the parameters are stripped from the address bar so a
  refresh doesn't add the items again.
- Coupons only work if they're marked **Active** in the admin tool's Coupons tab.

## Testing it yourself

Paste this in a browser — it should show two pieces and the code in the coupon box:

```
https://titanium-geometry.vercel.app/cart?products=G0002:1,G0004:1&coupon=GEO10
```

(`GEO10` ships inactive, so it will say the code isn't active — that's the coupon
setting, not the URL.)
