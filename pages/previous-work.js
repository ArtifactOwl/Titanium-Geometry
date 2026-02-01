import React, { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import products from "../data/products.json";

const CONTACT_EMAIL = "titaniumgeometry@gmail.com";

export default function PreviousWork() {
  const previousWork = products.previousWork || [];
  const [showForm, setShowForm] = useState(null); // item id or null
  
  return (
    <div style={pageStyle}>
      <Head>
        <title>Previous Work | Titanium Geometry</title>
        <meta name="description" content="Gallery of previous titanium pendant commissions." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* Header */}
      <header style={headerStyle}>
        <Link href="/">
          <img src="/titanium-geometry-full-color.svg" alt="Titanium Geometry" style={{ height: 50, cursor: 'pointer' }} />
        </Link>
        <nav style={navStyle}>
          <Link href="/" style={navLinkStyle}>Home</Link>
          <Link href="/shop" style={navLinkStyle}>Shop</Link>
          <Link href="/why-titanium" style={navLinkStyle}>Why Titanium?</Link>
          <Link href="/previous-work" style={{...navLinkStyle, fontWeight: 700}}>Previous Work</Link>
          <Link href="/commission" style={navLinkStyle}>Commissions</Link>
          <Link href="/contact" style={navLinkStyle}>Contact</Link>
        </nav>
      </header>

      <main style={mainStyle}>
        <h1 style={h1Style}>Previous Work</h1>
        <p style={introStyle}>
          These pieces have found homes, but I'd be happy to create something similar for you.
          Each commission is unique - choose your own colors and size preferences.
        </p>

        <div style={gridStyle}>
          {previousWork.map((item) => (
            <PreviousWorkCard 
              key={item.id} 
              item={item}
              showForm={showForm === item.id}
              onToggleForm={() => setShowForm(showForm === item.id ? null : item.id)}
            />
          ))}
        </div>

        {previousWork.length === 0 && (
          <p style={emptyStyle}>Previous work gallery coming soon!</p>
        )}

        <div style={ctaStyle}>
          <h2>Have a custom design in mind?</h2>
          <p>I create completely original pieces as well as variations on previous work.</p>
          <Link href="/commission" style={btnPrimaryStyle}>Request a Commission</Link>
        </div>
      </main>

      <footer style={footerStyle}>
        <p>© {new Date().getFullYear()} Titanium Geometry | <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
      </footer>
    </div>
  );
}

function PreviousWorkCard({ item, showForm, onToggleForm }) {
  const [formData, setFormData] = useState({
    email: '',
    colors: '',
    size: '',
    notes: ''
  });
  
  const imageSrc = `/previous-work/${item.folder}/1.jpg`;
  const videoSrc = `/previous-work/${item.folder}/video.mp4`;
  
  const emailSubject = `Commission Request: ${item.name}`;
  const emailBody = `Hi,\n\nI'm interested in commissioning a piece similar to "${item.name}".\n\nColor preferences: \nSize preferences: \n\nThanks!`;
  const mailtoLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('https://formspree.io/f/xbddlgjg', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `Commission Request: ${item.name}`,
          itemName: item.name,
          type: 'previous-work-request',
          email: formData.email,
          colors: formData.colors,
          size: formData.size,
          notes: formData.notes
        })
      });
      
      if (response.ok) {
        alert('Request sent! I\'ll be in touch soon.');
        onToggleForm();
        setFormData({ email: '', colors: '', size: '', notes: '' });
      } else {
        throw new Error('Form failed');
      }
    } catch (error) {
      // Fallback to mailto
      window.location.href = mailtoLink;
    }
  };

  return (
    <div style={cardStyle}>
      <div style={mediaContainerStyle}>
        <ImageWithFallback src={imageSrc} alt={item.name} style={imageStyle} />
        <VideoWithFallback src={videoSrc} style={videoStyle} />
      </div>
      
      <div style={cardContentStyle}>
        <h3 style={cardTitleStyle}>{item.name}</h3>
        {item.description && <p style={cardDescStyle}>{item.description}</p>}
        
        <div style={buttonRowStyle}>
          <a href={mailtoLink} style={btnEmailStyle}>
            📧 Email to Request
          </a>
          <button onClick={onToggleForm} style={btnFormStyle}>
            📝 Fill Out Form
          </button>
        </div>
        
        {showForm && (
          <form onSubmit={handleSubmit} style={formStyle}>
            <input
              type="email"
              placeholder="Your email *"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Color preferences"
              value={formData.colors}
              onChange={(e) => setFormData({...formData, colors: e.target.value})}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Size preferences"
              value={formData.size}
              onChange={(e) => setFormData({...formData, size: e.target.value})}
              style={inputStyle}
            />
            <textarea
              placeholder="Additional notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              style={textareaStyle}
              rows={3}
            />
            <button type="submit" style={btnSubmitStyle}>Send Request</button>
          </form>
        )}
      </div>
    </div>
  );
}

function ImageWithFallback({ src, alt, style }) {
  const [error, setError] = useState(false);
  if (error) return null;
  return <img src={src} alt={alt} style={style} onError={() => setError(true)} />;
}

function VideoWithFallback({ src, style }) {
  const [error, setError] = useState(false);
  if (error) return null;
  return (
    <video controls style={style} onError={() => setError(true)}>
      <source src={src} type="video/mp4" />
    </video>
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
  marginBottom: "0.5rem",
};

const introStyle = {
  color: "#6b7280",
  marginBottom: "2rem",
  maxWidth: "600px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: "2rem",
};

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  overflow: "hidden",
};

const mediaContainerStyle = {
  background: "#f3f4f6",
};

const imageStyle = {
  width: "100%",
  height: "250px",
  objectFit: "cover",
};

const videoStyle = {
  width: "100%",
  display: "block",
};

const cardContentStyle = {
  padding: "1rem",
};

const cardTitleStyle = {
  margin: "0 0 0.5rem",
  fontSize: "1.1rem",
};

const cardDescStyle = {
  color: "#6b7280",
  fontSize: "0.9rem",
  marginBottom: "1rem",
};

const buttonRowStyle = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
};

const btnEmailStyle = {
  padding: "0.5rem 1rem",
  background: "#111827",
  color: "white",
  border: "none",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "0.85rem",
  cursor: "pointer",
};

const btnFormStyle = {
  padding: "0.5rem 1rem",
  background: "white",
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "0.85rem",
  cursor: "pointer",
};

const formStyle = {
  marginTop: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const inputStyle = {
  padding: "0.5rem",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  fontSize: "0.9rem",
};

const textareaStyle = {
  ...inputStyle,
  resize: "vertical",
};

const btnSubmitStyle = {
  padding: "0.5rem 1rem",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: 500,
};

const emptyStyle = {
  textAlign: "center",
  color: "#6b7280",
  padding: "3rem",
};

const ctaStyle = {
  marginTop: "3rem",
  padding: "2rem",
  background: "#f9fafb",
  borderRadius: "8px",
  textAlign: "center",
};

const btnPrimaryStyle = {
  display: "inline-block",
  marginTop: "1rem",
  padding: "0.75rem 1.5rem",
  background: "#111827",
  color: "white",
  textDecoration: "none",
  borderRadius: "6px",
  fontWeight: 600,
};

const footerStyle = {
  borderTop: "1px solid #e5e7eb",
  padding: "2rem",
  textAlign: "center",
  color: "#6b7280",
};
