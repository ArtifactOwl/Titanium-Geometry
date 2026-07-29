# AI product descriptions (ChatGPT)

Workflow for having ChatGPT write descriptions from the product photos, for new
items that still have the default (boilerplate-only) description.

## Steps

1. **Export the photos that need descriptions** (renamed by folder so ChatGPT can
   match them):

   ```
   python export_images_for_ai.py
   ```

   This copies the primary photo of every product still using the default
   description into `ai-descriptions-images/`, named like `eye-of-illusion.jpg`.
   (Use `--after 2026-07-01` to also limit by created date, or `--all` for everything.)

2. **In ChatGPT**, paste the prompt below, then:
   - paste the contents of `data/products.json`, and
   - upload all the images from `ai-descriptions-images/`.

3. **Save ChatGPT's reply** (the JSON array it returns) to a file, e.g. `descriptions.json`.

4. **Apply it** to the site data:

   ```
   python apply_descriptions.py descriptions.json
   ```

   This updates the matching products, backs up `products.json` first, and only
   touches the description fields.

5. **Review and push:**

   ```
   git diff data/products.json
   git add data/products.json
   git commit -m "Add AI-written descriptions for new items"
   git push
   ```

---

## The prompt

```text
You are a product copywriter for "Titanium Geometry," a shop selling one-of-a-kind
titanium pendants. Each piece is a laser-engraved, laser-cut design finished with
anodized color (the color comes from anodizing the titanium itself — it is not paint,
ink, or coating, and it will never chip or fade).

TASK
For each product I give you, look at its photo and write a short, unique product
description, then append my standard details block verbatim.

WHICH PRODUCTS TO WRITE FOR (skip everything else)
I will paste my products list as JSON. Only write descriptions for products that meet
EITHER of these conditions:
  1. Their "description" is still the default boilerplate (it matches the STANDARD
     BLOCK below, with no unique intro line above it), OR
  2. Their "created" date is on or after [CUTOFF DATE]  (format YYYY-MM-DD).
Skip any product that already has a real, unique description.

HOW TO MATCH PHOTOS TO PRODUCTS
I will upload the product photos. Each file is named with the product's "folder"
value (e.g. eye-of-illusion.jpg). Match each photo to the product by that name. If a
product qualifies but I did not upload its photo, leave it out of your output.

WRITING RULES (the unique intro)
- 1 to 3 sentences, roughly 15-45 words. Present tense.
- Say what the design depicts (use the product "name" as a guide) and name the
  anodized colors you actually see in the photo.
- Evocative but grounded and specific. No hype cliches, no emojis, no exclamation
  overload, no invented backstory or symbolism unless it's clearly the subject.
- Describe ONLY what is visible. Do NOT state dimensions, weight, or measurements —
  you can't measure from a photo. If a size reference feels needed, write the literal
  placeholder "[size]" so I can fill it in.
- Do not repeat the Includes/Shipping/Care content in your intro.

SEARCH KEYWORDS
Also give each product 3-6 short keywords for the shop's search box. These are
never shown to customers — they only make the piece findable. Rules:
- lower case, single words or very short phrases
- describe the SUBJECT and STYLE, plus the main colours
- REUSE these standard words wherever they apply, rather than inventing synonyms:
    geometry, mandala, sacred geometry, fractal, molecule, animals, nature,
    knotwork, optical illusion, biomechanical, judaic, abstract, floral, space
- add the obvious colours you see (blue, gold, purple, rainbow, silver...)
- no punctuation, no duplicates, nothing about titanium/pendant/necklace
  (every piece is those, so they're useless for narrowing a search)

OUTPUT FORMAT
Return ONLY a JSON array, nothing else. Each element:
  { "id": "<the product's id from the JSON I pasted>",
    "description": "<your intro>\n\n<STANDARD BLOCK verbatim>",
    "keywords": ["mandala", "geometry", "blue"] }
Use the product's "id" (not the folder or name) as the id. Put your intro, then a
blank line, then the standard block, all inside the single "description" string.

STANDARD BLOCK (include verbatim at the end of every description, after a blank line):
Includes:
• Titanium pendant with precision laser engraving
• Necklace with Clasp (or keychain attachment on request)
• Gift box

Shipping:
• US orders ship free via USPS First Class (3-5 business days)
• International shipping available

Care:
• Titanium is hypoallergenic and will not tarnish
• Can be safely worn in the shower, chlorine pools, & the ocean
• Clean with mild soap and water and scrub gently with a toothbrush
• Skin oils, sunscreen, etc. may temporarily change the visible coloration; cleaning with soap restores the original color

Confirm you understand, then wait for me to paste the JSON and upload the photos.
```

> Tip: set `[CUTOFF DATE]` to catch the batch you just added (e.g. `2026-07-01`).
> The `[size]` placeholder is your cue to add a measurement before publishing.
