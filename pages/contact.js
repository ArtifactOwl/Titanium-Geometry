import React from "react";
import Link from "next/link";

const CONTACT_EMAIL = "titaniumgeometry@gmail.com";

export default function Contact() {
  return (
    <div style={pageStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <Link href="/">
          <img src="/titanium-geometry-full-color.svg" alt="Titanium Geometry" style={{ height: 50, cursor: 'pointer' }} />
        </Link>
        <nav style={navStyle}>
          <Link href="/" style={navLinkStyle}>Home</Link>
          <Link href="/shop" style={navLinkStyle}>Shop</Link>
          <Link href="/why-titanium" style={navLinkStyle}>Why Titanium?</Link>
          <Link href="/previous-work" style={navLinkStyle}>Previous Work</Link>
          <Link href="/commission" style={navLinkStyle}>Commissions</Link>
          <Link href="/contact" style={{...navLinkStyle, fontWeight: 700}}>Contact</Link>
        </nav>
      </header>

      <main style={mainStyle}>
        <h1 style={h1Style}>Contact</h1>
        
        <div style={contentStyle}>
          <div style={cardStyle}>
            <h2 style={h2Style}>📧 Email</h2>
            <p>Best way to reach me for questions, commissions, or anything else.</p>
            <a href={`mailto:${CONTACT_EMAIL}`} style={emailLinkStyle}>{CONTACT_EMAIL}</a>
          </div>

          <div style={cardStyle}>
            <h2 style={h2Style}>⏱️ Response Time</h2>
            <p>I typically respond within 1-2 business days. If you don't hear back, please check your spam folder or try again.</p>
          </div>

          <div style={cardStyle}>
            <h2 style={h2Style}>🎨 Custom Work</h2>
            <p>Looking for a custom piece? Head to the <Link href="/commission" style={linkStyle}>Commissions</Link> page to submit a request.</p>
          </div>

          <div style={cardStyle}>
            <h2 style={h2Style}>📦 Shipping Questions</h2>
            <p>
              <strong>US:</strong> Free shipping included<br/>
              <strong>Canada/Mexico:</strong> +$10<br/>
              <strong>International:</strong> +$20
            </p>
            <p>All items ship via USPS within 1-3 business days of payment.</p>
          </div>
        </div>
      </main>

      <footer style={footerStyle}>
        <p>© {new Date().getFullYear()} Titanium Geometry | <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
      </footer>
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

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1rem 2rem",
  borderBottom: "1px solid #e5e7eb",
  flexWrap: "wrap",
  gap: "1rem",
};

const navStyle = {
  display: "flex",
  gap: "1.5rem",
  flexWrap: "wrap",
};

const navLinkStyle = {
  textDecoration: "none",
  color: "#374151",
  fontWeight: 500,
};

const mainStyle = {
  flex: 1,
  padding: "2rem",
  maxWidth: "800px",
  margin: "0 auto",
  width: "100%",
};

const h1Style = {
  fontSize: "2rem",
  marginBottom: "2rem",
};

const h2Style = {
  fontSize: "1.1rem",
  marginTop: 0,
  marginBottom: "0.5rem",
};

const contentStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "1.5rem",
};

const cardStyle = {
  background: "#f9fafb",
  padding: "1.5rem",
  borderRadius: "8px",
};

const emailLinkStyle = {
  display: "inline-block",
  marginTop: "0.5rem",
  color: "#2563eb",
  fontSize: "1.1rem",
  fontWeight: 500,
};

const linkStyle = {
  color: "#2563eb",
};

const footerStyle = {
  borderTop: "1px solid #e5e7eb",
  padding: "2rem",
  textAlign: "center",
  color: "#6b7280",
};
