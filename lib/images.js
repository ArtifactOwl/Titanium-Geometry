// Where to find each size of a product photo.
//
// Three copies of every image live under public/:
//
//   /pendants/<folder>/N.jpg   the untouched original, several megabytes.
//                              Only ever fetched when a buyer opens the
//                              full-size view — the engraving detail is the
//                              whole point of these pieces, so it stays intact.
//   /img/<folder>/N.jpg        1400px. The product page's main image.
//   /thumb/<folder>/N.jpg      600px. Grids, carts, gallery thumbnails.
//
// Pages must never point a grid at /pendants — that was what made the shop
// pull hundreds of megabytes. Regenerate the two smaller trees with
// `python make_images.py` after adding photos.

export const fullSrc = (folder, n = 1) => `/pendants/${folder}/${n}.jpg`;
export const displaySrc = (folder, n = 1) => `/img/${folder}/${n}.jpg`;
export const thumbSrc = (folder, n = 1) => `/thumb/${folder}/${n}.jpg`;

/**
 * A derivative may not exist yet for a photo added since the last rebuild.
 * Falling back to the original keeps the image visible — just heavier — rather
 * than showing a broken box.
 */
export const fallbackToFull = (folder, n = 1) => (e) => {
  const full = fullSrc(folder, n);
  if (e.target.src.endsWith(full)) return; // already tried; let onError stop here
  e.target.src = full;
};
