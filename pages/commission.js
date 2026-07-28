import React, { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import Header from "../components/Header";

const CONTACT_EMAIL = "titaniumgeometry@gmail.com";

export default function Commission() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designType: 'custom',
    description: '',
    colors: '',
    size: '',
    budget: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('https://formspree.io/f/mjgnrkoe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: 'Commission Request - Titanium Geometry',
          name: formData.name,
          email: formData.email,
          designType: formData.designType,
          description: formData.description,
          colors: formData.colors,
          size: formData.size,
          budget: formData.budget
        })
      });

      // Formspree can return HTTP 200 with an error body, so check the body too.
      const data = await response.json().catch(() => ({}));
      if (response.ok && !data.errors) {
        setSubmitted(true);
      } else {
        throw new Error('Form submission failed');
      }
    } catch (err) {
      setError(
        `Sorry — your request couldn't be sent automatically. Please email me directly at ${CONTACT_EMAIL}.`
      );
    }
    setSubmitting(false);
  };

  return (
    <div style={pageStyle}>
      <Head>
        <title>Request a Commission | Titanium Geometry</title>
        <meta name="description" content="Request a custom titanium pendant design." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header active="/commission" />

      <main style={mainStyle}>
        <h1 style={h1Style}>Commission a Custom Piece</h1>
        
        <div style={contentStyle}>
          <div style={infoStyle}>
            <h2 style={h2Style}>How It Works</h2>
            <ol style={listStyle}>
              <li><strong>Tell me your vision</strong> - Describe the design, colors, and size you're looking for</li>
              <li><strong>Get a quote</strong> - I'll reply with pricing and timeline</li>
              <li><strong>Approve the design</strong> - I'll send mockups for your approval</li>
              <li><strong>Creation</strong> - Your piece is laser engraved, colored, and cut</li>
              <li><strong>Delivery</strong> - Ships within 1-2 weeks of approval</li>
            </ol>

            <h2 style={h2Style}>What I Can Create</h2>
            <ul style={listStyle}>
              <li>Molecule pendants (any chemical structure)</li>
              <li>Geometric designs</li>
              <li>Custom logos or symbols</li>
              <li>Judaic and religious designs</li>
              <li>Memorial pieces</li>
              <li>Keychains and accessories</li>
            </ul>

            <h2 style={h2Style}>Pricing</h2>
            <p>Custom pieces typically range from $75-150 depending on complexity. 
            I'll provide an exact quote after discussing your design.</p>
            
            <p style={noteStyle}>
              <strong>Note:</strong> You can also browse <Link href="/previous-work" style={linkStyle}>Previous Work</Link> and 
              request a similar piece with your own color choices.
            </p>
          </div>

          <div style={formContainerStyle}>
            {submitted ? (
              <div style={successStyle}>
                <h2>✓ Request Sent!</h2>
                <p>I'll get back to you within 1-2 business days.</p>
                <Link href="/shop" style={btnStyle}>Browse Current Pieces</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={formStyle}>
                <h2 style={formTitleStyle}>Request a Commission</h2>
                
                <label style={labelStyle}>
                  Your Name *
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Email *
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Design Type
                  <select
                    value={formData.designType}
                    onChange={(e) => setFormData({...formData, designType: e.target.value})}
                    style={inputStyle}
                  >
                    <option value="custom">Completely custom design</option>
                    <option value="similar">Similar to a previous work piece</option>
                    <option value="molecule">Molecule / Chemical structure</option>
                    <option value="geometric">Geometric pattern</option>
                    <option value="judaic">Judaic design</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Describe Your Design *
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell me about the design you're envisioning..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Color Preferences
                  <input
                    type="text"
                    placeholder="e.g., Blue and purple, warm tones, etc."
                    value={formData.colors}
                    onChange={(e) => setFormData({...formData, colors: e.target.value})}
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Size Preferences
                  <input
                    type="text"
                    placeholder="e.g., 2 inches, larger than standard, etc."
                    value={formData.size}
                    onChange={(e) => setFormData({...formData, size: e.target.value})}
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Budget Range (optional)
                  <input
                    type="text"
                    placeholder="e.g., $75-100"
                    value={formData.budget}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    style={inputStyle}
                  />
                </label>

                <button type="submit" style={submitStyle} disabled={submitting}>
                  {submitting ? "Sending…" : "Send Request"}
                </button>

                {error && (
                  <p style={errorStyle}>
                    {error}
                  </p>
                )}

                <p style={altStyle}>
                  Or email directly: <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>{CONTACT_EMAIL}</a>
                </p>
              </form>
            )}
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




const mainStyle = {
  flex: 1,
  padding: "2rem",
  maxWidth: "1200px",
  margin: "0 auto",
  width: "100%",
};

const h1Style = {
  fontSize: "2rem",
  marginBottom: "2rem",
};

const h2Style = {
  fontSize: "1.25rem",
  marginTop: "1.5rem",
  marginBottom: "0.75rem",
};

const contentStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "3rem",
};

const infoStyle = {
  lineHeight: 1.6,
};

const listStyle = {
  paddingLeft: "1.25rem",
  marginBottom: "1rem",
};

const noteStyle = {
  background: "#f9fafb",
  padding: "1rem",
  borderRadius: "6px",
  marginTop: "1.5rem",
};

const linkStyle = {
  color: "#2563eb",
};

const formContainerStyle = {};

const formStyle = {
  background: "#f9fafb",
  padding: "1.5rem",
  borderRadius: "8px",
};

const formTitleStyle = {
  marginTop: 0,
  marginBottom: "1.5rem",
};

const labelStyle = {
  display: "block",
  marginBottom: "1rem",
  fontWeight: 500,
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "0.75rem",
  marginTop: "0.25rem",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "1rem",
  fontWeight: "normal",
};

const submitStyle = {
  width: "100%",
  padding: "0.875rem",
  background: "#111827",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
  marginTop: "0.5rem",
};

const altStyle = {
  textAlign: "center",
  marginTop: "1rem",
  color: "#6b7280",
  fontSize: "0.9rem",
};

const errorStyle = {
  marginTop: "1rem",
  padding: "0.75rem 1rem",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "6px",
  color: "#b91c1c",
  fontSize: "0.9rem",
};

const successStyle = {
  background: "#f0fdf4",
  border: "1px solid #86efac",
  borderRadius: "8px",
  padding: "2rem",
  textAlign: "center",
};

const btnStyle = {
  display: "inline-block",
  marginTop: "1rem",
  padding: "0.75rem 1.5rem",
  background: "#111827",
  color: "white",
  textDecoration: "none",
  borderRadius: "6px",
};

const footerStyle = {
  borderTop: "1px solid #e5e7eb",
  padding: "2rem",
  textAlign: "center",
  color: "#6b7280",
};
