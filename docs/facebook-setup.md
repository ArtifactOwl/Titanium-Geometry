# Putting the catalog on Facebook & Instagram

The site already publishes a product feed that Meta can read on a schedule:

```
https://titaniumgeometry.com/facebook-feed.csv
```

It regenerates on every deploy, so the normal routine — mark something sold in
`product_admin.py`, push — keeps the shop up to date on its own. Nothing below
has to be repeated once it's set up.

Meta renames things in Commerce Manager fairly often, so treat the button names
as a guide rather than exact text.

---

## Before you start

You need:

- A **Facebook Page** for Titanium Geometry (a personal profile won't do).
- A **Meta Business account** (business.facebook.com) that owns the Page.
- Instagram is optional — link it later if you want Instagram Shopping too.

---

## 1. Create the catalog

1. Go to **business.facebook.com** → **Commerce Manager**.
2. **Add catalog** → catalog type **Ecommerce / Products** → **Upload product info**
   (this is the "I'll provide a feed" route, not a partner platform).
3. Name it `Titanium Geometry` and assign it to your business.

## 2. Connect the feed

1. In the catalog, open **Catalog → Data sources → Add products →
   Use bulk upload / Data feed**.
2. Choose **Scheduled feed** (not a one-time file upload — scheduled is what makes
   this automatic).
3. Paste the URL:

   ```
   https://titaniumgeometry.com/facebook-feed.csv
   ```

   No username or password — the file is public.
4. Set the fetch schedule to **Daily**. Pick a time you're usually not pushing.
5. Currency **USD**. Give the data source a name like `Website feed`.
6. Upload/fetch now to test it. You should see **68 items** picked up (that number
   grows as you add pieces).

If Meta reports errors, they'll be per-item and usually explain themselves.
Everything the feed sends has already been validated: every row has a title,
description, price, availability, brand, a public product link and at least one
public image over 500px.

## 3. Set up the shop (checkout on your website)

1. **Commerce Manager → Shops → Create a shop**, and pick the catalog you made.
2. For checkout, choose **Checkout on another website**.
   - This sends buyers to your product page, where the existing PayPal flow runs.
   - **Meta charges no selling fee for this.** You avoid bank details, tax setup,
     and order management inside Meta entirely.
3. Connect your Facebook Page (and Instagram account if you want it there too).
4. Submit for review. Approval usually takes a few days.

## 4. After approval

- Your shop appears on the Page under **Shop**, and items become taggable in posts.
- Collections are optional: the feed sends the product group as `custom_label_0`,
  so you can build a collection filtered to e.g. *Geometric Pendants* without any
  extra work.

---

## What the feed already handles for you

| Thing | Behaviour |
|---|---|
| New products | Appear after your next push + Meta's next fetch |
| Sold items | Sent as `out of stock` automatically (from `status`) |
| Sale prices | Regular price in `price`, discounted in `sale_price` |
| Extra photos | Up to 20 per item via `additional_image_link` |
| Item IDs | Used as the feed `id`, so they match your admin tool and PayPal |
| Knives & Tools | **Excluded** — see the warning below |

## Important: Knives & Tools stays off Facebook

Meta's commerce policy prohibits weapons, and pocket knives get caught by it.
`scripts/generate-facebook-feed.js` deliberately excludes that whole group. Don't
add those items to the catalog by hand — a rejection can put a strike on the
commerce account, not just the single listing.

The category still shows normally on your own website; only the Facebook feed
leaves it out.

## If you later move to titaniumgeometry.com

Every link in the feed points at the Vercel URL. When the custom domain is live,
set `SITE_URL=https://titaniumgeometry.com` as an environment variable in the
Vercel project and redeploy — the generator picks it up and rewrites every product
and image link. Then update the feed URL in Commerce Manager to match.

## Troubleshooting

- **"Feed not fetching"** — open the URL in a browser. It should download a CSV.
- **Items missing** — check the product isn't in Knives & Tools, and that it has at
  least one image in `public/pendants/<folder>/`.
- **Stale prices/stock** — Meta only sees what's deployed. Confirm you pushed, that
  Vercel finished building, then use **Fetch now** in the data source.
- **Item rejected** — read Meta's reason on the item; it's usually the image or a
  policy category rather than the data itself.
