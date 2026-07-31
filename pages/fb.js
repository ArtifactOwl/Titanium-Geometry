import React, { useMemo, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import products from "../data/products.json";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import YouTubeEmbed from "../components/YouTubeEmbed";
import { effectivePrice } from "../lib/pricing";
import { SORT_OPTIONS, filterProducts, sortProducts } from "../lib/search";

// Meta's commerce policy prohibits weapons, and an ad's landing page gets
// looked at too — so this page leaves that group out, exactly as the
// catalogue feed does. The rest of the site still shows it normally.
const EXCLUDED_GROUPS = ["Knives & Tools"];

// The "start to finish" clip, if it's still in the list.
const MAKING_OF =
  (products.youtubeVideos || []).find((v) => /start to finish/i.test(v.title || "")) ||
  (products.youtubeVideos || [])[0];

export default function FacebookLanding() {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("featured");

  const { promoted, rest } = useMemo(() => {
    const eligible = products.products.filter(
      (p) => !EXCLUDED_GROUPS.includes(p.group) && (p.status === "available" || !p.status)
    );
    return {
      promoted: eligible.filter((p) => p.fbFeatured),
      rest: eligible.filter((p) => !p.fbFeatured),
    };
  }, []);

  const shown = useMemo(
    () => sortProducts(filterProducts(rest, { query }), sortKey, effectivePrice),
    [rest, query, sortKey]
  );

  return (
    <div style={pageStyle}>
      <Head>
        <title>Titanium Geometry | One-of-a-Kind Titanium Pendants</title>
        <meta
          name="description"
          content="Individually laser engraved, cut, and anodized titanium pendants. Each piece is made once and never repeated."
        />
        {/* An ad landing page; keeping it out of search avoids competing with /shop */}
        <meta name="robots" content="noindex, follow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main style={mainStyle}>
        {promoted.length > 0 && (
          <section style={{ marginBottom: "2.5rem" }}>
            <h1 style={h1Style}>
              {promoted.length === 1 ? "The Piece You Saw" : "The Pieces You Saw"}
            </h1>
            <p style={introStyle}>
              Individually laser engraved, cut, and anodized — made once, then never
              repeated. The colors come from the metal itself, so they never crack,
              chip, or fade.
            </p>
            <div style={gridStyle}>
              {promoted.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {MAKING_OF && (
          <section style={videoSectionStyle}>
            <h2 style={{ ...h2Style, textAlign: "center" }}>How Each Piece Is Made</h2>
            <p style={videoIntroStyle}>
              Engraved, cut, and colored one at a time — the color is the titanium
              itself reacting, not paint.
            </p>
            <div style={{ maxWidth: "680px", margin: "0 auto" }}>
              <YouTubeEmbed id={MAKING_OF.id} title={MAKING_OF.title} />
            </div>
          </section>
        )}

        <section>
          <h2 style={h2Style}>
            {promoted.length > 0 ? "More One-of-a-Kind Pieces" : "One-of-a-Kind Pieces"}
          </h2>

          <div style={controlsStyle}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search — try “mandala”, “owl”, “blue”…"
              aria-label="Search products"
              style={searchStyle}
            />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              aria-label="Sort products"
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

          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <Link href="/shop" style={btnStyle}>
              See the Full Shop
            </Link>
          </div>
        </section>
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
const h2Style = { fontSize: "1.4rem", marginBottom: "1rem" };
const introStyle = {
  color: "#4b5563",
  textAlign: "center",
  maxWidth: "620px",
  margin: "0 auto 1.5rem",
  lineHeight: 1.6,
};
const videoSectionStyle = {
  margin: "0 0 2.5rem",
  padding: "1.75rem 0",
  borderTop: "1px solid #e5e7eb",
  borderBottom: "1px solid #e5e7eb",
};

const videoIntroStyle = {
  color: "#4b5563",
  textAlign: "center",
  maxWidth: "560px",
  margin: "0 auto 1.25rem",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "1.5rem",
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
