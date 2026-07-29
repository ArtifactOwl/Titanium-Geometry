# Meta Pixel (optional)

The Meta Pixel is a small script from Facebook that reports what visitors do on
the site — which pendant they looked at, what they added to the cart. Meta uses
that to show your ads to people who already viewed a specific piece, and to find
new people who behave like your buyers. It's what makes Advantage+ catalog ads
(the ones that rotate through your products) actually work.

**It is off by default.** With no Pixel ID configured, no Meta script loads and
nothing is sent to Facebook — verified: `fbq` is undefined and there are zero
requests to `connect.facebook.net`.

## Turning it on

1. In **Meta Events Manager**, create a pixel (a "web" data source). You'll get a
   15-ish digit **Pixel ID**.
2. In **Vercel** → your project → **Settings → Environment Variables**, add:

   ```
   Name:  NEXT_PUBLIC_FB_PIXEL_ID
   Value: <your pixel id>
   ```

   Apply it to Production (and Preview if you want it there too).
3. **Redeploy.** The variable is read at build time, so a redeploy is required —
   saving the variable alone does nothing.
4. Check it in Events Manager → your pixel → **Test Events**, then browse the
   live site. You should see events appear within a few seconds.

To turn it off again, delete the variable and redeploy.

## What gets sent

| Event | When | Data |
|---|---|---|
| `PageView` | every page, including in-site navigation | — |
| `ViewContent` | opening a product page | item ID, name, category, price |
| `AddToCart` | clicking Add to Cart | item ID, name, price |
| `InitiateCheckout` | clicking Check Out in the cart | all item IDs, count, order total |

Prices sent are the price **actually charged**, so a piece on flag sale reports
$60 rather than its $75 list price — ad values then match real revenue.

The item IDs (`G0046`) are deliberately the same IDs used in the catalog feed.
That match is what lets Meta connect "this person viewed G0046" to the G0046 in
your catalog and retarget them with that exact pendant.

## Purchases are not tracked

Checkout finishes on PayPal, and the buyer comes back to `/success`. Anyone can
open that page without paying, so firing a `Purchase` event there would feed Meta
made-up conversions and corrupt its optimisation. It's left out on purpose.

If accurate purchase tracking matters later, the honest way is implementing the
PayPal webhook (`/api/paypal-webhook`, currently a stub) and reporting purchases
server-side via Meta's Conversions API.

## Privacy and consent

This is third-party tracking: it follows visitors and shares their behaviour with
Meta. Because you ship internationally, visitors in the EU/UK are covered by
consent rules that generally require asking permission **before** loading a
tracking pixel, plus a privacy policy saying you use it.

This implementation loads the pixel for everyone once an ID is set — there is no
consent banner. If you want to advertise to EU/UK customers, the safer setup is a
consent banner that only enables the pixel after the visitor agrees. Ask and that
can be added.
