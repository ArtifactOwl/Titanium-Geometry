# Cart, coupons, and custom quotes

## The cart

Customers can add several pieces and pay once. Shipping is **flat per order** —
US free, Canada/Mexico $10, international $20 — no matter how many pieces are in
the cart. The single-item **Buy Now** button still works as before.

Checkout posts to PayPal using Payments Standard "cart upload"
(`cmd=_cart` + `upload=1`), one line per piece. Each line carries its item ID, so
your PayPal notification email still tells you exactly which pieces sold and you
mark them sold in the admin tool as usual.

The cart lives in the browser's localStorage. If a piece sells before someone
checks out, the cart page moves it to a "no longer available" notice and leaves
it out of the total.

## Coupons

Managed in the admin tool's **Coupons** tab, stored in `data/coupons.json`.
Only codes marked **Active** work on the site. A coupon has:

| Field | Meaning |
|---|---|
| Code | What the customer types (case-insensitive) |
| Discount | Either `$ off` or `% off` |
| Minimum order | Order must reach this before the code works (0 = no minimum) |
| Applies to | Everything, or a single category |
| Expires | Optional date; the code works through that whole day |
| Active | Off = the code is ignored |

Examples:
- **$20 off orders of $150+** — type `$ off`, value 20, minimum 150, applies to Everything.
- **10% off Geometric Pendants** — type `% off`, value 10, applies to Geometric Pendants.
  The discount is calculated on the Geometric items only, and if the coupon has a
  minimum it's measured against those items too.

A discount never exceeds the value of the items it applies to, and the discount is
passed to PayPal as `discount_amount_cart` so the buyer sees it on PayPal's page.

## Quoting a larger order (custom discount / "invoice")

For a customer who negotiated a price on a big order, the quickest route is a
one-off coupon plus a pre-filled cart link:

1. In the **Coupons** tab, add a code just for them — e.g. `JANE75`, $75 off,
   Active. (Set an expiry so it can't be reused indefinitely.)
2. Send them a link that fills the cart and applies the code automatically:

   ```
   https://titanium-geometry.vercel.app/cart?add=G0012,G0018,O0005&code=JANE75
   ```

   `add=` takes item IDs (or product slugs), separated by commas.
3. They open it, see the pieces and the discounted total, and pay through PayPal.
4. Deactivate or delete the code afterwards.

If they want a **printed/emailed invoice document** rather than a pay link, use the
receipt tool at `/receipt` — it makes a PDF with your details, the line items, tax,
and a discount, which you can share straight from your phone.

For a formal invoice with payment built in, PayPal's own invoicing (in your PayPal
business account) sends a proper invoice and collects payment; nothing here needs
to change to use it.

## A note on how this is enforced

Coupon rules are evaluated in the browser, and the amounts are submitted to PayPal
from the page — the same as the existing Buy Now button. Someone technical could
alter what's submitted, so check the amount on the PayPal notification before
shipping, as you already do for stock.
