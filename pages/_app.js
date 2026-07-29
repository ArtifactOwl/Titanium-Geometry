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
  
  /* Featured row on the homepage: up to 5 across, fewer as the screen
     narrows. Extras are hidden rather than wrapping, so it stays one
     tidy row at every width. */
  .featured-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(5, 1fr);
  }
  @media (max-width: 1150px) {
    .featured-grid { grid-template-columns: repeat(4, 1fr); }
    .featured-grid > *:nth-child(n + 5) { display: none; }
  }
  @media (max-width: 900px) {
    .featured-grid { grid-template-columns: repeat(3, 1fr); }
    .featured-grid > *:nth-child(n + 4) { display: none; }
  }
  @media (max-width: 650px) {
    .featured-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .featured-grid > *:nth-child(n + 3) { display: none; }
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
