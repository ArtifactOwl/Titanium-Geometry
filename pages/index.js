import React from "react";
import Link from "next/link";
import products from "../data/products.json";

export default function Home() {
  const groups = products.groups;
  const categoryImages = products.categoryImages || {};
  const availableProducts = products.products.filter(p => !p.sold);
  
  return (
    <div style={pageStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <img src="/titanium-geometry-full-color.svg" alt="Titanium Geometry" style={{ height: 60 }} />
        <nav style={navStyle}>
          <Link href="/" style={navLinkStyle}>Home</Link>
          <Link href="/shop" style={navLinkStyle}>Shop</Link>
          <Link href="/why-titanium" style={navLinkStyle}>Why Titanium?</Link>
          <Link href="/previous-work" style={navLinkStyle}>Previous Work</Link>
          <Link href="/commission" style={navLinkStyle}>Commissions</Link>
          <Link href="/contact" style={navLinkStyle}>Contact</Link>
        </nav>
      </header>

      {/* Hero */}
      <main style={mainStyle}>
        <h1 style={h1Style}>Titanium Pendant Necklaces</h1>
        <p style={subtitleStyle}>
          Unique titanium pendants, keychain fobs, and tools with precision laser engraving, cutting, and anodized coloring.
          Each piece is one of a kind.
        </p>

        {/* Shop by Category */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Shop by Category</h2>
          <div style={gridStyle}>
            {groups.map((group) => {
              const count = availableProducts.filter(p => p.group === group).length;
              const imgSrc = categoryImages[group] || "/categories/default.jpg";
              return (
                <Link 
                  key={group} 
                  href={`/shop?group=${encodeURIComponent(group)}`}
                  style={cardStyle}
                >
                  <div style={cardImageContainerStyle}>
                    <img 
                      src={imgSrc} 
                      alt={group} 
                      style={cardImageStyle}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                  <h3 style={cardTitleStyle}>{group}</h3>
                  <p style={cardCountStyle}>{count} available</p>
                </Link>
              );
            })}
          </div>
          <Link href="/shop" style={btnPrimaryStyle}>View All Products</Link>
        </section>

        {/* Quick Links */}
        <section style={sectionStyle}>
          <div style={quickLinksStyle}>
            <Link href="/why-titanium" style={btnOutlineStyle}>
              Why Titanium & How It's Made
            </Link>
            <Link href="/previous-work" style={btnOutlineStyle}>
              Previous Work & Commissions
            </Link>
            <Link href="/commission" style={btnOutlineStyle}>
              Request Custom Design
            </Link>
          </div>
        </section>

        {/* Sample Images */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Sample Designs</h2>
          <div style={sampleImagesStyle}>
            <Link href="/shop?group=Geometric%20Pendants">
              <img src="/orbitals.jpg" alt="Geometric pendants" style={sampleImageStyle} />
            </Link>
            <Link href="/shop">
              <img src="/selection.jpg" alt="View all products" style={sampleImageStyle} />
            </Link>
            <Link href="/shop?group=Molecules">
              <img src="/dmtmolecule.jpg" alt="Molecule pendants" style={sampleImageStyle} />
            </Link>
          </div>
        </section>

        {/* Mailing List */}
        <section style={mailingListStyle}>
          <h2 style={h2Style}>Stay Updated</h2>
          <p>Get notified when new pendants are available.</p>
          <form 
            action="/api/mailing-list" 
            method="POST"
            style={formStyle}
          >
            <input 
              type="email" 
              name="email" 
              placeholder="your@email.com" 
              required
              style={inputStyle}
            />
            <button type="submit" style={btnPrimaryStyle}>Subscribe</button>
          </form>
        </section>
      </main>

      {/* Footer */}
      <footer style={footerStyle}>
        <p>© {new Date().getFullYear()} Titanium Geometry</p>
        <p>
          <a href="mailto:titaniumgeometry@gmail.com" style={footerLinkStyle}>
            titaniumgeometry@gmail.com
          </a>
        </p>
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
  maxWidth: "1200px",
  margin: "0 auto",
  width: "100%",
};

const h1Style = {
  fontSize: "2.5rem",
  textAlign: "center",
  marginBottom: "0.5rem",
};

const h2Style = {
  fontSize: "1.5rem",
  marginBottom: "1rem",
};

const subtitleStyle = {
  textAlign: "center",
  color: "#6b7280",
  maxWidth: "600px",
  margin: "0 auto 2rem",
};

const sectionStyle = {
  marginBottom: "3rem",
  textAlign: "center",
};

const sampleImagesStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "1rem",
  marginBottom: "2rem",
  flexWrap: "wrap",
};

const sampleImageStyle = {
  width: "250px",
  height: "250px",
  objectFit: "cover",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "1.5rem",
  marginBottom: "1.5rem",
};

const cardStyle = {
  display: "block",
  border: "2px solid #e5e7eb",
  borderRadius: "8px",
  textDecoration: "none",
  color: "inherit",
  transition: "border-color 0.2s, box-shadow 0.2s",
  cursor: "pointer",
  overflow: "hidden",
};

const cardImageContainerStyle = {
  width: "100%",
  height: "180px",
  background: "#f3f4f6",
  overflow: "hidden",
};

const cardImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const cardTitleStyle = {
  margin: "1rem 1rem 0.25rem",
  fontSize: "1.1rem",
};

const cardCountStyle = {
  margin: "0 1rem 1rem",
  color: "#6b7280",
  fontSize: "0.9rem",
};

const quickLinksStyle = {
  display: "flex",
  gap: "1rem",
  justifyContent: "center",
  flexWrap: "wrap",
};

const btnPrimaryStyle = {
  display: "inline-block",
  background: "#111827",
  color: "#fff",
  border: "none",
  padding: "0.75rem 1.5rem",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 600,
  textDecoration: "none",
  fontSize: "1rem",
};

const btnOutlineStyle = {
  display: "inline-block",
  background: "transparent",
  color: "#111827",
  border: "2px solid #111827",
  padding: "0.75rem 1.5rem",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 600,
  textDecoration: "none",
};

const mailingListStyle = {
  background: "#f9fafb",
  padding: "2rem",
  borderRadius: "8px",
  textAlign: "center",
};

const formStyle = {
  display: "flex",
  gap: "0.5rem",
  justifyContent: "center",
  marginTop: "1rem",
  flexWrap: "wrap",
};

const inputStyle = {
  padding: "0.75rem 1rem",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "1rem",
  width: "250px",
};

const footerStyle = {
  borderTop: "1px solid #e5e7eb",
  padding: "2rem",
  textAlign: "center",
  color: "#6b7280",
};

const footerLinkStyle = {
  color: "#6b7280",
};
