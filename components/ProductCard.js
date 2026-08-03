// Shared product card, used by the shop grid and the homepage featured row,
// so pricing, sale badges and the featured badge look the same in both places.

import React, { useState } from "react";
import Link from "next/link";
import { priceInfo } from "../lib/pricing";
import { thumbSrc, fallbackToFull } from "../lib/images";

export default function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = thumbSrc(product.folder);
  const isPending = product.status === "pending";
  const isSold = product.status === "sold";
  const pricing = priceInfo(product);

  return (
    <Link href={`/products/${product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{ ...cardStyle, opacity: isSold || isPending ? 0.6 : 1 }}>
        {isSold && <div style={soldBadgeStyle}>SOLD</div>}
        {isPending && <div style={pendingBadgeStyle}>PENDING</div>}
        {product.featured && !isSold && !isPending && (
          <div style={featuredBadgeStyle}>★ Featured</div>
        )}
        <div style={imageContainerStyle}>
          {!imageError ? (
            // Lazy: a full shop grid is 80+ cards, and loading them all at once
            // is what made these pages slow.
            <img
              src={imageSrc}
              alt={product.name}
              loading="lazy"
              decoding="async"
              style={imageStyle}
              onError={fallbackToFull(product.folder)}
            />
          ) : (
            <div style={placeholderStyle}>No Image</div>
          )}
        </div>
        <h3 style={cardTitleStyle}>{product.name}</h3>
        <p style={cardGroupStyle}>{product.group}</p>
        {pricing.onSale ? (
          <p style={cardPriceStyle}>
            <span style={{ color: "#dc2626" }}>${pricing.final}</span>{" "}
            <span style={cardWasStyle}>${pricing.list}</span>{" "}
            <span style={cardSaleBadgeStyle}>SALE</span>
          </p>
        ) : (
          <p style={cardPriceStyle}>${pricing.final}</p>
        )}
      </div>
    </Link>
  );
}

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  overflow: "hidden",
  cursor: "pointer",
  transition: "box-shadow 0.2s",
  position: "relative",
  height: "100%",
  textAlign: "left",
};

const badgeBase = {
  position: "absolute",
  top: "10px",
  padding: "0.25rem 0.5rem",
  borderRadius: "4px",
  fontSize: "0.75rem",
  fontWeight: "bold",
  color: "white",
  zIndex: 1,
};

const soldBadgeStyle = { ...badgeBase, right: "10px", background: "#ef4444" };
const pendingBadgeStyle = { ...badgeBase, right: "10px", background: "#f59e0b" };
const featuredBadgeStyle = { ...badgeBase, left: "10px", background: "#111827" };

const imageContainerStyle = {
  width: "100%",
  height: "200px",
  overflow: "hidden",
  background: "#f3f4f6",
};

const imageStyle = { width: "100%", height: "100%", objectFit: "cover" };

const placeholderStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#9ca3af",
};

const cardTitleStyle = { margin: "1rem 1rem 0.25rem", fontSize: "1rem" };
const cardGroupStyle = { margin: "0 1rem", color: "#6b7280", fontSize: "0.85rem" };
const cardPriceStyle = { margin: "0.5rem 1rem 1rem", fontWeight: "bold", fontSize: "1.1rem" };
const cardWasStyle = {
  textDecoration: "line-through",
  color: "#9ca3af",
  fontWeight: "normal",
  fontSize: "0.95rem",
};
const cardSaleBadgeStyle = {
  background: "#dc2626",
  color: "white",
  padding: "0.1rem 0.4rem",
  borderRadius: "4px",
  fontSize: "0.7rem",
  fontWeight: "bold",
  verticalAlign: "middle",
};
