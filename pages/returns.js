import React from "react";
import Link from "next/link";
import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";

const CONTACT_EMAIL = "titaniumgeometry@gmail.com";
const RETURN_SHIPPING_US = 5;
const RETURN_SHIPPING_INTL = 20;

export default function Returns() {
  return (
    <div style={pageStyle}>
      <Head>
        <title>Returns &amp; Refunds | Titanium Geometry</title>
        <meta
          name="description"
          content="30-day returns on Titanium Geometry pendants. Return shipping is a flat $5 in the US and $20 international."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main style={mainStyle}>
        <h1 style={h1Style}>Returns &amp; Refunds</h1>
        <p style={introStyle}>
          Every piece is one of a kind, and I want you to be happy with the one you chose.
          If it isn&apos;t right, you can send it back within 30 days.
        </p>

        <div style={highlightStyle}>
          <div style={highlightItemStyle}>
            <div style={highlightNumStyle}>30 days</div>
            <div>to request a return, from the day it arrives</div>
          </div>
          <div style={highlightItemStyle}>
            <div style={highlightNumStyle}>${RETURN_SHIPPING_US}</div>
            <div>flat return shipping within the US</div>
          </div>
          <div style={highlightItemStyle}>
            <div style={highlightNumStyle}>${RETURN_SHIPPING_INTL}</div>
            <div>flat return shipping international</div>
          </div>
        </div>

        <h2 style={h2Style}>How it works</h2>
        <ol style={listStyle}>
          <li>
            Email me at{" "}
            <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Return request")}`} style={linkStyle}>
              {CONTACT_EMAIL}
            </a>{" "}
            within 30 days of delivery. Include the item number (for example
            &ldquo;G0012&rdquo;) so I can find your order.
          </li>
          <li>I&apos;ll reply with the return address and confirm the details.</li>
          <li>Post the piece back, packed so it can&apos;t be damaged on the way.</li>
          <li>
            Once it arrives and I&apos;ve checked it over, I&apos;ll refund you to your
            original payment method, usually within 3&ndash;5 business days.
          </li>
        </ol>

        <h2 style={h2Style}>Return shipping</h2>
        <p style={pStyle}>
          Return shipping is paid by the buyer at a flat rate — <strong>${RETURN_SHIPPING_US}</strong>{" "}
          within the United States and <strong>${RETURN_SHIPPING_INTL}</strong> internationally.
          This is deducted from your refund, so you don&apos;t need to pay anything up front.
        </p>
        <p style={pStyle}>
          If you originally paid for shipping on the order, that original shipping charge
          isn&apos;t refunded.
        </p>

        <h2 style={h2Style}>Condition</h2>
        <p style={pStyle}>
          Pieces need to come back in the condition they arrived in — unworn, undamaged, and
          with the cord and gift box. Titanium is tough, but a piece that has been engraved,
          altered, or damaged can&apos;t be refunded.
        </p>

        <h2 style={h2Style}>If something arrives damaged or wrong</h2>
        <p style={pStyle}>
          That&apos;s on me, not you. Email me with a photo and I&apos;ll sort it out — repair,
          replacement, or a full refund including shipping, at no cost to you. The 30-day
          window and the return shipping fee don&apos;t apply in that case.
        </p>

        <h2 style={h2Style}>Custom and commissioned pieces</h2>
        <p style={pStyle}>
          Commissioned work is made to your specification, so it isn&apos;t covered by the
          30-day return policy. I&apos;ll share the design for your approval before cutting, and
          if a finished commission isn&apos;t what we agreed on, get in touch and I&apos;ll make
          it right.
        </p>

        <div style={ctaStyle}>
          <p style={{ margin: "0 0 0.75rem" }}>Questions before you buy? Just ask.</p>
          <Link href="/contact" style={btnStyle}>
            Contact Me
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ===== styles ===== */
const pageStyle = {
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};

const mainStyle = {
  flex: 1,
  padding: "2rem",
  maxWidth: "760px",
  margin: "0 auto",
  width: "100%",
};

const h1Style = { fontSize: "2rem", marginBottom: "0.5rem" };

const introStyle = {
  color: "#4b5563",
  fontSize: "1.05rem",
  lineHeight: 1.6,
  marginBottom: "1.5rem",
};

const highlightStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "1rem",
  margin: "0 0 2rem",
};

const highlightItemStyle = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "1rem",
  textAlign: "center",
  color: "#4b5563",
  fontSize: "0.9rem",
};

const highlightNumStyle = {
  fontSize: "1.5rem",
  fontWeight: 700,
  color: "#111827",
  marginBottom: "0.25rem",
};

const h2Style = { fontSize: "1.2rem", marginTop: "2rem", marginBottom: "0.6rem" };

const pStyle = { lineHeight: 1.7, color: "#374151", marginBottom: "0.9rem" };

const listStyle = { lineHeight: 1.8, color: "#374151", paddingLeft: "1.25rem" };

const linkStyle = { color: "#2563eb" };

const ctaStyle = {
  marginTop: "2.5rem",
  padding: "1.5rem",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  textAlign: "center",
};

const btnStyle = {
  display: "inline-block",
  padding: "0.75rem 1.5rem",
  background: "#111827",
  color: "white",
  textDecoration: "none",
  borderRadius: "6px",
};
