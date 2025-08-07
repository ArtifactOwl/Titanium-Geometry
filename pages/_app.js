import React from "react";
import Link from "next/link";

function MyApp({ Component, pageProps }) {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/">
          <img
            src="/titanium-geometry-full-color.svg"
            alt="Titanium Logo"
            style={{ height: "100px", cursor: "pointer" }}
          />
        </Link>
        <nav style={{ display: "flex", gap: "1rem" }}>
          <Link href="/">Home</Link>
          <Link href="/commission">Commission</Link>
        </nav>
      </header>

      <main style={{ marginTop: "3rem" }}>
        <Component {...pageProps} />
      </main>
    </div>
  );
}

export default MyApp;