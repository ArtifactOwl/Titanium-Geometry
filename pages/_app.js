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
