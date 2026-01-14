import React, { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import products from "../data/products.json";

export default function Shop() {
  const router = useRouter();
  const [selectedGroup, setSelectedGroup] = useState("All");
  
  useEffect(() => {
    if (router.query.group) {
      setSelectedGroup(router.query.group);
    }
  }, [router.query.group]);

  const groups = ["All", ...products.groups];
  const allProducts = products.products;
  
  const filteredProducts = selectedGroup === "All" 
    ? allProducts 
    : allProducts.filter(p => p.group === selectedGroup);

  const availableProducts = filteredProducts.filter(p => p.status === 'available' || !p.status);
  const soldProducts = filteredProducts.filter(p => p.status === 'sold' || p.status === 'pending');

  return (
    <div style={pageStyle}>
      <Head>
        <title>Shop | Titanium Geometry</title>
        <meta name="description" content="Browse unique titanium pendant necklaces and keychains." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header style={headerStyle}>
        <Link href="/">
          <img src="/titanium-geometry-full-color.svg" alt="Titanium Geometry" style={{ height: 50, cursor: 'pointer' }} />
        </Link>
        <nav style={navStyle}>
          <Link href="/" style={navLinkStyle}>Home</Link>
          <Link href="/shop" style={{...navLinkStyle, fontWeight: 700}}>Shop</Link>
          <Link href="/why-titanium" style={navLinkStyle}>Why Titanium?</Link>
          <Link href="/previous-work" style={navLinkStyle}>Previous Work</Link>
          <Link href="/commission" style={navLinkStyle}>Commissions</Link>
          <Link href="/contact" style={navLinkStyle}>Contact</Link>
        </nav>
      </header>

      <main style={mainStyle}>
        <h1 style={h1Style}>Shop</h1>
        
        {/* Group Filter */}
        <div style={filterStyle}>
          {groups.map((group) => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              style={selectedGroup === group ? filterBtnActiveStyle : filterBtnStyle}
            >
              {group}
            </button>
          ))}
        </div>

        {/* Available Products */}
        {availableProducts.length > 0 ? (
          <div style={gridStyle}>
            {availableProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p style={emptyStyle}>No products available in this category right now. Check back soon!</p>
        )}

        {/* Sold Products (shown faded) */}
        {soldProducts.length > 0 && (
          <>
            <h2 style={h2Style}>Recently Sold</h2>
            <div style={gridStyle}>
              {soldProducts.map((product) => (
                <ProductCard key={product.id} product={product} sold />
              ))}
            </div>
          </>
        )}
      </main>

      <footer style={footerStyle}>
        <p>© {new Date().getFullYear()} Titanium Geometry | <a href="mailto:titaniumgeometry@gmail.com">titaniumgeometry@gmail.com</a></p>
      </footer>
    </div>
  );
}

function ProductCard({ product, sold }) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = `/pendants/${product.folder}/1.jpg`;
  const isPending = product.status === 'pending';
  const isSold = product.status === 'sold';
  
  return (
    <Link href={`/products/${product.id}`} style={{textDecoration: 'none', color: 'inherit'}}>
      <div style={{...cardStyle, opacity: (isSold || isPending) ? 0.6 : 1}}>
        {isSold && <div style={soldBadgeStyle}>SOLD</div>}
        {isPending && <div style={pendingBadgeStyle}>PENDING</div>}
        <div style={imageContainerStyle}>
          {!imageError ? (
            <img 
              src={imageSrc} 
              alt={product.name}
              style={imageStyle}
              onError={() => setImageError(true)}
            />
          ) : (
            <div style={placeholderStyle}>No Image</div>
          )}
        </div>
        <h3 style={cardTitleStyle}>{product.name}</h3>
        <p style={cardGroupStyle}>{product.group}</p>
        <p style={cardPriceStyle}>${product.price}</p>
      </div>
    </Link>
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
  fontSize: "2rem",
  marginBottom: "1.5rem",
};

const h2Style = {
  fontSize: "1.5rem",
  marginTop: "3rem",
  marginBottom: "1rem",
  color: "#6b7280",
};

const filterStyle = {
  display: "flex",
  gap: "0.5rem",
  marginBottom: "2rem",
  flexWrap: "wrap",
};

const filterBtnStyle = {
  padding: "0.5rem 1rem",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  background: "white",
  cursor: "pointer",
  fontSize: "0.9rem",
};

const filterBtnActiveStyle = {
  ...filterBtnStyle,
  background: "#111827",
  color: "white",
  borderColor: "#111827",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "1.5rem",
};

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  overflow: "hidden",
  cursor: "pointer",
  transition: "box-shadow 0.2s",
  position: "relative",
};

const soldBadgeStyle = {
  position: "absolute",
  top: "10px",
  right: "10px",
  background: "#ef4444",
  color: "white",
  padding: "0.25rem 0.5rem",
  borderRadius: "4px",
  fontSize: "0.75rem",
  fontWeight: "bold",
  zIndex: 1,
};

const pendingBadgeStyle = {
  position: "absolute",
  top: "10px",
  right: "10px",
  background: "#f59e0b",
  color: "white",
  padding: "0.25rem 0.5rem",
  borderRadius: "4px",
  fontSize: "0.75rem",
  fontWeight: "bold",
  zIndex: 1,
};

const imageContainerStyle = {
  width: "100%",
  height: "200px",
  overflow: "hidden",
  background: "#f3f4f6",
};

const imageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const placeholderStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#9ca3af",
};

const cardTitleStyle = {
  margin: "1rem 1rem 0.25rem",
  fontSize: "1rem",
};

const cardGroupStyle = {
  margin: "0 1rem",
  color: "#6b7280",
  fontSize: "0.85rem",
};

const cardPriceStyle = {
  margin: "0.5rem 1rem 1rem",
  fontWeight: "bold",
  fontSize: "1.1rem",
};

const emptyStyle = {
  textAlign: "center",
  color: "#6b7280",
  padding: "3rem",
};

const footerStyle = {
  borderTop: "1px solid #e5e7eb",
  padding: "2rem",
  textAlign: "center",
  color: "#6b7280",
};
