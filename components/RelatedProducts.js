// A short row of pieces to look at next, chosen by lib/related.js.
//
// Every piece is one of a kind, so somebody who likes this one and finds it
// sold — or simply wants to compare — has nowhere obvious to go. This gives
// them three or four close matches without making them go back to the shop.

import React, { useMemo } from "react";
import productData from "../data/products.json";
import ProductCard from "./ProductCard";
import { relatedTo } from "../lib/related";

export default function RelatedProducts({ product, title = "You May Also Like", limit = 4 }) {
  const picks = useMemo(
    () => relatedTo(product, productData.products, limit),
    [product, limit]
  );

  if (!picks.length) return null;

  return (
    <section style={sectionStyle}>
      <h2 style={titleStyle}>{title}</h2>
      <div style={gridStyle}>
        {picks.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

const sectionStyle = {
  marginTop: "3rem",
  paddingTop: "2rem",
  borderTop: "1px solid #e5e7eb",
};

const titleStyle = { fontSize: "1.4rem", marginBottom: "1.25rem" };

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: "1.5rem",
};
