// Knives and tools on their own page.
//
// A clean URL to post on a knife forum, where landing on a shop full of
// pendants would waste the click. The exact inverse of /fb and /wearables,
// which leave this category out for Meta's weapons policy.

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

const GROUP = "Knives & Tools";

export default function KnivesPage() {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("newest");

  const available = useMemo(
    () =>
      products.products.filter(
        (p) => p.group === GROUP && (p.status === "available" || !p.status)
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
        <title>Titanium Knives &amp; Tools | Titanium Geometry</title>
        <meta
          name="description"
          content="One-of-a-kind titanium knife handles, utility knives and tools — individually laser engraved and anodized. The color is the titanium itself, not a coating."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main style={mainStyle}>
        <h1 style={h1Style}>Titanium Knives &amp; Tools</h1>
        <p style={introStyle}>
          Titanium, laser engraved and anodized one piece at a time. The color comes
          from the metal itself reacting — there is no paint, dye or coating on it, so
          nothing can chip or wear off the pattern. Every piece is engraved once and
          never repeated.
        </p>

        {available.length > 0 && (
          <p style={countStyle}>
            {available.length} available — each one is the only one.
          </p>
        )}

        <div style={controlsStyle}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search knives and tools…"
            aria-label="Search knives and tools"
            style={searchStyle}
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            aria-label="Sort"
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
          <p style={emptyStyle}>
            {available.length === 0
              ? "Everything here has sold. New pieces go up regularly."
              : "Nothing matches that search."}
          </p>
        )}

        {/* Scoped to this category, so the knife quote leads. */}
        <Testimonials title="What Buyers Say" limit={3} group={GROUP} />

        <div style={ctaStyle}>
          <p style={ctaTextStyle}>
            Want something engraved to your own design? Handles, blades and tools can be
            done to order.
          </p>
          <Link href="/commission" style={btnPrimaryStyle}>
            Request a Custom Piece
          </Link>
          <Link href="/shop" style={btnOutlineStyle}>
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
const h1Style = { fontSize: "1.9rem", marginBottom: "0.5rem", textAlign: "center" };
const introStyle = {
  color: "#4b5563",
  textAlign: "center",
  maxWidth: "640px",
  margin: "0 auto 0.75rem",
  lineHeight: 1.6,
};
const countStyle = {
  textAlign: "center",
  color: "#6b7280",
  fontSize: "0.9rem",
  margin: "0 0 1.5rem",
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
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "1.5rem",
  marginBottom: "2.5rem",
};
const emptyStyle = { color: "#6b7280", padding: "2rem", textAlign: "center" };
const ctaStyle = {
  textAlign: "center",
  marginTop: "2.5rem",
  paddingTop: "2rem",
  borderTop: "1px solid #e5e7eb",
};
const ctaTextStyle = { color: "#4b5563", maxWidth: "520px", margin: "0 auto 1rem" };
const btnPrimaryStyle = {
  display: "inline-block",
  padding: "0.75rem 1.5rem",
  margin: "0 0.35rem",
  background: "#111827",
  color: "white",
  textDecoration: "none",
  borderRadius: "6px",
};
const btnOutlineStyle = {
  display: "inline-block",
  padding: "0.75rem 1.5rem",
  margin: "0 0.35rem",
  border: "1px solid #111827",
  color: "#111827",
  textDecoration: "none",
  borderRadius: "6px",
};
