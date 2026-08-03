import React, { useMemo, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import products from "../data/products.json";
import Header from "../components/Header";
import FeaturedRail from "../components/FeaturedRail";
import Footer from "../components/Footer";

export default function Home() {
  const groups = products.groups;
  const categoryImages = products.categoryImages || {};
  const availableProducts = products.products.filter(p => !p.sold);
  // All featured pieces; the rail scrolls horizontally through them.
  // Memoised so its identity is stable — the rail re-runs its ordering
  // whenever this prop changes.
  const featured = useMemo(
    () =>
      products.products.filter(
        (p) => p.featured && (p.status === "available" || !p.status)
      ),
    []
  );
  
  return (
    <div style={pageStyle}>
      <Head>
        <title>Titanium Geometry | Unique Titanium Pendants</title>
        <meta name="description" content="One-of-a-kind titanium pendants, keychains, knife handles and tools — individually laser engraved, cut, and anodized. Each piece is made once and never repeated." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      {/* Hero */}
      <main style={mainStyle}>
        <section style={heroStyle}>
          {/* Rendered to PNG from the logo SVG: the wordmark is set in Sylfaen,
              a Windows-only font, so the SVG mis-renders on phones and Macs. */}
          <img
            src="/logo-banner.png"
            alt="Titanium Geometry"
            width={1500}
            height={940}
            style={heroLogoStyle}
          />
          <h1 style={h1Style}>
            One-of-a-Kind Titanium Pendants
          </h1>
          <p style={subtitleStyle}>
            Every piece is individually laser engraved, cut, and anodized — made
            once, then never repeated. The colors come from the metal itself, so
            they never crack, chip, or fade.
          </p>

          <ul style={heroFactsStyle}>
            <li style={heroFactStyle}>Pendants</li>
            <li style={heroFactStyle}>Keychains</li>
            <li style={heroFactStyle}>Knife Handles</li>
            <li style={heroFactStyle}>Tools</li>
          </ul>
          <p style={heroMaterialsStyle}>
            Titanium · Brass · Steel · Tungsten
          </p>

          <div style={heroCtaStyle}>
            <Link href="/shop" style={btnPrimaryStyle}>Shop Available Pieces</Link>
            <Link href="/commission" style={btnOutlineStyle}>Custom Items &amp; Designs</Link>
          </div>

          <p style={heroContactStyle}>
            <a href="https://facebook.com/TitaniumGeometry" style={heroContactLinkStyle}
               target="_blank" rel="noopener noreferrer">facebook.com/TitaniumGeometry</a>
            {" · "}
            <a href="mailto:titaniumgeometry@gmail.com" style={heroContactLinkStyle}>
              titaniumgeometry@gmail.com
            </a>
          </p>
        </section>

        {featured.length > 0 && (
          <section style={sectionStyle}>
            <h2 style={h2Style}>Featured Pieces</h2>
            {featured.length > 2 && (
              <p style={railHintStyle}>Swipe or drag to see more →</p>
            )}
            <FeaturedRail products={featured} />
            <Link href="/shop" style={{ ...btnOutlineStyle, marginTop: "1.5rem", display: "inline-block" }}>
              See Everything
            </Link>
          </section>
        )}

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
                      loading="lazy"
                      decoding="async"
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
              <img src="/orbitals.jpg" alt="Geometric pendants" loading="lazy" decoding="async" style={sampleImageStyle} />
            </Link>
            <Link href="/shop">
              <img src="/selection.jpg" alt="View all products" loading="lazy" decoding="async" style={sampleImageStyle} />
            </Link>
            <Link href="/shop?group=Molecules">
              <img src="/dmtmolecule.jpg" alt="Molecule pendants" loading="lazy" decoding="async" style={sampleImageStyle} />
            </Link>
          </div>
        </section>

        {/* Mailing List */}
        <section style={mailingListStyle}>
          <h2 style={h2Style}>Stay Updated</h2>
          <p>Get notified when new pendants are available.</p>
          <MailingListSignup />
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Mailing list signup — posts to Formspree (same as the other forms)
function MailingListSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(""); // "" | "sending" | "ok" | "error"

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const response = await fetch("https://formspree.io/f/mjgnrkoe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          _subject: "New mailing list signup - Titanium Geometry",
          type: "mailing-list",
          email,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && !data.errors) {
        setStatus("ok");
        setEmail("");
      } else {
        throw new Error("failed");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  if (status === "ok") {
    return (
      <p style={{ color: "#059669", fontWeight: 500 }}>
        ✓ Thanks for subscribing! I&apos;ll be in touch when new pieces drop.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <input
        type="email"
        name="email"
        placeholder="your@email.com"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />
      <button type="submit" style={btnPrimaryStyle} disabled={status === "sending"}>
        {status === "sending" ? "…" : "Subscribe"}
      </button>
      {status === "error" && (
        <p style={{ color: "#b91c1c", fontSize: "0.85rem", width: "100%", margin: "0.25rem 0 0" }}>
          Couldn&apos;t subscribe — please email titaniumgeometry@gmail.com.
        </p>
      )}
    </form>
  );
}

// Styles
const pageStyle = {
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};




const mainStyle = {
  flex: 1,
  padding: "2rem",
  maxWidth: "1200px",
  margin: "0 auto",
  width: "100%",
};

const h1Style = {
  fontSize: "1.9rem",
  lineHeight: 1.2,
  textAlign: "center",
  fontWeight: 600,
  margin: "0 0 0.9rem",
};

const h2Style = {
  fontSize: "1.5rem",
  marginBottom: "1rem",
};

const heroStyle = {
  textAlign: "center",
  padding: "0.5rem 0 2.5rem",
};

const heroLogoStyle = {
  width: "100%",
  maxWidth: "560px",
  height: "auto",
  margin: "0 auto 1.25rem",
  display: "block",
};

const heroContactStyle = {
  marginTop: "1.5rem",
  color: "#6b7280",
  fontSize: "0.9rem",
};

const heroContactLinkStyle = {
  color: "#2563eb",
  textDecoration: "none",
};

const subtitleStyle = {
  textAlign: "center",
  color: "#4b5563",
  fontSize: "1.1rem",
  lineHeight: 1.6,
  maxWidth: "620px",
  margin: "0 auto 1.5rem",
};

const heroFactsStyle = {
  listStyle: "none",
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "0.5rem",
  padding: 0,
  margin: "0 0 0.75rem",
};

const heroFactStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "999px",
  padding: "0.3rem 0.9rem",
  fontSize: "0.9rem",
  color: "#374151",
};

const heroMaterialsStyle = {
  color: "#6b7280",
  fontSize: "0.9rem",
  letterSpacing: "0.03em",
  margin: "0 0 1.75rem",
};

const heroCtaStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "1rem",
  flexWrap: "wrap",
};

const railHintStyle = {
  color: "#6b7280",
  fontSize: "0.85rem",
  margin: "-0.5rem 0 1rem",
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


