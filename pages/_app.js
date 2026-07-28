import React from "react";
import { CartProvider } from "../lib/cart";

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
  return (
    <CartProvider>
      <style jsx global>{globalStyles}</style>
      <Component {...pageProps} />
    </CartProvider>
  );
}
