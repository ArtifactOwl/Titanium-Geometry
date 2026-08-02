import React, { useState } from "react";
import Link from "next/link";
import Head from "next/head";

const CONTACT_EMAIL = "titaniumgeometry@gmail.com";
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mjgnrkoe";

export default function Success() {
  return (
    <div style={pageStyle}>
      <Head>
        <title>Thank You | Titanium Geometry</title>
        <meta name="robots" content="noindex" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

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
          <NewWorkSignup />

          <p style={noteStyle}>
            Questions? Email me at <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>{CONTACT_EMAIL}</a>
          </p>
          <Link href="/shop" style={btnStyle}>Continue Shopping</Link>
        </div>
      </main>
    </div>
  );
}

/**
 * Mailing list signup, offered right after a purchase — the point at which
 * someone is most likely to want to hear about the next piece.
 */
function NewWorkSignup() {
  const [wants, setWants] = useState(true);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(""); // "" | "sending" | "ok" | "error"

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wants || !email.trim()) return;
    setStatus("sending");
    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          _subject: "New mailing list signup - Titanium Geometry",
          type: "mailing-list",
          source: "after purchase",
          email: email.trim(),
        }),
      });
      // Formspree can answer 200 with an error payload, so check both.
      const data = await response.json().catch(() => ({}));
      if (response.ok && !data.errors) setStatus("ok");
      else throw new Error("failed");
    } catch (err) {
      setStatus("error");
    }
  };

  if (status === "ok") {
    return (
      <div style={signupBoxStyle}>
        <p style={{ color: "#059669", fontWeight: 600, margin: 0 }}>
          ✓ You&apos;re on the list — new pieces and coupon codes will come by email.
        </p>
      </div>
    );
  }

  return (
    <div style={signupBoxStyle}>
      <label style={checkRowStyle}>
        <input
          type="checkbox"
          checked={wants}
          onChange={(e) => setWants(e.target.checked)}
          style={{ marginTop: "0.2rem" }}
        />
        <span style={{ fontWeight: 600 }}>Email me when new pieces go up</span>
      </label>
      <p style={signupNoteStyle}>
        A few times a month — plus coupon codes, which only go out by email.
        Every piece is one of a kind, so subscribers get first look.
      </p>

      {wants && (
        <form onSubmit={handleSubmit} style={signupFormStyle}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            aria-label="Email address"
            style={signupInputStyle}
          />
          <button type="submit" disabled={status === "sending"} style={signupBtnStyle}>
            {status === "sending" ? "Adding…" : "Sign me up"}
          </button>
        </form>
      )}

      {status === "error" && (
        <p style={signupErrorStyle}>
          That didn&apos;t go through — email me at{" "}
          <a href={`mailto:${CONTACT_EMAIL}?subject=Add me to the mailing list`} style={linkStyle}>
            {CONTACT_EMAIL}
          </a>{" "}
          and I&apos;ll add you.
        </p>
      )}
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

const signupBoxStyle = {
  textAlign: "left",
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: "8px",
  padding: "1rem 1.1rem",
  marginBottom: "1.5rem",
};

const checkRowStyle = {
  display: "flex",
  gap: "0.6rem",
  alignItems: "flex-start",
  cursor: "pointer",
  lineHeight: 1.4,
};

const signupNoteStyle = {
  color: "#4b5563",
  fontSize: "0.85rem",
  lineHeight: 1.5,
  margin: "0.5rem 0 0.75rem",
};

const signupFormStyle = { display: "flex", gap: "0.5rem", flexWrap: "wrap" };

const signupInputStyle = {
  flex: "1 1 170px",
  padding: "0.6rem",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "0.95rem",
};

const signupBtnStyle = {
  padding: "0.6rem 1rem",
  border: "none",
  borderRadius: "6px",
  background: "#059669",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};

const signupErrorStyle = {
  color: "#b91c1c",
  fontSize: "0.85rem",
  margin: "0.6rem 0 0",
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
