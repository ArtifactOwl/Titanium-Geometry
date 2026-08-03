// Customer quotes.
//
// Cold traffic from an ad arrives knowing nothing about the shop, so the
// blocker at $100+ is usually trust rather than desire. These render nothing at
// all when data/testimonials.json is empty, so pages stay clean until there is
// something real to show.

import React from "react";
import testimonialData from "../data/testimonials.json";

export const TESTIMONIALS = testimonialData.testimonials || [];

export default function Testimonials({
  title = "What Buyers Say",
  limit,
  compact = false,
}) {
  const shown = limit ? TESTIMONIALS.slice(0, limit) : TESTIMONIALS;
  if (shown.length === 0) return null;

  return (
    <section style={compact ? compactSectionStyle : sectionStyle}>
      {title && <h2 style={compact ? compactTitleStyle : titleStyle}>{title}</h2>}
      <div style={compact ? compactGridStyle : gridStyle}>
        {shown.map((t, i) => (
          <figure key={t.id || i} style={cardStyle}>
            <blockquote style={quoteStyle}>“{t.quote}”</blockquote>
            <figcaption style={attribStyle}>
              <span style={nameStyle}>{t.name}</span>
              {t.location && <span style={metaStyle}> · {t.location}</span>}
              {t.piece && <div style={pieceStyle}>on {t.piece}</div>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

const sectionStyle = {
  margin: "0 0 2.5rem",
  padding: "1.75rem 0",
  borderTop: "1px solid #e5e7eb",
  borderBottom: "1px solid #e5e7eb",
};
const compactSectionStyle = { margin: "1.5rem 0 0" };

const titleStyle = { fontSize: "1.4rem", marginBottom: "1.25rem", textAlign: "center" };
const compactTitleStyle = { fontSize: "1.05rem", marginBottom: "0.75rem" };

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "1.25rem",
  maxWidth: "1000px",
  margin: "0 auto",
};
const compactGridStyle = { display: "grid", gap: "0.75rem" };

const cardStyle = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "1.1rem 1.2rem",
  margin: 0,
};

const quoteStyle = {
  margin: "0 0 0.75rem",
  color: "#374151",
  lineHeight: 1.6,
  fontSize: "0.95rem",
};

const attribStyle = { fontSize: "0.85rem", color: "#6b7280" };
const nameStyle = { fontWeight: 600, color: "#111827" };
const metaStyle = { color: "#6b7280" };
const pieceStyle = { marginTop: "0.15rem", fontStyle: "italic" };
