// Meta (Facebook) Pixel.
//
// Entirely optional and OFF unless NEXT_PUBLIC_FB_PIXEL_ID is set in the Vercel
// project settings. With no id, every function here is a no-op and no Meta
// script is loaded — so the site ships untracked by default.
//
// Setup: docs/facebook-pixel.md

export const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "";
export const pixelEnabled = Boolean(PIXEL_ID);

/** The snippet Meta provides, minus the automatic first PageView — routing
 *  sends that itself so single-page navigations are counted too. */
export const pixelInitScript = `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
`;

function fbq(...args) {
  if (!pixelEnabled) return;
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq(...args);
}

export function trackPageView() {
  fbq("track", "PageView");
}

/**
 * Product events carry the item ID (G0012) because that's the `id` column in
 * the catalog feed — matching them is what lets Meta retarget a specific piece.
 */
export function trackViewContent(product, price) {
  if (!product) return;
  fbq("track", "ViewContent", {
    content_type: "product",
    content_ids: [product.itemId || product.id],
    content_name: product.name,
    content_category: product.group,
    // The price actually charged, so ad values match real revenue.
    value: Number(price != null ? price : product.price || 0),
    currency: "USD",
  });
}

export function trackAddToCart(product, price) {
  if (!product) return;
  fbq("track", "AddToCart", {
    content_type: "product",
    content_ids: [product.itemId || product.id],
    content_name: product.name,
    value: Number(price != null ? price : product.price || 0),
    currency: "USD",
  });
}

export function trackInitiateCheckout(products, value) {
  fbq("track", "InitiateCheckout", {
    content_type: "product",
    content_ids: (products || []).map((p) => p.itemId || p.id),
    num_items: (products || []).length,
    value: Number(value || 0),
    currency: "USD",
  });
}
