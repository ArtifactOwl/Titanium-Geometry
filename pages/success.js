import React from "react";
import Link from "next/link";

export default function Success() {
  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <Link href="/">
          <img src="/titanium-geometry-full-color.svg" alt="Titanium Geometry" style={{ height: 50, cursor: 'pointer' }} />
        </Link>
      </header>

      <main style={mainStyle}>
        <div style={cardStyle}>
          <div style={iconStyle}>✓</div>
          <h1 style={h1Style}>Thank You!</h1>
          <p style={textStyle}>
            Your order has been received. You'll receive a confirmation email from PayPal shortly.
          </p>
          <p style={textStyle}>
            I'll ship your pendant within 1-3 business days and send you tracking information.
          </p>
          <p style={noteStyle}>
            Questions? Email me at <a href="mailto:titaniumgeometry@gmail.com" style={linkStyle}>titaniumgeometry@gmail.com</a>
          </p>
          <Link href="/shop" style={btnStyle}>Continue Shopping</Link>
        </div>
      </main>
    </div>
  );
}

const pageStyle = {
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  minHeight: "100vh",
  background: "#f9fafb",
};

const headerStyle = {
  padding: "1rem 2rem",
  background: "white",
  borderBottom: "1px solid #e5e7eb",
};

const mainStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "4rem 2rem",
};

const cardStyle = {
  background: "white",
  padding: "3rem",
  borderRadius: "12px",
  textAlign: "center",
  maxWidth: "500px",
  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
};

const iconStyle = {
  width: "60px",
  height: "60px",
  background: "#10b981",
  color: "white",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "2rem",
  margin: "0 auto 1.5rem",
};

const h1Style = {
  marginBottom: "1rem",
};

const textStyle = {
  color: "#4b5563",
  marginBottom: "1rem",
};

const noteStyle = {
  background: "#f3f4f6",
  padding: "1rem",
  borderRadius: "6px",
  marginBottom: "1.5rem",
  fontSize: "0.9rem",
};

const linkStyle = {
  color: "#2563eb",
};

const btnStyle = {
  display: "inline-block",
  padding: "0.75rem 1.5rem",
  background: "#111827",
  color: "white",
  textDecoration: "none",
  borderRadius: "6px",
  fontWeight: 600,
};
