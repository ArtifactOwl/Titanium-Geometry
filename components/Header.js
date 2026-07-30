// Shared site header. Every page uses this so the nav (and the cart badge)
// only has to be maintained in one place.

import React from "react";
import Link from "next/link";
import { useCart } from "../lib/cart";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/why-titanium", label: "Why Titanium?" },
  { href: "/previous-work", label: "Previous Work" },
  { href: "/commission", label: "Commissions" },
  { href: "/contact", label: "Contact" },
];

export default function Header({ active }) {
  const { count, loaded } = useCart();

  return (
    <header style={headerStyle}>
      <Link href="/">
        <img
          src="/logo-header.png"
          alt="Titanium Geometry"
          width={340}
          height={199}
          style={{ height: 50, width: "auto", cursor: "pointer" }}
        />
      </Link>
      <nav style={navStyle}>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={active === l.href ? { ...navLinkStyle, fontWeight: 700 } : navLinkStyle}
          >
            {l.label}
          </Link>
        ))}
        <Link href="/cart" style={cartLinkStyle} aria-label="Cart">
          <span aria-hidden="true">🛒</span> Cart
          {loaded && count > 0 && <span style={badgeStyle}>{count}</span>}
        </Link>
      </nav>
    </header>
  );
}

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
  alignItems: "center",
};

const navLinkStyle = {
  textDecoration: "none",
  color: "#374151",
  fontWeight: 500,
};

const cartLinkStyle = {
  textDecoration: "none",
  color: "#111827",
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
};

const badgeStyle = {
  background: "#0070ba",
  color: "#fff",
  borderRadius: "999px",
  fontSize: "0.75rem",
  fontWeight: 700,
  minWidth: "1.25rem",
  height: "1.25rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 0.35rem",
};
