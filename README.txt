# Titanium Geometry - Update Package

This package contains ONLY the files that need to be updated.
DO NOT replace your data/products.json - it contains your products!

## Files to Copy

Copy all files from this zip into your project, maintaining the folder structure:

```
product_admin.py          -> your project root
pages/                    -> pages/
  _app.js
  shop.js
  index.js
  why-titanium.js
  previous-work.js
  commission.js
  contact.js
  success.js
  api/
    commission-request.js
    mailing-list.js
  products/
    [id].js
```

## What's New

1. **Admin App - Videos Tab**
   - Add YouTube video URLs with titles
   - Videos display on the "Why Titanium?" page
   - Supports multiple URL formats (youtube.com, youtu.be, or just video ID)

2. **Product Status System**
   - Available: Normal buy button
   - Sold: SOLD badge, no buy button
   - Pending: PENDING badge, contact form instead of buy button

3. **All page headers** now include "Why Titanium?" link

## DO NOT REPLACE

- `data/products.json` - Contains your products!
- `public/` folder - Contains your images!

## After Copying

You may need to add `youtubeVideos` array to your products.json manually.
Add this line after `"previousWork": []`:

```json
"youtubeVideos": []
```

Or just use the admin app - it will create the field automatically when you add a video.
