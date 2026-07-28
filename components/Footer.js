// Shared site footer, so policy links only have to be added in one place.

import React from "react";
import Link from "next/link";

const CONTACT_EMAIL = "titaniumgeometry@gmail.com";

export default function Footer() {
  return (
    <footer style={footerStyle}>
      <p style={{ margin: "0 0 0.5rem" }}>
        © {new Date().getFullYear()} Titanium Geometry |{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>
          {CONTACT_EMAIL}
        </a>
      </p>
      <p style={{ margin: 0, fontSize: "0.9rem" }}>
        <Link href="/returns" style={linkStyle}>
          Returns &amp; Refunds
        </Link>
        {" · "}
        <Link href="/shop" style={linkStyle}>
          Shop
        </Link>
        {" · "}
        <Link href="/commission" style={linkStyle}>
          Commissions
        </Link>
      </p>
    </footer>
  );
}

const footerStyle = {
  borderTop: "1px solid #e5e7eb",
  padding: "2rem",
  textAlign: "center",
  color: "#6b7280",
};

const linkStyle = { color: "#6b7280" };
