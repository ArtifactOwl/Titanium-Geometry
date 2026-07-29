import React, { useEffect } from "react";
import Script from "next/script";
import { useRouter } from "next/router";
import { CartProvider } from "../lib/cart";
import { pixelEnabled, pixelInitScript, trackPageView } from "../lib/fbpixel";

// Global styles
const globalStyles = `
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  
  a {
    color: inherit;
  }
  
  img {
    max-width: 100%;
  }
  
  /* Featured row on the homepage: a horizontal rail you can swipe or drag.
     How many cards fit is set here; the rest scroll into view. */
  .featured-rail {
    display: flex;
    gap: 1.5rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 0.75rem;
    cursor: grab;
    scrollbar-width: thin;
  }
  .featured-rail.dragging {
    cursor: grabbing;
    scroll-behavior: auto;   /* follow the pointer exactly while dragging */
    scroll-snap-type: none;
  }
  .featured-rail > * {
    flex: 0 0 calc((100% - 4 * 1.5rem) / 5);
    scroll-snap-align: start;
  }
  .featured-rail::-webkit-scrollbar { height: 8px; }
  .featured-rail::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 999px;
  }
  /* Dragging shouldn't select the text inside the cards. */
  .featured-rail.dragging * { user-select: none; }

  @media (max-width: 1150px) {
    .featured-rail > * { flex-basis: calc((100% - 3 * 1.5rem) / 4); }
  }
  @media (max-width: 900px) {
    .featured-rail > * { flex-basis: calc((100% - 2 * 1.5rem) / 3); }
  }
  @media (max-width: 650px) {
    .featured-rail { gap: 1rem; }
    .featured-rail > * { flex-basis: calc((100% - 1rem) / 2); }
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .product-layout {
      grid-template-columns: 1fr !important;
    }
    
    .content-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Count the first view and every client-side navigation after it.
  useEffect(() => {
    if (!pixelEnabled) return;
    trackPageView();
    router.events.on("routeChangeComplete", trackPageView);
    return () => router.events.off("routeChangeComplete", trackPageView);
  }, [router.events]);

  return (
    <CartProvider>
      <style jsx global>{globalStyles}</style>
      {pixelEnabled && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {pixelInitScript}
        </Script>
      )}
      <Component {...pageProps} />
    </CartProvider>
  );
}
