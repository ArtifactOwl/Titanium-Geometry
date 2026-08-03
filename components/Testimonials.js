// Customer quotes.
//
// Cold traffic from an ad arrives knowing nothing about the shop, so the
// blocker at $100+ is usually trust rather than desire. These render nothing at
// all when data/testimonials.json is empty, so pages stay clean until there is
// something real to show.

import React from "react";
import testimonialData from "../data/testimonials.json";

export const TESTIMONIALS = testimonialData.testimonials || [];

/**
 * A quote may name a category it's about (`group`). That matters in two places:
 * a knife quote must stay off the Facebook landing page, which leaves that
 * category out for Meta's weapons policy, and a product page should lead with
 * quotes about its own category when it has them.
 */
export default function Testimonials({
  title = "What Buyers Say",
  limit,
  compact = false,
  group,
  excludeGroups = [],
}) {
  const allowed = TESTIMONIALS.filter(
    (t) => !t.group || !excludeGroups.includes(t.group)
  );
  const matching = group ? allowed.filter((t) => t.group === group) : [];
  const general = allowed.filter((t) => !t.group);
  // Category-specific quotes first, then ones that fit anywhere. Quotes about
  // some *other* category are left out — they'd only be confusing.
  const ordered = [...matching, ...general];

  const shown = limit ? ordered.slice(0, limit) : ordered;
  if (shown.length === 0) return null;

  return (
    <section style={compact ? compactSectionStyle : sectionStyle}>
      {title && <h2 style={compact ? compactTitleStyle : titleStyle}>{title}</h2>}
      <div style={compact ? compactGridStyle : gridStyle}>
        {shown.map((t, i) => (
          <figure key={t.id || i} style={cardStyle}>
            {/* A customer's own photo of the piece being worn does what a
                product shot can't. Shown at its own shape rather than cropped
                to a square: these are usually phone portraits with the face
                high and the pendant near the bottom, and a centre crop cuts
                the pendant straight out. w/h come from the file so the browser
                reserves the right space instead of shifting the page. */}
            {t.photo && (
              <img
                src={t.photo}
                alt={`Customer photo${t.piece ? ` — ${t.piece}` : ""}`}
                loading="lazy"
                width={t.w || undefined}
                height={t.h || undefined}
                style={compact ? compactPhotoStyle : photoStyle}
              />
            )}
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

// Capped rather than 1fr: with a single quote, stretching a portrait photo
// across the full width fills the screen with somebody's face.
const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 320px))",
  justifyContent: "center",
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

const photoStyle = {
  width: "100%",
  height: "auto",
  borderRadius: 6,
  display: "block",
  marginBottom: "0.9rem",
  background: "#f3f4f6",
};

// Beside a product the card is full width, so cap the photo or a tall portrait
// takes over the page.
const compactPhotoStyle = { ...photoStyle, maxWidth: 220 };

const quoteStyle = {
  margin: "0 0 0.75rem",
  color: "#374151",
  lineHeight: 1.6,
  fontSize: "0.95rem",
  // Keep the line breaks people actually wrote — it reads more like a person
  // and less like marketing copy.
  whiteSpace: "pre-line",
};

const attribStyle = { fontSize: "0.85rem", color: "#6b7280" };
const nameStyle = { fontWeight: 600, color: "#111827" };
const metaStyle = { color: "#6b7280" };
const pieceStyle = { marginTop: "0.15rem", fontStyle: "italic" };
