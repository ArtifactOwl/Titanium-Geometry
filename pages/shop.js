import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import products from "../data/products.json";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { effectivePrice } from "../lib/pricing";
import ProductCard from "../components/ProductCard";
import { SORT_OPTIONS, filterProducts, keywordCounts, sortProducts } from "../lib/search";

export default function Shop() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState([]); // empty = all categories
  const [sortKey, setSortKey] = useState("featured");

  // Arriving from a category card (/shop?group=Molecules) pre-ticks that box.
  useEffect(() => {
    if (router.query.group) {
      const wanted = String(router.query.group);
      setSelectedGroups(products.groups.includes(wanted) ? [wanted] : []);
    }
  }, [router.query.group]);

  const groups = products.groups;
  const allProducts = products.products;

  const toggleGroup = (group) =>
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );

  const filteredProducts = useMemo(
    () => filterProducts(allProducts, { query, groups: selectedGroups }),
    [allProducts, query, selectedGroups]
  );

  const sortFor = (list) => sortProducts(list, sortKey, effectivePrice);
  const availableProducts = sortFor(
    filteredProducts.filter((p) => p.status === "available" || !p.status)
  );
  const soldProducts = sortFor(
    filteredProducts.filter((p) => p.status === "sold" || p.status === "pending")
  );

  const topKeywords = useMemo(() => keywordCounts(allProducts).slice(0, 12), [allProducts]);
  const isFiltered = query.trim() !== "" || selectedGroups.length > 0;

  return (
    <div style={pageStyle}>
      <Head>
        <title>Shop | Titanium Geometry</title>
        <meta name="description" content="Browse unique titanium pendant necklaces and keychains." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header active="/shop" />

      <main style={mainStyle}>
        <h1 style={h1Style}>Shop</h1>
        
        {/* Search + sort */}
        <div style={searchRowStyle}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pieces — try “mandala”, “animals”, “blue”…"
            aria-label="Search products"
            style={searchInputStyle}
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            aria-label="Sort products"
            style={sortSelectStyle}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category checkboxes */}
        <div style={filterStyle}>
          {groups.map((group) => {
            const checked = selectedGroups.includes(group);
            return (
              <label key={group} style={checked ? checkboxActiveStyle : checkboxStyle}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleGroup(group)}
                  style={{ marginRight: "0.4rem" }}
                />
                {group}
              </label>
            );
          })}
          {isFiltered && (
            <button
              onClick={() => {
                setQuery("");
                setSelectedGroups([]);
              }}
              style={clearFilterStyle}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Keyword suggestions */}
        {topKeywords.length > 0 && (
          <div style={keywordRowStyle}>
            <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>Popular:</span>
            {topKeywords.map(({ keyword, count }) => (
              <button
                key={keyword}
                onClick={() => setQuery(keyword)}
                style={keywordChipStyle}
                title={`${count} piece${count === 1 ? "" : "s"}`}
              >
                {keyword}
              </button>
            ))}
          </div>
        )}

        <p style={resultCountStyle}>
          {availableProducts.length} available
          {soldProducts.length > 0 ? ` · ${soldProducts.length} sold` : ""}
          {isFiltered ? " matching your filters" : ""}
        </p>

        {/* Available Products */}
        {availableProducts.length > 0 ? (
          <div style={gridStyle}>
            {availableProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p style={emptyStyle}>
            {isFiltered
              ? "Nothing matches those filters. Try a different word or clear the filters."
              : "No products available right now. Check back soon!"}
          </p>
        )}

        {/* Sold Products (shown faded) */}
        {soldProducts.length > 0 && (
          <>
            <h2 style={h2Style}>Recently Sold</h2>
            <div style={gridStyle}>
              {soldProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}


// Styles
const pageStyle = {
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};




const mainStyle = {
  flex: 1,
  padding: "2rem",
  maxWidth: "1200px",
  margin: "0 auto",
  width: "100%",
};

const h1Style = {
  fontSize: "2rem",
  marginBottom: "1.5rem",
};

const h2Style = {
  fontSize: "1.5rem",
  marginTop: "3rem",
  marginBottom: "1rem",
  color: "#6b7280",
};

const filterStyle = {
  display: "flex",
  gap: "0.5rem",
  marginBottom: "2rem",
  flexWrap: "wrap",
};

const searchRowStyle = {
  display: "flex",
  gap: "0.75rem",
  marginBottom: "1rem",
  flexWrap: "wrap",
};

const searchInputStyle = {
  flex: "1 1 280px",
  padding: "0.7rem 0.9rem",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "1rem",
};

const sortSelectStyle = {
  padding: "0.7rem 0.9rem",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "0.95rem",
  background: "white",
};

const checkboxStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.45rem 0.8rem",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  background: "white",
  cursor: "pointer",
  fontSize: "0.9rem",
  userSelect: "none",
};

const checkboxActiveStyle = {
  ...checkboxStyle,
  background: "#111827",
  color: "white",
  // Full shorthand, not borderColor — React warns when the two are mixed
  // across re-renders of the same element.
  border: "1px solid #111827",
};

const clearFilterStyle = {
  padding: "0.45rem 0.8rem",
  border: "none",
  background: "none",
  color: "#2563eb",
  cursor: "pointer",
  fontSize: "0.9rem",
  textDecoration: "underline",
};

const keywordRowStyle = {
  display: "flex",
  gap: "0.4rem",
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: "1rem",
};

const keywordChipStyle = {
  padding: "0.25rem 0.6rem",
  border: "1px solid #e5e7eb",
  borderRadius: "999px",
  background: "#f9fafb",
  cursor: "pointer",
  fontSize: "0.8rem",
  color: "#374151",
};

const resultCountStyle = {
  color: "#6b7280",
  fontSize: "0.9rem",
  marginBottom: "1rem",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "1.5rem",
};













const emptyStyle = {
  textAlign: "center",
  color: "#6b7280",
  padding: "3rem",
};

