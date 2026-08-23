// Pendants and keychains — the same pieces, shown with the fitting choice
// stated up front. Linked from the "Pendants" and "Keychains" words in the
// homepage hero, and safe to share anywhere knives shouldn't appear.

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import products from "../data/products.json";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import Testimonials from "../components/Testimonials";
import { effectivePrice } from "../lib/pricing";
import { SORT_OPTIONS, filterProducts, sortProducts } from "../lib/search";

// Knives and tools have their own fittings and aren't worn, so they're left
// out here — which also makes this page safe to link from Facebook.
const EXCLUDED_GROUPS = ["Knives & Tools"];

export default function WearablesPage() {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("featured");

  const available = useMemo(
    () =>
      products.products.filter(
        (p) => !EXCLUDED_GROUPS.includes(p.group) && (p.status === "available" || !p.status)
      ),
    []
  );

  const shown = useMemo(
    () => sortProducts(filterProducts(available, { query }), sortKey, effectivePrice),
    [available, query, sortKey]
  );

  return (
    <div style={pageStyle}>
      <Head>
        <title>Pendants &amp; Keychains | Titanium Geometry</title>
        <meta
          name="description"
          content="Every piece can be worn as a pendant necklace or carried as a keychain — your choice at checkout. Individually laser engraved, cut, and anodized titanium."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main style={mainStyle}>
        <section style={bannerStyle}>
          <p style={bannerHeadingStyle}>
            Every piece can be worn as a pendant necklace or carried as a keychain
          </p>
          <p style={bannerNoteStyle}>
            Same engraved piece either way — you pick the fitting at checkout, at no
            extra cost.
          </p>
        </section>

        <h1 style={h1Style}>Pendants &amp; Keychains</h1>
        <p style={introStyle}>
          Individually laser engraved, cut, and anodized — made once, then never
          repeated. The colors come from the metal itself, so they never crack, chip,
          or fade.
        </p>

        <div style={controlsStyle}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search — try “mandala”, “owl”, “blue”…"
            aria-label="Search pieces"
            style={searchStyle}
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            aria-label="Sort pieces"
            style={selectStyle}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {shown.length > 0 ? (
          <div style={gridStyle}>
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p style={emptyStyle}>Nothing matches that search.</p>
        )}

        <Testimonials limit={3} excludeGroups={EXCLUDED_GROUPS} />

        <div style={{ textAlign: "center", margin: "1rem 0 0" }}>
          <Link href="/shop" style={btnStyle}>
            See the Full Shop
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

const pageStyle = {
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};
const mainStyle = { flex: 1, padding: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%" };

const bannerStyle = {
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: 8,
  padding: "1rem 1.25rem",
  marginBottom: "1.75rem",
  textAlign: "center",
};
const bannerHeadingStyle = {
  margin: 0,
  fontWeight: 700,
  fontSize: "1.15rem",
  color: "#065f46",
  lineHeight: 1.4,
};
const bannerNoteStyle = { margin: "0.4rem 0 0", color: "#4b5563", fontSize: "0.9rem" };

const h1Style = { fontSize: "1.9rem", marginBottom: "0.5rem", textAlign: "center" };
const introStyle = {
  color: "#4b5563",
  textAlign: "center",
  maxWidth: "620px",
  margin: "0 auto 1.5rem",
  lineHeight: 1.6,
};
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "1.5rem",
  marginBottom: "2.5rem",
};
const controlsStyle = { display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" };
const searchStyle = {
  flex: "1 1 280px",
  padding: "0.7rem 0.9rem",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "1rem",
};
const selectStyle = {
  padding: "0.7rem 0.9rem",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "0.95rem",
  background: "white",
};
const emptyStyle = { color: "#6b7280", padding: "2rem", textAlign: "center" };
const btnStyle = {
  display: "inline-block",
  padding: "0.75rem 1.5rem",
  background: "#111827",
  color: "white",
  textDecoration: "none",
  borderRadius: "6px",
};
